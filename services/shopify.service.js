import fetch from "node-fetch";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN;

console.log(SHOPIFY_STORE);
//console.log(SHOPIFY_ADMIN_TOKEN);
//console.log(STOREFRONT_TOKEN);

export async function createShopifyCustomer({email, password, fname, lname, phone}) {
  const query = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }
  `;
  const variables = {
    input: {email, password, firstName: fname, lastName: lname, phone}
  };

  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify({ query, variables })
    }
  );

  const json = await res.json();
  console.log("SHOPIFY RESPONSE:", JSON.stringify(json, null, 2));
  const errors = json?.data?.customerCreate?.userErrors;
  if (errors?.length) {
    throw new Error(errors[0]?.message);
  }
  return json.data.customerCreate.customer.id;
}

// const API_VERSION = "2024-10"; 
// export async function createShopifyCustomer({email, password, fname, lname, phone}) {
//   const query = `
//     mutation customerCreate($input: CustomerInput!) {
//       customerCreate(input: $input) {
//         customer { id }
//         userErrors { message }
//       }
//     }
//   `;

//   const variables = {
//     input: { email, password, firstName: fname, lastName: lname, phone }
//   };

//   try {
//     const res = await fetch(
//       `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN // Ensure this is loaded
//         },
//         body: JSON.stringify({ query, variables })
//       }
//     );

//     // 1. Check HTTP Status Code first
//     if (!res.ok) {
//         const text = await res.text();
//         throw new Error(`Shopify API HTTP Error ${res.status}: ${text}`);
//     }

//     const json = await res.json();
    
//     // 2. Check for Top-Level Errors (e.g., Auth failed, Throttling, Not Found)
//     if (json.errors) {
//         console.error("Shopify Top-Level Errors:", JSON.stringify(json.errors, null, 2));
//         // If json.errors is a string (like "Not Found"), handle it
//         const errorMsg = typeof json.errors === 'string' ? json.errors : json.errors[0].message;
//         throw new Error(errorMsg);
//     }

//     // 3. Check for GraphQL Execution Errors (User Errors)
//     const userErrors = json?.data?.customerCreate?.userErrors;
//     if (userErrors?.length) {
//       throw new Error(userErrors[0]?.message);
//     }

//     // 4. Safe access to data
//     if (!json.data || !json.data.customerCreate) {
//         throw new Error("Unexpected Shopify response structure");
//     }

//     return json.data.customerCreate.customer.id;

//   } catch (err) {
//     console.error("Create Shopify Customer Failed:", err.message);
//     throw err; // Re-throw to be caught by your main signup try/catch
//   }
// }

export async function loginShopifyCustomer({ email, password }) {
  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        userErrors {
          message
        }
      }
    }
  `;

  const resp = await fetch(
    `https://${SHOPIFY_STORE}/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN
      },
      body: JSON.stringify({query, variables: { input: { email, password } } })
    }
  );

  const json = await resp.json();
  const result = json?.data?.customerAccessTokenCreate;
  if (!result || result.userErrors?.length) {
    const e = new Error("SHOPIFY_LOGIN_FAILED");
    e.details = result?.userErrors;
    e.status = 401;
    throw e;
  }
  return result.customerAccessToken;
}