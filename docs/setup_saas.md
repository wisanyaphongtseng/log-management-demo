# SaaS Deployment Guide (Cloud Deployment)

This guide describes deploying the system as a cloud-hosted SaaS platform.

---

## Recommended Infrastructure

- Cloud VM (AWS EC2 / GCP / Azure)
- Docker & Docker Compose
- Public IP / domain
- Reverse proxy (Nginx)

---

## 1. Provision Server

Minimum specs:

- 2 CPU
- 4 GB RAM
- Ubuntu 22.04

Install Docker:

```bash
sudo apt update
sudo apt install docker.io docker-compose -y
```

---

## 2. Clone Project
```bash
git clone https://github.com/wisanyaphongtseng/log-management-demo
cd log-management-demo
```

--- 

## 3. Configure Environment

Edit backend/.env
```
DB_HOST=postgres
JWT_SECRET=CHANGE_THIS_SECRET
```

---

## 4. Start Services
```
docker compose up -d
```

---

## 5. Run Backend
```bash
cd backend
npm install
node server.js
```

---

## 6. Configure Reverse Proxy (Optional)

Use Nginx to expose services:

| Service | Port |
|------|------|
| Backend API | 3000 |
| Grafana	| 3001 |

---

## 7. SaaS Multi-Tenant Model

Each organization is assigned:

- tenant ID

- user roles

- isolated data access

---

## 8. Demo Workflow

1. Send logs via API/syslog

2. View logs in dashboard

3. Trigger alert detection

4. Observe real-time alerts

---

## Example Public URLs

API:
```
https://yourdomain.com/ingest
```
Dashboard:
```
https://yourdomain.com:3001
```