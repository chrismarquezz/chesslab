import express from "express";

const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
  res.send("Simple test server is running ✅");
});

app.listen(PORT, () => {
  console.log(`✅ Listening on http://localhost:${PORT}`);
});

// Keep process alive
process.stdin.resume();
