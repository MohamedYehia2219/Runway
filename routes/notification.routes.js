import express from 'express'
import { notificationController } from '../controllers/notification.controller.js';

export const notificationRouter = express.Router();
notificationRouter.post('/', notificationController.sendEventNotification);