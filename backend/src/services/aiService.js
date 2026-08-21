import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const aiClient = axios.create({ baseURL: env.AI_SERVICE_URL, timeout: 5000 });

export async function predictRisk(payload) {
  try {
    const { data } = await aiClient.post("/predict-risk", payload);
    return data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    throw new AppError(503, detail ? `AI service rejected the request: ${detail}` : "AI insight service is unavailable");
  }
}

