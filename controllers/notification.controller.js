import { firebaseServices } from "../services/firebase.service.js";
import { sendNotificationToUser } from "../services/notification.service.js";

export class notificationController
{
    static async sendEventNotification(req, res, next)
    {
        try 
        {
            const { eventType, shopifyCustomerId, extra } = req.body;
            if (!eventType || !shopifyCustomerId) {
                throw new Error("INVALID_EVENT_PAYLOAD");
            }

            const user = await firebaseServices.getUserByShopifyCustomerId(shopifyCustomerId);
            if (!user) {
                return res.json({ ok: true });
            }

            let payload;
            switch (eventType) {
                case "ORDER_CREATED":
                payload = {
                    title: "Order Created",
                    body: "Your order has been placed successfully",
                    data: { type: "ORDER_CREATED", ...extra }
                };
                break;

                case "DELIVERY_ON_THE_WAY":
                payload = {
                    title: "Delivery Update",
                    body: "Your order is on the way 🚚",
                    data: { type: "DELIVERY_ON_THE_WAY", ...extra }
                };
                break;

                default:
                return res.json({ ok: true });
            }
            await sendNotificationToUser(user.uid, payload);
            return res.status(200).json({ ok: true, message: "Notification sent successfully." });
        } catch (err) {
            next(err);
        }
    }
}