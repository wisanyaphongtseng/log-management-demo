require("dotenv").config();
const express = require("express");
const app = express();
const fs = require("fs");
const { Pool } = require("pg");

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

    console.log("Received log:", log);

    // ตัวอย่าง normalize
    const normalizedLog = {
        timestamp: log["@timestamp"] || new Date().toISOString(),
        tenant: log.tenant || "default",
        source: log.source || "unknown",
        event_type: log.event_type || "unknown",
        user: log.user || null,
        src_ip: log.ip || null,
        raw: log
    };

    console.log("Normalized:", normalizedLog);

    // บันทึกลงไฟล์ logs.txt
    // fs.appendFileSync(
    //     "logs.txt",
    //     JSON.stringify(normalizedLog) + "\n"
    // );

    // TODO: save to database

    try {
        await pool.query(
            `INSERT INTO logs(timestamp, tenant, source, event_type, user_name, src_ip, raw)
             VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [
                normalizedLog.timestamp,
                normalizedLog.tenant,
                normalizedLog.source,
                normalizedLog.event_type,
                normalizedLog.user,
                normalizedLog.src_ip,
                normalizedLog.raw
            ]
        );

        console.log("Saved to database");

    } catch (err) {
        console.error("DB Error:", err);
    }

    // ALERT RULE
    if (normalizedLog.event_type === "login_failed") {
        const result = await pool.query(
        `SELECT COUNT(*) FROM logs
         WHERE src_ip=$1
         AND event_type='login_failed'
         AND timestamp > NOW() - INTERVAL '5 minutes'`,
        [normalizedLog.src_ip]
        );

    if (parseInt(result.rows[0].count) >= 5) {
        console.log("🚨 ALERT: Possible brute force from", normalizedLog.src_ip);
        }
    }

    res.json({
        status: "ok",
        message: "log received"
    });
});

//Search API
app.get("/logs", async (req, res) => {
    const { tenant, ip } = req.query;

    let query = "SELECT * FROM logs WHERE 1=1";
    const values = [];

    if (tenant) {
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

app.listen(3000, () => {
    console.log("Server running on port 3000");
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
        raw: { message: message }
    };

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
});

syslogServer.bind(5140, () => {
    console.log("Syslog UDP listening on 5140");
});