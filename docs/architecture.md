# System Architecture

## Overview
This system simulates a Security Operations Center (SOC) log monitoring platform designed for multi-tenant environments. It collects logs, normalizes events, detects threats, and provides real-time alerts and dashboards.

---

## Tech Stack

### Backend
- Node.js
- Express.js
- Socket.IO (real-time alerts)

### Database
- PostgreSQL

### Monitoring & Visualization
- Grafana

### Infrastructure
- Docker
- Docker Compose

---

## Architecture

```text
Log Sources
├── REST API (/ingest)
└── Syslog UDP (5140)
↓
Node.js Backend
├── Log Normalization
├── Threat Detection Engine
├── RBAC Authorization
└── Real-time Alerts (Socket.IO)
↓
PostgreSQL Database
↓
Grafana Dashboard & Web Alert UI
```


---

## Data Flow

### 1. Log Ingestion
Logs enter the system through:

• REST API `/ingest`  
• Syslog UDP listener (port 5140)

Supported formats include JSON logs and raw syslog messages.

---

### 2. Normalization & Enrichment

Incoming logs are normalized into a structured schema:

| Field | Description |
|------|------|
| timestamp | Event time |
| tenant | Tenant identifier |
| source | Log source |
| event_type | Event classification |
| user | Associated user |
| src_ip | Source IP |
| severity | LOW / MEDIUM / HIGH |
| raw | Original log JSON |

---

### 3. Threat Detection Engine

Security rules analyze logs in real-time.

**Example Detection:**
- ≥5 login failures within 5 minutes → HIGH severity brute-force alert

---

### 4. Storage Layer

Logs are stored in PostgreSQL for:

- forensic analysis  
- compliance & audit  
- dashboard visualization  

---

### 5. Real-time Alerting

When security thresholds are triggered:

- Socket.IO pushes alerts to dashboard
- Alerts include attacker IP & severity level

---

### 6. Multi-Tenant Isolation Model

Each log is tagged with a tenant.

RBAC rules enforce access:

| Role | Access |
|------|------|
| viewer | only own tenant |
| admin | all tenants |

---

## Security Model

### Authentication
- JWT-based authentication

### Authorization
- Role-based access control (RBAC)

### Data Isolation
- Tenant-based filtering

---