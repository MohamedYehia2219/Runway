import express from "express";
import { shopifyAuthController } from "../controllers/auth.controller.js";

export const authRouter = express.Router();
authRouter.post("/signup", shopifyAuthController.signup);
authRouter.post("/login", shopifyAuthController.login);
authRouter.post("/device-token", shopifyAuthController.addDeviceToken);
authRouter.post("/logout", shopifyAuthController.logout);
