# 🌊☀️ JalRakshak AI — Dual Heat & Flood Intelligence Platform

[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Amazon Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Nova%202%20Lite-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/bedrock/)
[![Amazon DynamoDB](https://img.shields.io/badge/DynamoDB-On--Demand-4053D6?logo=amazon-dynamodb&logoColor=white)](https://aws.amazon.com/dynamodb/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tests Passing](https://img.shields.io/badge/Vitest-37%2F37%20Passed-success?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> **WeMakeDevs Environmental Hacks 2026** — *Track: Heat and Water*  
> **Repository:** [https://github.com/Anik-da/JalRakshak](https://github.com/Anik-da/JalRakshak)  
> **Development Environment:** Google Antigravity (Advanced Agentic AI)  
> **Cloud Provider:** Amazon Web Services (AWS) Exclusively (ap-south-1 Mumbai)

---

## 🌐 Live Deployments & Endpoints (24/7 Active)

| Component | Target URL | Status |
|---|---|---|
| **Live Web Application** | [http://jalrakshak-frontend-dev-062577348302.s3-website.ap-south-1.amazonaws.com](http://jalrakshak-frontend-dev-062577348302.s3-website.ap-south-1.amazonaws.com) | 🟢 Live (Amazon S3) |
| **Heat Intelligence Module** | [http://jalrakshak-frontend-dev-062577348302.s3-website.ap-south-1.amazonaws.com/heat](http://jalrakshak-frontend-dev-062577348302.s3-website.ap-south-1.amazonaws.com/heat) | 🟢 Live & Interactive |
| **API Gateway Base URL** | `https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1` | 🟢 24/7 Serverless |
| **Heat Intelligence API** | [https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/heat/intelligence?lat=28.6139&lng=77.2090&locality=New+Delhi](https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/heat/intelligence?lat=28.6139&lng=77.2090&locality=New+Delhi) | 🟢 Open-Meteo Synced |
| **Combined Heat & Flood API** | [https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/intelligence/combined?lat=28.6139&lng=77.2090&locality=New+Delhi](https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/intelligence/combined?lat=28.6139&lng=77.2090&locality=New+Delhi) | 🟢 Bedrock Nova 2 Lite |
| **System Health Check** | [https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/health](https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/health) | 🟢 Healthy |
| **Current Weather API** | [https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/weather/current?lat=28.6139&lon=77.2090](https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/weather/current?lat=28.6139&lon=77.2090) | 🟢 Open-Meteo Synced |
| **Community Reports API** | [https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/reports](https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1/reports) | 🟢 DynamoDB Live |

---

## 📑 Table of Contents

1. [Problem Statement & Central Innovation](#1-problem-statement--central-innovation)
2. [Dual Hazard Platform: Heat & Water Track](#2-dual-hazard-platform-heat--water-track)
3. [Key Features & Capabilities](#3-key-features--capabilities)
4. [Heat Risk Calculation & Public Health Model](#4-heat-risk-calculation--public-health-model)
5. [AWS-Native Serverless Architecture](#5-aws-native-serverless-architecture)
6. [Amazon Bedrock Nova 2 Lite Integration](#6-amazon-bedrock-nova-2-lite-integration)
7. [Real Weather Data Telemetry](#7-real-weather-data-telemetry)
8. [Complete REST API Reference](#8-complete-rest-api-reference)
9. [Automated Test Suite (37/37 Passing)](#9-automated-test-suite-3737-passing)
10. [Local Development & Quick Start](#10-local-development--quick-start)
11. [AWS Infrastructure & Deployment](#11-aws-infrastructure--deployment)
12. [Repository Structure](#12-repository-structure)
13. [Design Philosophy & Hackathon Attribution](#13-design-philosophy--hackathon-attribution)

---

## 1. Problem Statement & Central Innovation

### The Crisis: Dual Climate Threats in Urban India
Indian cities face a compounding, bidirectional environmental crisis:
1. **Intense Heatwaves:** Extreme dry-bulb temperatures exceeding 45°C, exacerbated by oppressive relative humidity and the urban heat island effect, causing heat stroke, dehydration, and cardiovascular strain.
2. **Urban Monsoon Deluges:** Torrential cloudbursts overwhelming aging stormwater drains, submerging roads, underpasses, and critical hospital access corridors.

Traditional disaster portals treat these hazards in isolation or rely solely on lagging citizen distress calls.

### The Innovation: Dual-Hazard Predictive Intelligence
**JalRakshak AI** bridges the divide for the **Heat and Water** track. It continuously evaluates both thermal stress and hydrological hazards using high-resolution meteorological telemetry, public-health heat-index models, and topographical runoff simulations:

```
┌────────────────────────────────────────────────────────────────────────┐
│               JALRAKSHAK DUAL-HAZARD INTELLIGENCE ENGINE               │
├────────────────────────────────────────────────────────────────────────┤
│  Open-Meteo Synoptic Feeds:                                            │
│  • Air Temp & Apparent Temp ─────────▶ [ Heat Risk Classifier ]        │
│  • Humidity, Wind & UV Index ───┐           │ (Low/Mod/High/Very High) │
│  • Precipitation Rate & Accum ──┼──┐        ▼                          │
│                                 │  └──▶ [ Combined Dual Overview ]     │
│  Hydrological & Terrain Models: │           ▲ (Bedrock Nova 2 Lite)    │
│  • Elevation, Slope & Drainage ─┘           │                          │
│  • IMD Synoptic Warnings ───────────────────┤                          │
│  • Verified Ground-Truth Reports ────▶ [ Flood Risk Engine ]           │
│                                            (NOW, 1H, 3H, 6H, 24H)      │
└────────────────────────────────────────────────────────────────────────┘
```

The system preserves **strict internal independence** between heat and flood assessments: if one meteorological data feed experiences an outage, the other hazard continues rendering with transparent data availability disclosures.

---

## 2. Dual Hazard Platform: Heat & Water Track

JalRakshak AI offers unified civic intelligence across two distinct tracks:

| Hazard Dimension | Heat Intelligence | Flood Intelligence |
|---|---|---|
| **Primary Variable** | Apparent Temperature (Heat Index) & Air Temp (°C) | Precipitation Rate (mm/h) & 1h/3h/6h Accumulation |
| **Secondary Variables** | Relative Humidity (%), Wind Speed (km/h), UV Index | Terrain Slope, Drainage Capacity, Elevation (m) |
| **Risk Classification** | `LOW` (<27°C), `MODERATE` (27-32.9°C), `HIGH` (33-41.9°C), `VERY_HIGH` (≥42°C) | Multi-Horizon Predictive Risk (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| **Forecast Window** | 24-Hour Hourly Temperature & Apparent Temp Forecast | `NOW`, `1H`, `3H`, `6H`, and `24H` Horizon Escalations |
| **Safety Guidance** | Hydration, shaded rest, vulnerable check, outdoor timing | Submerged road evasion, alternative bypasses, safe elevations |
| **AI Synthesis** | Amazon Bedrock Nova 2 Lite compound synthesis highlighting the dominant hazard (`HEAT`, `FLOOD`, `DUAL`, or `LOW_RISK`) |

---

## 3. Key Features & Capabilities

### ☀️ 1. Dedicated Heat Intelligence Module (`/heat`)
- **Live Thermometric Hero Card:** Current air temperature and apparent temperature (heat index), today's recorded maximum and minimum temperatures, and verified data timestamps.
- **Atmospheric Metrics Grid:** Real-time relative humidity (%), surface wind velocity (km/h), and peak UV Index with protective guidance (SPF 30+, UV-blocking sunglasses).
- **24-Hour Hourly Forecast Timeline:** Transparently displays projected temperature curves, labeled as future forecasts rather than live observations.
- **Configurable Locality Switcher:** Instant telemetry toggling across major metropolitan areas (New Delhi, Chennai, Mumbai, Bengaluru, Kolkata) plus GPS geolocation.
- **Practical Public-Health Precautions:** Cautious, non-medical safety actions tailored to current risk tiers.

### 🌊 2. Multi-Horizon Predictive Flood Intelligence (`/risk`)
- Proactively calculates waterlogging probabilities across `NOW`, `1H`, `3H`, `6H`, and `24H` time horizons.
- Integrates terrain slope categories, municipal drainage capacity classifications, and historical watershed vulnerability.
- Flags **FloodBlind** monitoring blindspots in unmonitored neighborhoods before vehicles stall.

### 🤝 3. Combined Heat & Flood Overview
- Available on both the Heat Intelligence page and via API.
- Simultaneously presents the current Heat Risk and Flood Risk side by side.
- Features **Amazon Bedrock Nova 2 Lite** compound risk synthesis explaining whether thermal stress, flash flooding, or dual compound pressures dominate.

### 🗺️ 4. 6-Layer Interactive Cartographic Map (`/map`)
- **Layer 1: Community Flood Reports:** Live citizen water depth reports (`Ankle`, `Knee`, `Waist`, `Impassable`).
- **Layer 2: Estimated Risk Zones:** Proactive watershed polygon layers.
- **Layer 3: Observed Weather Stations:** Real-time precipitation and weather pins.
- **Layer 4: Precipitation Forecast:** Hourly accumulated rainfall heatmap.
- **Layer 5: Historical Monsoon Hotspots:** High-vulnerability urban basins.
- **Layer 6: IMD Meteorological Warnings:** District Red, Orange, and Yellow warning perimeters.

### 🤖 5. Amazon Bedrock Nova 2 Lite Assistant ("Ask JalRakshak")
- Conversational environmental assistant powered by `global.amazon.nova-2-lite-v1:0`.
- Grounded in live coordinates, current weather telemetry, road conditions, and community reports.
- Includes a multi-tier deterministic grounding fallback to guarantee 100% platform availability.

### 🚗 6. Road Impact Simulator & Corridor Routing
- Spatial buffer assessment along travel routes to flag submerged road links and recommend elevated expressway alternatives.

---

## 4. Heat Risk Calculation & Public Health Model

JalRakshak AI implements a transparent, documented heat-risk algorithm based on recognized public-health heat index guidelines (NDMA & NOAA):

```typescript
// Heat Risk Assessment Logic (weatherAdapter.ts)
if (effectiveTemp < 27) {
  level = 'LOW';
  explanation = 'Apparent temperature is within comfortable range. Minimal thermal risk.';
} else if (effectiveTemp < 33) {
  level = 'MODERATE';
  explanation = 'Warm conditions. Fatigue possible with prolonged outdoor physical exertion.';
} else if (effectiveTemp < 42) {
  level = 'HIGH';
  explanation = 'High heat stress. Heat cramps and exhaustion likely; heat stroke possible with continued exposure.';
} else {
  level = 'VERY_HIGH';
  explanation = 'Extreme thermal danger. Heat stroke imminent with continued outdoor exposure.';
}
```

- **Apparent Temperature First:** When humidity and apparent temperature are provided by Open-Meteo, the assessment is explicitly labeled `assessmentBasis: 'apparent_temperature'`.
- **Dry-Bulb Fallback:** If apparent temperature is unavailable, the engine falls back to calibrated air-temperature thresholds (<30, 30-34.9, 35-39.9, ≥40°C) and explicitly labels the result `assessmentBasis: 'dry_bulb_temperature'`.
- **Missing Data Handling:** If temperature telemetry cannot be resolved, the engine returns `heatRiskLevel: 'UNAVAILABLE'` with an honest explanation rather than fabricating numbers.
- **Ethical Safeguard:** Assessments are clearly disclaimed as civic awareness guidelines, never mislabeled as official government warnings or medical diagnoses.

---

## 5. AWS-Native Serverless Architecture

JalRakshak AI is built entirely on Amazon Web Services in the `ap-south-1` (Mumbai) region:

```mermaid
graph TD
    User([Citizens & Commuters]) -->|HTTPS| S3[Amazon S3 Static Website<br/>Dual-Hazard React SPA]
    User -->|API Requests| APIGW[Amazon API Gateway HTTP API v2<br/>/dev/api/v1]
    
    APIGW -->|Proxy| Lambda[AWS Lambda Function<br/>Node.js 20.x TypeScript]
    
    subgraph "Serverless Backend Core"
        Lambda -->|Read/Write Reports & Audits| DDB[(Amazon DynamoDB<br/>On-Demand Tables)]
        Lambda -->|Converse API| Bedrock[Amazon Bedrock<br/>Amazon Nova 2 Lite]
        Lambda -->|Presigned URLs| S3Bucket[Amazon S3 Bucket<br/>Report Photos]
    end
    
    subgraph "External Meteorological Feeds"
        Lambda -->|Hourly Synoptic Telemetry| OpenMeteo[Open-Meteo Forecast API<br/>Temp, Humidity, Wind, UV, Rain]
        Lambda -->|District Warnings| IMD[IMD Warning Feed]
    end
    
    subgraph "Observability & Auth"
        Lambda -.->|Logs & Latency| CW[Amazon CloudWatch]
        APIGW -.->|JWT Auth| Cognito[Amazon Cognito User Pool]
    end
```

### AWS Services Utilized
| Service | Role in JalRakshak AI |
|---|---|
| **Amazon API Gateway (HTTP API v2)** | Versioned `/dev/api/v1` routing, CORS pre-flight, and low-latency payload proxying. |
| **AWS Lambda (Node.js 20.x)** | Fully serverless compute engine handling risk scoring, weather integration, reports, and AI orchestration. |
| **Amazon Bedrock** | Amazon Nova 2 Lite model execution using Converse API for conversational intelligence and dual-hazard synthesis. |
| **Amazon DynamoDB** | High-throughput NoSQL tables: `JalRakshak-Reports-dev`, `JalRakshak-Audit-dev`, and TTL caches. |
| **Amazon S3** | Static single-page application hosting and secure field photo storage with presigned URLs. |
| **Amazon Cognito** | Secure citizen identity authentication with SRP protocol and role separation. |
| **Amazon CloudWatch** | Serverless invocation logs, latency tracking, and error observability. |
| **AWS SAM (Serverless Application Model)** | Declarative infrastructure-as-code (`template.yaml`). |

---

## 6. Amazon Bedrock Nova 2 Lite Integration

JalRakshak AI utilizes **Amazon Nova 2 Lite** as its primary reasoning engine.

### Configuration Specification
- **Model ID:** `global.amazon.nova-2-lite-v1:0`
- **Region:** `ap-south-1` (Mumbai)
- **SDK:** `@aws-sdk/client-bedrock-runtime` (`v3.1149.0+`)
- **API Call:** `ConverseCommand` via Amazon Bedrock Converse API

### Architecture & Resilience
```typescript
// Production AWS Bedrock Nova 2 Lite Invocation
const client = new BedrockRuntimeClient({ region: 'ap-south-1' });

const command = new ConverseCommand({
  modelId: 'global.amazon.nova-2-lite-v1:0',
  messages: [
    {
      role: 'user',
      content: [{ text: promptWithLiveTelemetryContext }]
    }
  ],
  inferenceConfig: {
    maxTokens: 1024,
    temperature: 0.3,
    topP: 0.9
  }
});

const response = await client.send(command);
```

### Dual-Hazard Summary Synthesis
The Bedrock service synthesizes compound overviews:
- Evaluates heat risk level and flood score concurrently.
- Categorizes dominant hazard (`HEAT`, `FLOOD`, `DUAL`, or `LOW_RISK`).
- Generates 3-5 combined safety precautions addressing both hazards.
- Uses a deterministic fallback if Bedrock throttles, ensuring zero downtime.

---

## 7. Real Weather Data Telemetry

JalRakshak AI strictly rejects fabricated telemetry, mock numbers, and hardcoded values.

- **Primary Provider:** Open-Meteo High-Resolution Forecast API (`https://api.open-meteo.com/v1/forecast`).
- **Telemetry Ingested:**
  - `temperature_2m`: Ambient dry-bulb air temperature (°C).
  - `apparent_temperature`: Heat index apparent temperature (°C).
  - `relative_humidity_2m`: Ambient relative humidity (%).
  - `wind_speed_10m`: Surface wind speed (km/h).
  - `uv_index`: Instantaneous UV index.
  - `temperature_2m_max` / `min`: Daily temperature extremes.
  - `precipitation`: Current liquid rainfall rate (mm/h).
  - `hourly.precipitation` & `hourly.temperature_2m`: 24-hour hourly distributions.
- **Honest Attribution:** All endpoints report `source: "Open-Meteo Forecast API"`, retrieval timestamps, and measurement units. Forecasts are never labeled as live measurements.

---

## 8. Complete REST API Reference

Base URL: `https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1`

### ☀️ Heat Intelligence
```http
GET /heat/intelligence?lat=28.6139&lng=77.2090&locality=New+Delhi
```
Returns comprehensive heat risk assessment, current and apparent temperatures, humidity, wind, UV index, today's max/min, hourly 24h forecast, and safety precautions.

```json
{
  "location": { "latitude": 28.6139, "longitude": 77.2090, "localityName": "New Delhi" },
  "currentTemperatureC": 34.2,
  "currentApparentTemperatureC": 37.8,
  "todayMaxTemperatureC": 38.5,
  "todayMinTemperatureC": 26.1,
  "relativeHumidityPercent": 58,
  "windSpeedKmh": 12.4,
  "uvIndex": 7.2,
  "heatRiskLevel": "HIGH",
  "assessmentBasis": "apparent_temperature",
  "heatRiskExplanation": "Apparent temperature (38°C) exceeds high heat threshold. Heat cramps and exhaustion likely.",
  "precautions": [
    "Drink water regularly and avoid strenuous outdoor activity during peak sun hours (12 PM - 4 PM).",
    "Seek shade or air-conditioned indoor spaces.",
    "Check on children, elderly relatives, and outdoor workers."
  ],
  "hourlyForecast": [
    { "timestamp": "2026-10-11T12:00:00Z", "temperatureC": 34.2, "apparentTemperatureC": 37.8, "relativeHumidityPercent": 58, "uvIndex": 7.2, "isForecast": true }
  ],
  "source": "Open-Meteo Forecast API",
  "retrievalTime": "2026-10-11T16:45:00.000Z",
  "isLive": true,
  "freshness": "LIVE",
  "units": { "temperature": "°C", "windSpeed": "km/h", "humidity": "%", "uvIndex": "index (0-11+)" }
}
```

---

### 🌐 Combined Heat & Flood Risk Overview
```http
GET /intelligence/combined?lat=28.6139&lng=77.2090&locality=New+Delhi
```
Returns unified multi-hazard overview with independent heat and flood risk assessments, plus an Amazon Bedrock Nova 2 Lite synthesized summary.

```json
{
  "location": { "latitude": 28.6139, "longitude": 77.2090, "localityName": "New Delhi" },
  "heat": { ... },
  "flood": { ... },
  "combinedSummary": {
    "primaryHazard": "HEAT",
    "overview": "New Delhi is experiencing high heat stress with an apparent temperature of 38°C. Localized flood risk remains low.",
    "combinedPrecautions": [
      "Stay hydrated and avoid unshaded outdoor transit between 12 PM and 4 PM.",
      "Check on vulnerable neighbors and elderly individuals.",
      "Monitor local weather updates for evening convective storm changes."
    ],
    "groundingNotes": "Grounded in Open-Meteo weather telemetry and DynamoDB flood observations.",
    "generatedBy": "Amazon Bedrock (global.amazon.nova-2-lite-v1:0)"
  },
  "timestamp": "2026-10-11T16:45:00.000Z"
}
```

---

### 🏥 System Health & Telemetry
```http
GET /health
```

### 🌦️ Weather Telemetry
```http
GET /weather/current?lat=28.6139&lon=77.2090
GET /weather/forecast?lat=28.6139&lon=77.2090&hours=24
GET /weather/warnings?lat=28.6139&lon=77.2090
```

### 🎯 Hyperlocal Flood Intelligence
```http
GET /intelligence/location?lat=28.6139&lon=77.2090
```

### 📢 Community Reports
```http
GET /reports?status=VERIFIED&limit=20
POST /reports
```

### 💬 Bedrock AI Assistant ("Ask JalRakshak")
```http
POST /assistant/chat
```

### ⚡ What-If Deluge Simulator
```http
POST /simulations/rainfall
```

---

## 9. Automated Test Suite (37/37 Passing)

JalRakshak AI enforces complete automated test verification with **37 passing unit and integration tests** in Vitest:

```bash
# Run all backend and frontend test suites
npm test
```

```
 RUN  v2.1.9 C:/JALRAKSHAK/backend

 ✓ src/__tests__/riskAndDeduplication.test.ts (6 tests)
 ✓ src/__tests__/predictiveIntelligence.test.ts (8 tests)
   ✓ JalRakshak AI 2.0 — Predictive Intelligence Engine > Generates structured Bedrock AI Analyst explanation
 ✓ src/__tests__/advancedIntelligence.test.ts (14 tests)
   ✓ JalRakshak AI — FloodBlind AI Engine > detects elevated flood risk in sectors with ZERO reports
   ✓ JalRakshak AI — Road-Level Flood Impact Simulator > flags arterial roads exceeding drainage thresholds
 ✓ src/__tests__/heatIntelligence.test.ts (9 tests)
   ✓ JalRakshak AI — Heat Intelligence & Multi-Hazard Synthesis > getHeatIntelligence module integration
   ✓ JalRakshak AI — Heat Intelligence & Multi-Hazard Synthesis > synthesizes compound DUAL hazard
   ✓ JalRakshak AI — Heat Intelligence & Multi-Hazard Synthesis > keeps heat and flood independent

 Test Files  4 passed (4)
      Tests  37 passed (37)
   Duration  5.03s
```

Frontend UI tests also pass cleanly:
```
 ✓ frontend/src/test/components.test.tsx (9 tests)
```

---

## 10. Local Development & Quick Start

### Prerequisites
- **Node.js:** `v20.x` or `v22.x` (LTS recommended)
- **npm:** `v10.x` or higher
- **AWS CLI:** Configured with valid credentials (if deploying)

### 1. Clone the Repository
```bash
git clone https://github.com/Anik-da/JalRakshak.git
cd JalRakshak
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to both workspaces:

**Frontend Configuration (`frontend/.env`):**
```env
VITE_API_BASE_URL=https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1
VITE_AWS_REGION=ap-south-1
```

**Backend Configuration (`backend/.env`):**
```env
AWS_REGION=ap-south-1
BEDROCK_MODEL_ID=global.amazon.nova-2-lite-v1:0
REPORTS_TABLE_NAME=JalRakshak-Reports-dev
AUDIT_TABLE_NAME=JalRakshak-Audit-dev
PORT=4000
```

### 4. Run Locally
```bash
# Terminal 1: Backend Server (runs on http://localhost:4000)
npm run dev:backend

# Terminal 2: Frontend Vite App (runs on http://localhost:5173)
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 11. AWS Infrastructure & Deployment

The platform is deployed declaratively using AWS SAM:

### Step 1: Build the Serverless Stack
```bash
npm run build --workspace=backend
sam build
```

### Step 2: Deploy Backend to AWS Lambda
```bash
sam deploy --guided
# Or update existing Lambda code directly:
aws lambda update-function-code \
  --function-name jalrakshak-ai-stack-ApiFunction-VeXpbFIl1ByU \
  --zip-file fileb://backend-lambda.zip \
  --region ap-south-1
```

### Step 3: Deploy Frontend Assets to Amazon S3
```bash
npm run build --workspace=frontend
aws s3 sync frontend/dist s3://jalrakshak-frontend-dev-062577348302 --delete
```

---

## 12. Repository Structure

```
JalRakshak/
├── backend/                       # AWS Lambda & Express Serverless Backend
│   ├── src/
│   │   ├── __tests__/             # Vitest test suites (37 passing tests)
│   │   │   ├── heatIntelligence.test.ts
│   │   │   ├── advancedIntelligence.test.ts
│   │   │   ├── predictiveIntelligence.test.ts
│   │   │   └── riskAndDeduplication.test.ts
│   │   ├── weatherAdapter.ts      # Open-Meteo heat, temp, humidity & rain ingestion
│   │   ├── bedrockService.ts      # Amazon Nova 2 Lite Converse API & synthesis
│   │   ├── riskEngine.ts          # Multi-horizon predictive flood calculator
│   │   ├── floodBlindEngine.ts    # Unmonitored sector risk analysis
│   │   ├── roadImpactSimulator.ts # Arterial road inundation simulator
│   │   ├── lambdaHandler.ts       # AWS Lambda router (/heat, /intelligence, /reports)
│   │   ├── localServer.ts         # Local express server for rapid development
│   │   └── types.ts               # Shared TypeScript schemas
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                      # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HeatIntelligencePage.tsx # Heat Intelligence module (/heat)
│   │   │   ├── RiskIntelligencePage.tsx # Flood Intelligence module (/risk)
│   │   │   ├── LandingPage.tsx          # Dual-hazard home page
│   │   │   └── MapPage.tsx              # 6-layer cartographic live map
│   │   ├── components/            # Reusable UI widgets, badges & drawers
│   │   ├── services/api.ts        # Backend API client with heat endpoints
│   │   ├── types/index.ts         # Shared frontend interfaces
│   │   └── App.tsx                # Client-side router including /heat
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── template.yaml                  # AWS SAM infrastructure definition
├── package.json                   # Root npm workspaces
├── ARCHITECTURE.md                # In-depth architectural specification
└── README.md                      # Primary project documentation
```

---

## 13. Design Philosophy & Hackathon Attribution

- **Hackathon:** [WeMakeDevs Environmental Hacks 2026](https://wemakedevs.org/)
- **Track:** Heat and Water
- **Visual Identity:** **Cartographic Intelligence & Sky Sunlight Theme**  
  Sunlight-friendly, accessible UI optimized for both bright sunlight conditions and night storms:
  - Sky Blue (`#0284C7`) and Crisp White for clean civic communication
  - Warm Amber (`#D97706`) and Coral for thermal risk awareness
  - Forest Green (`#16A34A`) for safe conditions
  - Critical Crimson (`#DC2626`) for life-threatening flash flood warnings
- **AI Tooling:** Developed pair-programmed with **Google Antigravity**
- **Author & Team:** **Anik Da & JalRakshak AI Team**
- **License:** [Apache 2.0](LICENSE)
