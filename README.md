# Log Management & Security Monitoring System
This project simulates a **Security Operations Center (SOC)** workflow including log ingestion, threat detection, and alert monitoring.

---

## Features

### Log Collection
- REST API log ingestion (`/ingest`)
- Syslog UDP listener (port **5140**)
- Supports multi-tenant log input

### Log Processing
- Log normalization & enrichment
- Structured storage in PostgreSQL (JSON raw logs)

### Security Monitoring
- Detect brute-force login attempts
- Real-time alert triggering
- Security alert API endpoint

### Search & Investigation
- Filter logs by tenant & IP
- Recent activity retrieval

### Visualization
- Grafana dashboard integration
- Real-time monitoring & analytics

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

## System Architecture

graph TD
    %% Styling
    classDef source fill:#f9f2f4,stroke:#d9534f,stroke-width:2px,color:#d9534f;
    classDef backend fill:#eafaf1,stroke:#5cb85c,stroke-width:2px,color:#2e8b57;
    classDef db fill:#ebf5fb,stroke:#337ab7,stroke-width:2px,color:#2874a6;
    classDef dashboard fill:#fcf3cf,stroke:#f0ad4e,stroke-width:2px,color:#b9770e;

    %% Nodes
    subgraph Sources [Log Sources]
        A[REST API <br/> /ingest]:::source
        B[Syslog UDP <br/> 5140]:::source
    end

    subgraph Backend [Node.js Backend]
        C[Log Normalization]:::backend
        D[Security Detection]:::backend
        E[Real-time Alert <br/> Socket.IO]:::backend
    end

    F[(PostgreSQL <br/> Database)]:::db
    G{{Grafana <br/> Dashboard}}:::dashboard

    %% Connections
    A --> C
    B --> C
    C --> D
    D --> E
    C --> F
    F --> G

---

## Project Structure

graph LR
    %% กำหนดสไตล์ของ Node
    classDef folder fill:#f0f8ff,stroke:#5dade2,stroke-width:2px,color:#2874a6;
    classDef file fill:#fdfefe,stroke:#aeb6bf,stroke-width:1px,color:#566573;
    classDef config fill:#fbfcfc,stroke:#f4d03f,stroke-width:1px,color:#7d6608;

    %% โครงสร้าง
    Root["📁 log-management-demo/"]:::folder
    
    Backend["📁 backend/"]:::folder
    Frontend["📁 frontend/"]:::folder
    Docker["🐳 docker-compose.yml"]:::config

    Root --> Backend
    Root --> Frontend
    Root --> Docker

    %% ไฟล์ใน Backend
    Env["⚙️ .env"]:::config
    Pkg["📄 package.json"]:::file
    Server["📄 server.js"]:::file

    Backend --> Env
    Backend --> Pkg
    Backend --> Server

    %% ไฟล์ใน Frontend
    Alert["📄 alert.html"]:::file
    
    Frontend --> Alert

---

## Setup & Run

### 1️. Start Database & Grafana

```bash
docker compose up -d
```

### 2. Run Backend Server

```bash
cd backend
npm install
node server.js
```
Server runs at: ```http://localhost:3000```

### API Endpoints

#### Ingest Log
POST /ingest
```json
{
  "tenant": "demoA",
  "event_type": "login_failed",
  "ip": "1.1.1.1"
}
```

#### Search Logs

GET ```/logs?tenant=demoA&ip=1.1.1.1```

#### Detect Brute Force Attack

GET ```/alerts/bruteforce```
Returns IPs with ≥5 failed logins within 5 minutes.

### Syslog Listener
Send UDP logs to: ```localhost:5140```
Example:
```bash
echo "Firewall blocked connection" | nc -u localhost 5140
```

### Real-Time Alerts
When multiple login failures are detected:
- Alert is triggered
- Socket.IO emits real-time notification
- Dashboard popup notification (frontend)

### Grafana Dashboard
Open: ```http://localhost:3001```

Default login: ```admin / admin```

Then:
1. Add PostgreSQL data source
2. Connect to the database
3. Create dashboards to visualize logs & security events

### Security Features
- Brute force detection
- Multi-tenant log isolation
- Role-based access ready
- Real-time alerting
- Centralized log storage

---