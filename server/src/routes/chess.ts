import express from "express";
import axios from "axios";
import https from "https";

const router = express.Router();

const httpsAgent = new https.Agent({ keepAlive: true });

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Chesslytics/1.0 (contact: chrismarquez@example.com)",
  Accept: "application/json",
};

router.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { data } = await axios.get(
      `https://api.chess.com/pub/player/${username}`,
      { headers: HEADERS, httpsAgent }
    );
    res.json(data);
  } catch (err: any) {
    console.error("❌ Profile fetch failed:", err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: "Failed to fetch player profile" });
  }
});

router.get("/stats/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { data } = await axios.get(
      `https://api.chess.com/pub/player/${username}/stats`,
      { headers: HEADERS, httpsAgent }
    );
    res.json(data);
  } catch (err: any) {
    console.error("❌ Stats fetch failed:", err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: "Failed to fetch player stats" });
  }
});

export default router;
