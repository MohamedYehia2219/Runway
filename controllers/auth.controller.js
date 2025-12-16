import { validateEmail, validatePassword } from "../utils/validators.js";
import { generateStrongPassword, encryptPassword, decryptPassword } from "../services/password.service.js";
import { firebaseServices } from "../services/firebase.service.js";
import { createShopifyCustomer, loginShopifyCustomer } from "../services/shopify.service.js";

export class shopifyAuthController
{
    static async signup(req, res, next)
    {
        let firebaseUser;
        try 
        {
            let {email, password, fname, lname, gender, phone, phoneVerified} = req.body;
            if (!email || !validateEmail(email))
                throw new Error("INVALID_EMAIL");
            email = email?.toLowerCase().trim();
            
            const isProvider = !password;
            if (!isProvider && !validatePassword(password))
                throw new Error("WEAK_PASSWORD");

            const rawShopifyPassword = isProvider ? generateStrongPassword() : password;
            const encryptedShopifyPassword = encryptPassword(rawShopifyPassword);

            //Firebase
            firebaseUser = await firebaseServices.ensureFirebaseUser({email, password: isProvider ? undefined : password,
                displayName: `${fname || ""} ${lname || ""}`.trim()
            });

            //Shopify
            const shopifyCustomerId = await createShopifyCustomer({ email, password: rawShopifyPassword, fname, lname, phone });

            // Firestore
            await firebaseServices.createUserDoc(firebaseUser.uid, { email, fname, lname, gender, phone, phoneVerified: !!phoneVerified,
                    provider: isProvider, shopifyCustomerId, shopifyPassword: encryptedShopifyPassword
                });

            return res.status(201).json({
                ok: true,
                shopifyCustomerId
            });
        } catch (err)
        {
            if (firebaseUser?.uid) {
                await firebaseServices.rollbackFirebaseUser(firebaseUser.uid);
            }
            next(err);
        }
    }

    static async login(req, res, next)
    {
        try
        {
            let { email, password } = req.body;
            if (!email || !validateEmail(email)) {
                throw new Error("INVALID_EMAIL");
            }
            email = email.toLowerCase().trim();

            // Firebase Auth → uid
            const firebaseUser = await firebaseServices.getFirebaseUserByEmail(email);
            const uid = firebaseUser.uid;
           
            // password
            let shopifyPassword;
            if (password) {
                shopifyPassword = password;
            } else {
                const userDoc = await firebaseServices.getUserDoc(uid);
                if (!userDoc.shopifyPassword) {
                    throw new Error("SHOPIFY_PASSWORD_MISSING");
                }
                shopifyPassword = decryptPassword(userDoc.shopifyPassword);
            }

            // Shopify login
            const token = await loginShopifyCustomer({email, password: shopifyPassword});
            return res.status(200).json({
                ok: true,
                uid,
                shopifyAccessToken: token.accessToken,
                expiresAt: token.expiresAt
            });
        } catch (err) {
            next(err);
        }
    }

    static async addDeviceToken(req, res, next)
    {
        try 
        {
            const { uid, deviceToken } = req.body;
            if (!uid || !deviceToken) {
                throw new Error("INVALID_PAYLOAD");
            }
            await firebaseServices.registerDeviceToken(uid, deviceToken);
            return res.status(200).json({ ok: true });
        } 
        catch (err) {
            next(err);
        }
    }

    static async logout(req, res, next)
    {
        try 
        {
            const { uid, deviceToken } = req.body;
            if (!uid || !deviceToken) {
                throw new Error("INVALID_PAYLOAD");
            }
            await firebaseServices.unregisterDeviceToken(uid, deviceToken);
            return res.status(200).json({ ok: true });
        } catch (err) {
            next(err);
        }
    }
}


