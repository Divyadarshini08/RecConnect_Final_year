import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "reconnect_user",
  password: process.env.DB_PASSWORD || "reconnect123",
  database: process.env.DB_NAME || "reconnect",
  waitForConnections: true,
  connectionLimit: 10,
});

export default db;
