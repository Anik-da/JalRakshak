# WeMakeDevs Environmental Hacks 2026 — Project Submission

## Project Name
**JalRakshak AI — Community Flood Intelligence & Safer Mobility Platform**

## Track
**Heat and Water**

## AI Development Tool
**Google Antigravity**

---

## 1. Elevator Pitch
**JalRakshak AI** is an AWS-powered civic platform that transforms chaotic monsoon street flooding into actionable, community-verified mobility intelligence. By combining street-level resident observations with synoptic meteorological telemetry, our deterministic risk engine calculates explainable hazard scores, detects duplicate reports, and guides commuters along safer transit corridors around submerged roads.

---

## 2. Problem Statement
Every monsoon season across Indian metropolitan areas (Chennai, Mumbai, Bengaluru, Delhi), extreme rainfall causes rapid waterlogging in underpasses, service lanes, and low-lying transit corridors. 
- **The Information Gap:** Municipal flood bulletins are updated in 6-hour cycles, while road conditions change in 15 minutes.
- **The Safety Risk:** Commuters drive blindly into standing floodwaters, resulting in stranded vehicles, traffic paralysis, and life-threatening emergencies ("Turn Around Don't Drown").
- **The Trust Deficit:** Social media alerts are often unverified, outdated, or duplicated, causing panic or false senses of security.

---

## 3. Solution & Innovation
JalRakshak AI solves this through a 4-pillar system:
1. **Cartographic Intelligence Experience:** A light-themed, atlas-inspired interface built with React, Leaflet, and Tailwind CSS that prioritizes geographical calm, readability, and immediate comprehension over generic dark-mode dashboards.
2. **Deterministic & Explainable Risk Scoring Engine:** A transparent 0–100 flood hazard score that mathematically decouples hazard severity from evidence confidence, incorporates exponential freshness decay for older reports, and provides exact factor attribution.
3. **Multi-Witness Deduplication:** Spatial and temporal buffering (350m / 240 mins) detects corroborating reports, preventing artificial risk inflation while signaling strong community consensus.
4. **Corridor Transit Assistance:** Inspects origin-destination paths against a 600m buffer of active hazards, alerting drivers to impassable blockages before they depart.

---

## 4. Cloud Architecture (Exclusively Amazon Web Services)
- **Frontend Delivery:** Amazon CloudFront CDN with Origin Access Control (OAC) serving a static React/Vite single-page application hosted in Amazon S3.
- **API Layer:** Amazon API Gateway HTTP API v2 with sub-10ms routing and native Amazon Cognito JWT Authorizer.
- **Compute:** AWS Lambda functions written in Node.js 20.x TypeScript for deterministic scoring, spatial queries, and presigned media uploads.
- **Persistence:** Amazon DynamoDB (On-Demand billing) utilizing Global Secondary Indexes (`StatusIndex`, `UserIdIndex`) for single-digit millisecond query performance.
- **Authentication:** Amazon Cognito User Pools supporting SRP authentication and role-based groups (`Admins` vs `Citizens`).
- **Media Storage:** Amazon S3 private bucket with temporary (300s) presigned `PUT` URLs.
- **Infrastructure as Code:** AWS SAM (`template.yaml`) for automated, repeatable cloud deployments.

---

## 5. Environmental & Public Safety Impact
- **Disaster Preparedness:** Provides first responders and municipal ward coordinators with a consolidated, verified operational picture of submerged infrastructure.
- **Commuter Safety:** Decreases water-related vehicular stalls and accidents by providing real-time passability statuses (Passable, Difficult, Blocked).
- **Responsible Privacy:** Personal phone numbers and account identifiers are strictly shielded; only sanitized geographical observations are exposed.
- **Zero Carbon Waste:** Built 100% serverless on AWS, scaling down to zero idle compute when skies are clear.

---

## 6. What We Learned & Accomplished
- Orchestrating a full AWS serverless architecture without introducing external BaaS or third-party inference shortcuts.
- Designing a distinctive **Cartographic Intelligence** visual system that treats maps as operational tools rather than mere background wallpapers.
- Implementing robust mathematical freshness decay models that reflect physical floodwater runoff behaviors.

---

## 7. Live AWS Cloud Deployment Details
- **Production Web Application:** [http://jalrakshak-frontend-dev-062577348302.s3-website.ap-south-1.amazonaws.com](http://jalrakshak-frontend-dev-062577348302.s3-website.ap-south-1.amazonaws.com)
- **API Gateway HTTP API:** `https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1`
- **Health Check Endpoint:** `https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/health`
- **Cognito User Pool ID:** `ap-south-1_Hjjc9K0mC`
- **Cognito Web Client ID:** `1702hioeaa6an41037tqvcvmtq`
- **AWS Region:** `ap-south-1` (Asia Pacific - Mumbai)

---

## 8. What's Next
- Integration with ISRO Bhuvan elevation datasets (DEM) for hydrological slope simulation.
- Multi-lingual SMS & USSD gateways via AWS SNS for feature-phone accessibility.
- Direct operational bridge with Greater Chennai Corporation (GCC) and National Disaster Management Authority (NDMA) APIs.

