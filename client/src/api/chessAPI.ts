import axios from "axios";

export async function getProfile(username: string) {
  const { data } = await axios.get(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}`
  );
  return data;
}

export async function getStats(username: string) {
  const { data } = await axios.get(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`
  );
  return data;
}
