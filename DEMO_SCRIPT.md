# JalRakshak AI — Demo Video Presentation Script (Under 3 Minutes)

> **Target Duration:** 2 minutes 45 seconds  
> **Presenter Tone:** Confident, civic-minded, crisp, technically grounded  
> **Key Message:** Real AWS-backed community flood intelligence with cartographic clarity.

---

### [0:00 – 0:30] Hook & Problem Introduction
- **Visual:** Screen shows the photography-led hero on the Landing Page (`http://localhost:5173/`).
- **Narration:**
  > "Every monsoon, urban cloudbursts turn familiar city streets into hazardous rivers within minutes. Drivers turn onto flooded underpasses with zero warning, risking vehicle stall and life-threatening emergencies. 
  > 
  > Welcome to **JalRakshak AI — Community Flood Intelligence & Safer Mobility Platform**, our project for the WeMakeDevs Environmental Hacks 2026 under the Heat and Water track. Built 100% on Amazon Web Services using Google Antigravity."

---

### [0:30 – 1:00] Cartographic Hazard Map & Live Telemetry
- **Action:** Click **Explore Flood Map** (`/map`). Pan the map, show CARTO Light tiles, filter for *Blocked Only*, and click on the critical marker at **T. Nagar South Usman Road**.
- **Visual:** The floating report inspection card slides into view with photos, water depth (70cm), and verified status.
- **Narration:**
  > "Unlike generic dark-mode dashboards, JalRakshak AI embraces a Light Cartographic Intelligence design identity. 
  > 
  > On our interactive map, every hazard marker communicates risk level, road passability, and verification status at a glance. Clicking this marker shows 70 centimeters of waterlogging under South Usman flyover, corroborated by field volunteers and stored directly in Amazon DynamoDB."

---

### [1:00 – 1:35] Submitting a Flood Hazard (4-Step Wizard)
- **Action:** Click **Report Flood** (`/report`).
  - Step 1: Drag the map pin on Poonamallee High Road.
  - Step 2: Set severity to *Critical*, road condition to *Blocked*, water depth to *50 cm*, and enter a short description.
  - Step 3: Demonstrate S3 presigned URL photo attachment.
  - Step 4: Check public consent and submit.
- **Visual:** Real API creates the record, displays report ID, and triggers duplicate candidate detection.
- **Narration:**
  > "Submitting a hazard report is intuitive and progressive. 
  > 
  > Citizens pinpoint the exact coordinate on the interactive map, select water passability, and attach field photos via short-lived Amazon S3 presigned URLs. 
  > 
  > Notice our multi-witness engine immediately checks for spatial duplicates within 350 meters, preventing score inflation while ensuring public safety."

---

### [1:35 – 2:05] Deterministic Risk Intelligence & Synoptic Rainfall
- **Action:** Click **Intelligence** (`/risk`).
- **Visual:** Display the 0–100 deterministic risk gauge, explainable factor weights, and Open-Meteo precipitation graph.
- **Narration:**
  > "Here in our Risk Intelligence module, we eliminate AI hallucinations. 
  > 
  > Our deterministic Lambda scoring engine calculates a 0 to 100 risk score, separating hazard severity from evidence confidence. It incorporates exponential freshness decay for older reports and cross-references live synoptic rainfall telemetry from our server-side weather adapter."

---

### [2:05 – 2:30] Safer Route Mobility Assistance
- **Action:** Click **Safer Routes** (`/routes`). Click **Analyze Corridor Hazards**.
- **Visual:** Display the transit corridor hazard summary: flags the blocked road on South Usman Road and suggests alternative routes.
- **Narration:**
  > "Before departing, commuters can test planned transit corridors. 
  > 
  > The engine inspects a 600-meter buffer around the travel path, identifies nearby flooded bottlenecks, and warns drivers to divert via elevated expressways before they get trapped."

---

### [2:30 – 2:45] Municipal Moderation & Conclusion
- **Action:** Click **Admin Moderation** (`/admin`). Show the verification queue and click **Verify** on an active report with an audit note. Show the immutable DynamoDB audit ledger.
- **Visual:** Audit log updates in real-time.
- **Narration:**
  > "Finally, municipal ward coordinators have a dedicated moderation console where every verification or rejection is permanently logged into an immutable DynamoDB audit trail.
  > 
  > Built exclusively on AWS with API Gateway, Lambda, DynamoDB, Cognito, and CloudFront — JalRakshak AI brings verified environmental intelligence to Indian monsoon transit. Thank you!"
