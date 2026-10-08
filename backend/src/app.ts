import "dotenv/config";
import express from "express";
import cors from "cors";
import { api } from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

export const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", api);
app.use(notFound);
app.use(errorHandler);
