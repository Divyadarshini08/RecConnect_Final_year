import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import alumniRoutes from "./routes/alumni.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import intentRoutes from "./routes/intent.routes.js";
import responseTimeLogger from "./metrics/responseTime.middleware.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));

app.use(responseTimeLogger);
app.use(express.json());

// Agentic AI routes (order matters – agent routes first)
app.use("/api", agentRoutes);
app.use("/api", intentRoutes);

// Core API routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/booking", bookingRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    agents: ["orchestrator", "intent", "matching", "booking", "notification", "chat"],
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 REConnect backend running on port ${PORT}`);
  console.log(`🤖 Agentic AI: Claude ${process.env.ANTHROPIC_API_KEY ? "✓ connected" : "✗ no API key"}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health\n`);
});
