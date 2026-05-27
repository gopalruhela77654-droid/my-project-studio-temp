import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Redis } from '@upstash/redis';

// Default provided client credentials
const DEFAULT_QIKINK_CLIENT_ID = "-882206864565754";
const DEFAULT_QIKINK_CLIENT_SECRET = "-79ee0a557efe56f44c5cc1bfd45d1534237f37dcc663eabc1885716408abd53f";
const DEFAULT_QIKINK_ENDPOINT = "https://api.qikink.com";

// In-memory fallback if Redis is not configured or fails
let memoryOrders: Record<string, any> = {};
let memoryOrderKeys: string[] = [];

let redisClient: Redis | null = null;
function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Helper: Persist order
  const saveOrderToDB = async (key: string, data: any) => {
    memoryOrders[key] = data;
    if (!memoryOrderKeys.includes(key)) {
      memoryOrderKeys.unshift(key);
    }
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(key, data);
        const listKeys = await redis.lrange("all_orders", 0, -1);
        if (!listKeys.includes(key)) {
          await redis.lpush("all_orders", key);
        }
      } catch (e) {
        console.error("Redis save error:", e);
      }
    }
  };

  // Helper: Retrieve order
  const getOrderFromDB = async (key: string): Promise<any | null> => {
    const redis = getRedisClient();
    if (redis) {
      try {
        const data = await redis.get(key);
        if (data) return data;
      } catch (e) {
        console.error("Redis read error:", e);
      }
    }
    return memoryOrders[key] || null;
  };

  // Helper: Delete order
  const deleteOrderFromDB = async (key: string) => {
    delete memoryOrders[key];
    memoryOrderKeys = memoryOrderKeys.filter(k => k !== key);
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(key);
        await redis.lrem("all_orders", 0, key);
      } catch (e) {
        console.error("Redis del error:", e);
      }
    }
  };

  // API Route: Diagnose status
  app.get("/api/diagnose-orders", async (req, res) => {
    try {
      const redis = getRedisClient();
      const status: Record<string, any> = {
        timestamp: new Date().toISOString(),
        qikink: {
          clientId_present: !!(process.env.QIKINK_CLIENT_ID || DEFAULT_QIKINK_CLIENT_ID),
          clientSecret_present: !!(process.env.QIKINK_CLIENT_SECRET || DEFAULT_QIKINK_CLIENT_SECRET),
          configured_endpoint: process.env.QIKINK_ENDPOINT || DEFAULT_QIKINK_ENDPOINT,
        },
        redis: {
          url_present: !!process.env.KV_REST_API_URL,
          token_present: !!process.env.KV_REST_API_TOKEN,
        },
        saved_orders: []
      };

      const ordersList = await fetchAllOrders();
      status.saved_orders = ordersList;
      return res.status(200).json(status);
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Helper: Fetch all orders
  const fetchAllOrders = async () => {
    const redis = getRedisClient();
    let keys: string[] = [];
    if (redis) {
      try {
        keys = await redis.lrange("all_orders", 0, 200);
      } catch (e) {
        console.error("Failed to read orders list from Redis:", e);
      }
    }
    
    // Merge keys
    const allKeysSet = new Set([...memoryOrderKeys, ...keys]);
    const mergedKeys = Array.from(allKeysSet).sort((a, b) => b.localeCompare(a)); // sort descending
    
    const results: any[] = [];
    for (const key of mergedKeys) {
      const data = await getOrderFromDB(key);
      if (data) {
        results.push({ key, data });
      }
    }
    return results;
  };

  // API Route: Save Order Draft (Place Order front-facing)
  app.post("/api/place-order", async (req, res) => {
    try {
      const { 
        customerName, 
        shippingAddress, 
        contactDetails, 
        itemOrdered, 
        quantity,
        size,
        color,
        customImage,
        price
      } = req.body || {};

      console.log("Saving new draft order:", { customerName, itemOrdered, quantity, size, color });

      const timestamp = Math.floor(Date.now() / 1000);
      const orderKey = `order_${timestamp}_${Math.floor(Math.random() * 1000)}`;

      const orderData = {
        customerName: customerName || "",
        shippingAddress: shippingAddress || "",
        contactDetails: contactDetails || "",
        itemOrdered: itemOrdered || "AURA-Custom Apparel",
        quantity: parseInt(String(quantity || 1), 10) || 1,
        size: size || "M",
        color: color || "White",
        customImage: customImage || null,
        price: parseFloat(String(price || 35)) || 35,
        timestamp,
        qikink_status: "draft", // Stored as draft initially
        qikink_errors: [] as string[],
        qikink_order_id: null as string | null
      };

      await saveOrderToDB(orderKey, orderData);

      return res.status(200).json({
        success: true,
        message: "Your custom order request has been logged as DRAFT! The store director will review and dispatch details soon.",
        orderKey,
        order: orderData
      });
    } catch (e: any) {
      console.error("Draft placement failed:", e);
      return res.status(500).json({ success: false, message: e.message || "Failed to log draft" });
    }
  });

  // API Route: List all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const list = await fetchAllOrders();
      return res.status(200).json({ success: true, orders: list });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // API Route: Update an order
  app.post("/api/orders/update", async (req, res) => {
    try {
      const { orderKey, ...updatedFields } = req.body || {};
      if (!orderKey) {
        return res.status(400).json({ success: false, message: "orderKey is verified required" });
      }

      const existing = await getOrderFromDB(orderKey);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const merged = {
        ...existing,
        ...updatedFields
      };

      await saveOrderToDB(orderKey, merged);
      return res.status(200).json({ success: true, message: "Order metadata updated successfully", order: merged });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // API Route: Delete an order
  app.post("/api/orders/delete", async (req, res) => {
    try {
      const { orderKey } = req.body || {};
      if (!orderKey) {
        return res.status(400).json({ success: false, message: "orderKey is required" });
      }
      await deleteOrderFromDB(orderKey);
      return res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // API Route: Confirm & Push Draft Order to Qikink (1-Click)
  app.post("/api/orders/confirm", async (req, res) => {
    try {
      const { orderKey } = req.body || {};
      if (!orderKey) {
        return res.status(400).json({ success: false, message: "orderKey is required" });
      }

      const orderData = await getOrderFromDB(orderKey);
      if (!orderData) {
        return res.status(404).json({ success: false, message: "Order not found in DB drafts" });
      }

      const qikinkClientId = process.env.QIKINK_CLIENT_ID || DEFAULT_QIKINK_CLIENT_ID;
      const qikinkClientSecret = process.env.QIKINK_CLIENT_SECRET || DEFAULT_QIKINK_CLIENT_SECRET;
      const qikinkEndpoint = process.env.QIKINK_ENDPOINT || DEFAULT_QIKINK_ENDPOINT;

      console.log(`Triggering 1-Click Sync to Qikink for key: ${orderKey}...`);

      let accessToken: string | null = null;
      let detailedErrors: string[] = [];

      // Token Authentication Step
      const authEndpoints = [
        '/api/v2/session-request',
        '/api/v2/session',
        '/v2/session-request',
        '/v2/session',
        '/api/session-request',
        '/session-request',
        '/api/v2/oauth/token',
        '/oauth/token'
      ];

      for (const authPath of authEndpoints) {
        const targetAuthUrl = `${qikinkEndpoint.replace(/\/+$/, "")}${authPath}`;
        try {
          const authResponse = await fetch(targetAuthUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: qikinkClientId,
              ClientId: qikinkClientId,
              client_secret: qikinkClientSecret,
              grant_type: "client_credentials"
            })
          });

          if (authResponse.ok) {
            const text = await authResponse.text();
            try {
              const parsed = JSON.parse(text);
              const tokenCandidate = parsed?.access_token || parsed?.data?.access_token || parsed?.token || parsed?.data?.token || parsed?.sessionId || parsed?.data?.sessionId || parsed?.session_id;
              if (tokenCandidate) {
                accessToken = tokenCandidate;
                console.log(`Token acquired from: ${authPath}`);
                break;
              }
            } catch (jsonErr) {
              console.warn(`JSON parse check missed on ${authPath}:`, jsonErr);
            }
          }
        } catch (e: any) {
          console.warn(`Auth process check exception on ${targetAuthUrl}:`, e.message);
        }
      }

      // Map Order Metadata securely
      const nameStr = (orderData.customerName || "Guest").trim();
      const spaceIndex = nameStr.indexOf(" ");
      const first_name = spaceIndex !== -1 ? nameStr.substring(0, spaceIndex) : nameStr;
      const last_name = spaceIndex !== -1 ? nameStr.substring(spaceIndex + 1) : "Customer";

      const addrStr = (orderData.shippingAddress || "").trim();
      const addrParts = addrStr.split(",").map(s => s.trim()).filter(Boolean);

      const pincodeMatch = /\b\d{6}\b/.exec(addrStr);
      const pincode = pincodeMatch ? pincodeMatch[0] : "110001";

      const phoneMatch = /\b\d{10,12}\b/.exec(orderData.contactDetails || addrStr || "");
      const phone = phoneMatch ? phoneMatch[0] : (orderData.contactDetails || "9999999999");

      let city = "New Delhi";
      let state = "Delhi";
      if (addrParts.length > 1) {
        city = addrParts[addrParts.length - 2] || "New Delhi";
        state = addrParts[addrParts.length - 1] || "Delhi";
        city = city.replace(/\b\d{6}\b/g, "").trim() || "New Delhi";
        state = state.replace(/\b\d{6}\b/g, "").trim() || "Delhi";
      }

      const addressLine1 = addrParts[0] || addrStr || "Address Line 1";
      const addressLine2 = addrParts.slice(1, -2).join(", ") || addrParts[1] || "Near Landmark";

      // Formulate custom SKU containing product item, size, color directly inside line items!
      const mappedSku = `AURA-${(orderData.itemOrdered || "Tshirt").toUpperCase().replace(/\s+/g, "-")}-${(orderData.size || "M").toUpperCase()}-${(orderData.color || "WHITE").toUpperCase()}`;

      const lineItem = {
        title: orderData.itemOrdered || "AURA Premium Apparel",
        name: orderData.itemOrdered || "AURA Premium Apparel",
        quantity: parseInt(String(orderData.quantity || 1), 10) || 1,
        qty: parseInt(String(orderData.quantity || 1), 10) || 1,
        price: String(orderData.price || "35.00"),
        sku: mappedSku,
        product_id: 1,
        variant_id: 1,
        custom_design_url: orderData.customImage || undefined
      };

      const payload = {
        order_number: `AURA_ORDER_${orderData.timestamp}`,
        order_id: `AURA_ORDER_${orderData.timestamp}`,
        id: `AURA_ORDER_${orderData.timestamp}`,
        name: nameStr,
        first_name: first_name,
        last_name: last_name,
        phone: phone,
        email: "guest@example.com",
        address: addrStr,
        address_1: addressLine1,
        address_2: addressLine2,
        city: city,
        state: state,
        pincode: pincode,
        payment_mode: "PREPAID",
        shipping: {
          first_name: first_name,
          last_name: last_name,
          address_1: addressLine1,
          address_2: addressLine2,
          city: city,
          state: state,
          postcode: pincode,
          country: "IN",
          email: "guest@example.com",
          phone: phone
        },
        billing: {
          first_name: first_name,
          last_name: last_name,
          address_1: addressLine1,
          address_2: addressLine2,
          city: city,
          state: state,
          postcode: pincode,
          country: "IN",
          email: "guest@example.com",
          phone: phone
        },
        line_items: [lineItem]
      };

      const orderHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        orderHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      orderHeaders['X-Client-ID'] = qikinkClientId;
      orderHeaders['X-Client-Secret'] = qikinkClientSecret;
      orderHeaders['client_id'] = qikinkClientId;
      orderHeaders['ClientId'] = qikinkClientId;
      orderHeaders['client_secret'] = qikinkClientSecret;
      orderHeaders['client-id'] = qikinkClientId;
      orderHeaders['client-secret'] = qikinkClientSecret;

      let orderSuccess = false;
      let finalOrderResponseText = "";
      const baseEndpoint = qikinkEndpoint.replace(/\/+$/, "");

      const orderPaths = [
        "/api/v2/orders",
        "/api/v2/orders/add",
        "/api/v1/orders",
        "/api/v1/orders/add",
        "/api/orders",
        "/api/orders/add",
        "/v2/orders",
        "/v2/orders/add",
        "/v1/orders",
        "/v1/orders/add",
        "/orders",
        "/orders/add",
        "/index.php/api/v2/orders",
        "/index.php/v2/orders",
        "/index.php/orders"
      ];

      for (const path of orderPaths) {
        const targetUrl = `${baseEndpoint}${path}`;
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: orderHeaders,
            body: JSON.stringify(payload)
          });
          const responseText = await response.text();
          
          if (response.ok) {
            orderSuccess = true;
            finalOrderResponseText = responseText;
            console.log(`Successfully dispatched draft to Qikink endpoint: ${targetUrl}`);
            break;
          } else {
            detailedErrors.push(`Path ${path} failed with Status ${response.status}: ${responseText.substring(0, 150)}`);
          }
        } catch (err: any) {
          detailedErrors.push(`Path ${path} Exception: ${err?.message || String(err)}`);
        }
      }

      if (!orderSuccess) {
        // Save as failure so users can diagnose error codes
        const failedOrder = {
          ...orderData,
          qikink_status: "failed",
          qikink_errors: detailedErrors
        };
        await saveOrderToDB(orderKey, failedOrder);
        return res.status(400).json({
          success: false,
          message: "Could not push order directly to Qikink server endpoints. Errors recorded.",
          errors: detailedErrors
        });
      }

      let responseData: any = null;
      try {
        responseData = JSON.parse(finalOrderResponseText);
      } catch {
        responseData = { rawResponse: finalOrderResponseText };
      }

      const confirmedOrder = {
        ...orderData,
        qikink_status: "created",
        qikink_order_id: responseData?.order_id || responseData?.id || responseData?.data?.order_id || `AURA_DRAFT_${orderData.timestamp}`,
        qikink_response: responseData,
        qikink_errors: []
      };

      await saveOrderToDB(orderKey, confirmedOrder);

      return res.status(200).json({
        success: true,
        message: "Order finalized and created in Qikink with 1-Click execution sync!",
        order: confirmedOrder
      });

    } catch (e: any) {
      console.error("Manual order confirm failed:", e);
      return res.status(500).json({ success: false, message: e.message || "Failed manual confirm pipeline" });
    }
  });

  // Serve Frontend with Vite / Dist Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-Stack Express Server active on http://localhost:${PORT}`);
  });
}

startServer();
