# Appliance Setup Guide (Local Deployment)

This guide explains how to run the system locally using Docker.

---

## Requirements

- Docker Desktop
- Node.js 18+
- Git

---

## 1. Clone Repository

```bash
git clone https://github.com/wisanyaphongtseng/log-management-demo
cd log-management-demo
```

---

## 2. Configure Environment
Create backend/.env

```
DB_USER=admin
DB_PASSWORD=password
DB_HOST=localhost
DB_NAME=logs
DB_PORT=5432
JWT_SECRET=supersecretkey
```

---

## 3. Start Database & Grafana

```bash
docker compose up -d
```

Verify containers:
```bash
docker ps
```

---

## 4. Run Backend

```bash
cd backend
npm install
node server.js
```

Server runs at: ```http://localhost:3000```

---

## 5. Access Grafana

Open: ```http://localhost:3001```

Login: ```admin / admin```

Add PostgreSQL datasource:

- Host: postgres:5432

- DB: logs

- User: admin

- Password: password

---

## 6. Test Log Ingestion

REST API
```bash
curl -X POST http://localhost:3000/ingest \
-H "Content-Type: application/json" \
-d '{"tenant":"demoA","event_type":"login_failed","ip":"1.1.1.1"}'
```
Syslog
```bash
echo "Firewall blocked connection" | nc -u localhost 5140
```

---

## 7. Verify Logs

Open Grafana dashboards or call:
```
GET /logs
```

---

## 8. Trigger Security Alert

Send 5 failed logins:
```
repeat 5x POST /ingest login_failed
```
Dashboard popup alert will trigger.