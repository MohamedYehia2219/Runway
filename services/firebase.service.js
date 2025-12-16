import admin from "firebase-admin";
import { auth, db } from "../config/firebase.js";

export class firebaseServices
{
  static async ensureFirebaseUser({ email, password, displayName }) {
    try {
      const user = await auth.getUserByEmail(email);
      throw new Error("EMAIL_ALREADY_EXISTS");
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
    }
    const user = await auth.createUser({ email, password: password || undefined, displayName });
    return user; // contains uid
  }

  static async rollbackFirebaseUser(uid) {
    await auth.deleteUser(uid);
  }

  static async createUserDoc(uid, data) {
    await db.collection("users").doc(uid).set({
      ...data,
      createdAt: new Date()
    });
  }

  static async getFirebaseUserByEmail(email) {
    try {
      return await auth.getUserByEmail(email);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        const e = new Error("USER_NOT_FOUND");
        e.status = 404;
        throw e;
      }
      throw err;
    }
  }

  static async getUserDoc(uid) {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) {
      const e = new Error("USER_DOC_NOT_FOUND");
      e.status = 404;
      throw e;
    }
    return snap.data();
  }

  static async registerDeviceToken(uid, deviceToken) {
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        deviceTokens: admin.firestore.FieldValue.arrayUnion(deviceToken)
      },
      { merge: true }
    );
  }

  static async unregisterDeviceToken(uid, deviceToken) {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      deviceTokens: admin.firestore.FieldValue.arrayRemove(deviceToken)
    });
  }

    static async getUserByShopifyCustomerId(shopifyCustomerId) {
    const snap = await db
      .collection("users")
      .where("shopifyCustomerId", "==", shopifyCustomerId)
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    return {
      uid: snap.docs[0].id,
      data: snap.docs[0].data()
    };
  }
}