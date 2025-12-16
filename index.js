import "./config/dotenv.js"
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/shopify/auth", authRouter);
app.use("/shopify/notification", notificationRouter);

app.use((err, req, res, next) => {
  console.error("Exception: ", err);
  return res.status(err.status || 500).json({ok: false, error: err.message || "Internal Server Error"});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
