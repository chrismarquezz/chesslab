import express from "express";
import cors from "cors";
import chessRouter from "./routes/chess";
import reviewRouter from "./routes/review";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("Simple test server is running ✅");
});

app.use("/api/chess", chessRouter);
app.use("/api/review", reviewRouter);

const server = app.listen(PORT, () => {
  console.log(`✅ Listening on http://localhost:${PORT}`);
});

const handleShutdown = () => {
  console.log("🔻 Shutting down server...");
  server.close(() => process.exit(0));
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

// Keep process alive
process.stdin.resume();
