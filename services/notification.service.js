import admin from "firebase-admin";
import { db, fcm } from "../config/firebase.js";

const MAX_BATCH = 100;

export async function sendNotificationToUser(uid, payload) {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return;

  const { deviceTokens = [] } = userSnap.data();
  if (!deviceTokens.length) return;

  const messages = deviceTokens.map(token => ({
    token,
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: payload.data || {}
  }));

  for (let i = 0; i < messages.length; i += MAX_BATCH) {
    const batch = messages.slice(i, i + MAX_BATCH);
    const resp = await fcm.sendAll(batch);

    const tokensToRemove = [];

    resp.responses.forEach((r, idx) => {
      if (!r.success) {
        const err = r.error;
        if ( err.code === "messaging/registration-token-not-registered" || err.code === "messaging/invalid-registration-token")
        {
          tokensToRemove.push(batch[idx].token);
        }
      }
    });

    // cleanup invalid tokens
    if (tokensToRemove.length) {
      const userRef = db.collection("users").doc(uid);
      for (const t of tokensToRemove) {
        await userRef.update({
          deviceTokens: admin.firestore.FieldValue.arrayRemove(t)
        });
      }
    }
  }
}
