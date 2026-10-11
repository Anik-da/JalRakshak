# JalRakshak AI — Cloud Architecture & Technical Specifications

This document details the architectural specifications, data access patterns, and mathematical models of **JalRakshak AI**.

---

## 1. AWS Cloud Services Topology

```
+-----------------------------------------------------------------------------------+
|                                  AWS Cloud                                        |
|                                                                                   |
|  +--------------------+        +---------------------+      +------------------+  |
|  |   Amazon Cognito   |        |  Amazon CloudFront  |      |   Amazon S3      |  |
|  |     User Pools     |        |   Edge CDN (OAC)    |----->| (Frontend SPA)   |  |
|  +--------------------+        +---------------------+      +------------------+  |
|            |                              |                                       |
|            | (JWT Claims)                 | (Web Requests)                        |
|            v                              v                                       |
|  +---------------------------------------------------+                            |
|  |             Amazon API Gateway (HTTP API v2)      |                            |
|  |          - Cognito JWT Authorizer ($request)      |                            |
|  |          - CORS: Origins, Methods, Headers        |                            |
|  +---------------------------------------------------+                            |
|                           |                                                       |
|                           v                                                       |
|  +---------------------------------------------------+                            |
|  |           AWS Lambda (Node.js 20.x TypeScript)    |                            |
|  |    • Reports Handler       • Risk Engine          |                            |
|  |    • Presigner (S3)        • Weather Adapter      |                            |
|  |    • Route Evaluator       • Admin Moderation     |                            |
|  +---------------------------------------------------+                            |
|         |                     |                     |                             |
|         v                     v                     v                             |
|  +------------------+  +------------------+  +------------------+                 |
|  | Amazon DynamoDB  |  | Amazon S3 (Media)|  | Amazon CloudWatch|                 |
|  | - Reports Table  |  | - Presigned PUT  |  | - Execution Logs |                 |
|  | - Audit Table    |  | - Private Bucket |  | - Retention: 30d |                 |
|  | - Weather Cache  |  +------------------+  +------------------+                 |
|  +------------------+                                                             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Amazon DynamoDB Schema & Access Patterns

### Table 1: `JalRakshak-Reports`
- **Billing Mode:** `PAY_PER_REQUEST` (On-Demand)
- **Partition Key (`HASH`):** `reportId` (String, e.g. `rep-17917035-abc12`)
- **Global Secondary Index 1 (`StatusIndex`):**
  - **PK:** `status` (String, e.g. `UNVERIFIED`, `VERIFIED`, `REJECTED`)
  - **SK:** `submittedAt` (String, ISO 8601)
  - **Projection:** `ALL`
  - **Access Pattern:** Fetch recent reports by status order for moderation queue or public map.
- **Global Secondary Index 2 (`UserIdIndex`):**
  - **PK:** `userId` (String, e.g. Cognito User Sub)
  - **SK:** `submittedAt` (String, ISO 8601)
  - **Projection:** `ALL`
  - **Access Pattern:** Fetch authenticated user's submission history (`/api/v1/me/reports`).

### Table 2: `JalRakshak-Audit`
- **Billing Mode:** `PAY_PER_REQUEST`
- **Partition Key (`HASH`):** `auditId` (String, e.g. `aud-17917035`)
- **Sort Key (`RANGE`):** `timestamp` (String, ISO 8601)
- **Access Pattern:** Chronological retrieval of privileged verification and rejection actions.

### Table 3: `JalRakshak-WeatherCache`
- **Billing Mode:** `PAY_PER_REQUEST`
- **Partition Key (`HASH`):** `locationKey` (String, e.g. `13.08,80.27`)
- **TTL Attribute:** `ttl` (Unix epoch timestamp for automated expiration)
- **Access Pattern:** Fast single-digit millisecond retrieval of cached synoptic weather.

---

## 3. Mathematical Risk Scoring Engine

The flood risk scoring algorithm evaluates multi-dimensional signals deterministically to calculate an integer score $R \in [0, 100]$.

### 1. Observation Severity Weighting ($W_s$)
$$\text{Weight}(\text{severity}) = \begin{cases} 
15 & \text{if LOW} \\
35 & \text{if MODERATE} \\
65 & \text{if HIGH} \\
85 & \text{if CRITICAL}
\end{cases}$$

### 2. Temporal Freshness Decay ($D(t)$)
Given report age in hours $t = \frac{t_{\text{now}} - t_{\text{observed}}}{3600}$:
$$D(t) = \begin{cases} 
1.00 & \text{if } t \le 3 \\
0.85 & \text{if } 3 < t \le 6 \\
0.60 & \text{if } 6 < t \le 12 \\
0.30 & \text{if } 12 < t \le 24 \\
0.10 & \text{if } t > 24
\end{cases}$$

### 3. Verification Multiplier ($V$)
$$V = \begin{cases}
1.00 & \text{if VERIFIED} \\
0.80 & \text{if UNVERIFIED}
\end{cases}$$

### 4. Baseline Anchor Score
$$S_{\text{base}} = \max_{i} \left( W_s(i) \times D(t_i) \times V(i) \right)$$

### 5. Multi-Witness Corroboration Bonus ($C$)
For up to $N = 5$ additional independent reports:
$$C = \min(5, \text{Count} - 1) \times 5 \quad (\text{Max } +25 \text{ pts})$$

### 6. Blocked Passage Penalty ($B$)
For $K$ blocked road observations:
$$B = \min(20, K \times 8) \quad (\text{Max } +20 \text{ pts})$$

### 7. Synoptic Rainfall Contribution ($P$)
Based on accumulated rainfall $P_{\text{mm}}$ over the preceding 6 hours:
$$P = \begin{cases}
25 & \text{if } P_{\text{mm}} \ge 75 \text{ mm (Extreme)} \\
18 & \text{if } 35 \le P_{\text{mm}} < 75 \text{ mm (Heavy)} \\
10 & \text{if } 15 \le P_{\text{mm}} < 35 \text{ mm (Moderate)} \\
4  & \text{if } 0 < P_{\text{mm}} < 15 \text{ mm (Light)} \\
0  & \text{otherwise}
\end{cases}$$

### 8. Final Score & Clamping
$$R = \min\left(100, \max\left(0, \text{round}\left(S_{\text{base}} + C + B + P\right)\right)\right)$$

### 9. Decoupled Confidence Assessment
$$\text{Confidence} = \begin{cases}
\text{HIGH} & \text{if } \text{ValidReports} \ge 3 \text{ and } (\text{VerifiedCount} \ge 1 \text{ or } P_{\text{mm}} > 0) \\
\text{MEDIUM} & \text{if } \text{ValidReports} \ge 1 \text{ or } P_{\text{mm}} > 15 \\
\text{LOW} & \text{otherwise}
\end{cases}$$

---

## 4. Duplicate Detection Algorithm

To prevent review queue fatigue and artificial risk inflation:
1. Spatial Distance: Evaluated via Haversine spherical geometry.
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
2. Candidate Threshold: If $d \le 350\text{m}$ and $|t_1 - t_2| \le 240\text{ minutes}$, the submission is flagged as a candidate duplicate of existing report $ID_1$.
3. Non-punitive Policy: The report is still saved and attributed, but its scoring weight is deduplicated and queued for moderator consolidation.

---

## 5. RESTful API Contract

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/api/v1/health` | GET | Public | Service health & AWS telemetry status |
| `/api/v1/reports` | GET | Public | Filtered list of sanitized public flood reports |
| `/api/v1/reports/:id` | GET | Public | Single report details (with private fields stripped) |
| `/api/v1/risk` | GET | Public | Deterministic sector flood risk & factor weights |
| `/api/v1/rainfall` | GET | Public | Synoptic precipitation & hourly forecasts |
| `/api/v1/map-summary` | GET | Public | Operational totals: active, verified, blocked roads |
| `/api/v1/route-hazards`| POST | Public | Transit corridor buffer hazard inspection |
| `/api/v1/reports` | POST | Bearer JWT | Submit new flood hazard observation |
| `/api/v1/uploads/presign`| POST | Bearer JWT | Generate short-lived S3 photo upload URL |
| `/api/v1/reports/:id/flags`| POST | Bearer JWT | Flag inaccurate or suspicious report |
| `/api/v1/me/reports` | GET | Bearer JWT | Authenticated user's personal report history |
| `/api/v1/admin/reports`| GET | Admin Role | Review queue with unverified/flagged filters |
| `/api/v1/admin/reports/:id/verify`| POST | Admin Role | Verify report with audit rationale |
| `/api/v1/admin/reports/:id/reject`| POST | Admin Role | Reject report with mandatory reason |
| `/api/v1/admin/metrics`| GET | Admin Role | Real computed moderation queue metrics |
| `/api/v1/admin/audits` | GET | Admin Role | Immutable administrative audit log trail |
