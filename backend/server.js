require("dotenv").config();
const express = require("express");
const app = express();
//const fs = require("fs");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");
//jwi
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(express.json());

// ingest endpoint
app.post("/ingest", async (req, res) => {
    const log = req.body;

    if (!log) {
        return res.status(400).json({ error: "No data received" });
    }

    if (typeof log !== "object" || Array.isArray(log)) {
        return res.status(400).json({ error: "invalid log format" });
    }

    console.log("Received log:", log);

    const normalizedLog = {
        timestamp: log["@timestamp"] || new Date().toISOString(),
        tenant: log.tenant || "default",
        source: log.source || "unknown",
        event_type: log.event_type || "unknown",
        user: log.user || null,
        src_ip: log.ip || "0.0.0.0",
        raw: log,
        severity: "LOW"
    };

    try {

        // 🔎 ถ้าเป็น login_failed ตรวจ brute force ก่อน
        if (normalizedLog.event_type === "login_failed") {

            const result = await pool.query(
                `SELECT COUNT(*) FROM logs
                 WHERE src_ip=$1
                 AND event_type='login_failed'
                 AND timestamp > NOW() - INTERVAL '5 minutes'`,
                [normalizedLog.src_ip]
            );

            const attempts = parseInt(result.rows[0].count);

            if (attempts >= 5) {
                normalizedLog.severity = "HIGH";

                io.emit("security_alert", {
                    message: "Brute force attack detected",
                    ip: normalizedLog.src_ip,
                    attempts: attempts,
                    time: new Date()
                });

            } else {
                normalizedLog.severity = "MEDIUM";
            }
        }

        await pool.query(
            `INSERT INTO logs(timestamp, tenant, source, event_type, user_name, src_ip, raw, severity)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
                normalizedLog.timestamp,
                normalizedLog.tenant,
                normalizedLog.source,
                normalizedLog.event_type,
                normalizedLog.user,
                normalizedLog.src_ip,
                normalizedLog.raw,
                normalizedLog.severity
            ]
        );

        res.json({ status: "ok", message: "log received" });

    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).json({ error: "database error" });
    }
});
//Search API
app.get("/logs", auth, async (req, res) => {
    const { tenant, ip } = req.query;

    let query = "SELECT * FROM logs WHERE 1=1";
    const values = [];

    // RBAC: ถ้าเป็น viewer ให้เห็นเฉพาะ tenant ตัวเอง
    if (req.user.role === "viewer") {
        values.push(req.user.tenant);
        query += ` AND tenant = $${values.length}`;
    }

    // ถ้าเป็น admin และมี query tenant มากับ request
    if (tenant && req.user.role === "admin") {
        values.push(tenant);
        query += ` AND tenant = $${values.length}`;
    }

    if (ip) {
        values.push(ip);
        query += ` AND src_ip = $${values.length}`;
    }

    query += " ORDER BY timestamp DESC LIMIT 50";

    try {
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "database error" });
    }
});

// ALERT: detect brute force login
app.get("/alerts/bruteforce", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT src_ip, COUNT(*) AS attempts
            FROM logs
            WHERE event_type = 'login_failed'
            AND timestamp > NOW() - INTERVAL '5 minutes'
            GROUP BY src_ip
            HAVING COUNT(*) >= 5
        `);

        res.json({
            alert: result.rows.length > 0,
            attackers: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "alert query failed" });
    }
});

//Login API
app.post("/login", async (req, res) => {
    try {
    const { username, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE username=$1",
        [username]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
            tenant: user.tenant
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
    } catch (err) {
    res.status(500).json({ error: "server error" });
    }
});
//Create Auth Middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

if (require.main === module) {
  server.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

io.on("connection", (socket) => {
    console.log("Client connected");
});

const dgram = require("dgram");

const syslogServer = dgram.createSocket("udp4");

syslogServer.on("message", async (msg, rinfo) => {
    const message = msg.toString();

    console.log("Syslog received:", message);

    const normalizedLog = {
        timestamp: new Date().toISOString(),
        tenant: "network",
        source: "syslog",
        event_type: "network_event",
        src_ip: rinfo.address,
        raw: { message: message },
        severity: "LOW"
    };

    try {
    await pool.query(
        `INSERT INTO logs(timestamp, tenant, source, event_type, src_ip, raw)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [
            normalizedLog.timestamp,
            normalizedLog.tenant,
            normalizedLog.source,
            normalizedLog.event_type,
            normalizedLog.src_ip,
            normalizedLog.raw
        ]
    );
    } catch (err) {
        console.error("Syslog DB error:", err);
    }
});

syslogServer.bind(5140, () => {
    console.log("Syslog UDP listening on 5140");
});

module.exports = app;