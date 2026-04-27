const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

const dbConfig = {
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppassword",
  database: process.env.DB_NAME || "appdb"
};

app.get("/api/message", async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query("SELECT 'Hello from the DB!' AS message");
    await conn.end();
    res.json({ message: rows[0].message });
  } catch (err) {
    res.json({ message: "Database connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
