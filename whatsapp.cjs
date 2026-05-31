const wppconnect = require("@wppconnect-team/wppconnect");

let client;
let whatsappState = null;

const waitForWhatsAppState = async (desiredState = 'MAIN (NORMAL)', timeout = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (whatsappState === desiredState) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};

const sendViaWAPI = async (to, message) => {
  try {
    const res = await client.page.evaluate(async ({ to, message }) => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const safeCall = async (fn, ...args) => {
        try {
          return { success: true, result: await fn(...args) };
        } catch (error) {
          return { success: false, error: error?.message || String(error) };
        }
      };

      if (typeof WAPI.sendExist !== 'function') {
        return { success: false, error: 'WAPI.sendExist unavailable' };
      }

      const exist = await WAPI.sendExist(to);
      if (!exist || exist.erro) {
        return { success: false, error: 'number_not_exists' };
      }

      const targetId = exist.id && exist.id._serialized ? exist.id._serialized : to;
      const openMethods = [
        { name: 'openChat', fn: WAPI.openChat },
        { name: 'openChatBottom', fn: WAPI.openChatBottom },
        { name: 'getChatById', fn: WAPI.getChatById },
        { name: 'getchatId', fn: WAPI.getchatId },
        { name: 'getChat', fn: WAPI.getChat }
      ];

      for (const method of openMethods) {
        if (typeof method.fn === 'function') {
          const attempt = await safeCall(method.fn, targetId);
          if (attempt.success) {
            break;
          }
        }
      }

      await wait(700);

      const sendMethods = [
        { name: 'sendMessage', fn: WAPI.sendMessage },
        { name: 'sendMessage2', fn: WAPI.sendMessage2 }
      ];
      let lastError = null;
      for (const method of sendMethods) {
        if (typeof method.fn !== 'function') {
          continue;
        }
        const attempt = await safeCall(method.fn, targetId, message);
        if (attempt.success) {
          const result = attempt.result;
          if (typeof result === 'object' && result && result.erro) {
            lastError = result.text || result.erro || 'WAPI send failed';
            continue;
          }
          return { success: true, result: JSON.parse(JSON.stringify(result)) };
        }
        lastError = attempt.error || lastError;
      }

      return { success: false, error: lastError || 'WAPI send failed' };
    }, { to, message });

    return res;
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
};
// Initialize WhatsApp client
const initializeWhatsApp = async () => {
  if (client) return client;

  try {
    client = await wppconnect.create({
      session: "sts-session-2",
      headless: false,
      devtools: false,
      useChrome: true,
      autoCloseChat: false,
      statusFind: false,
      logQR: false,
      catchQR: (base64Qr, asciiQR) => {
        console.log("SCAN THIS QR:");
        console.log(asciiQR);
      },
      disableSpins: true,
      disableWelcome: true,
      autoClose: false,
      puppeteerOptions: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
        ]
      }
    });

    client.onStateChange((state) => {
      whatsappState = state;
      console.log("🔔 WhatsApp current state:", state);
    });

    console.log("✓ WhatsApp client initialized");
    return client;
  } catch (error) {
    console.error("✗ WhatsApp initialization error:", error);
    throw error;
  }
};

async function sendOrderNotification(order) {
  try {
    if (!client) {
      console.warn("⚠️ WhatsApp client is not initialized, attempting to initialize now...");
      await initializeWhatsApp();
    }

    if (!client) {
      throw new Error("WhatsApp client is not initialized after retry");
    }

    const message = `🔔 NEW ORDER RECEIVED – STS LUXURY JEWELLERS\n\n` +
                    `Customer: ${order.customer_name || order.customer || "Unknown"}\n` +
                    `Email: ${order.customer_email || "N/A"}\n` +
                    `Phone: ${order.phone || "N/A"}\n\n` +
                    `Product: ${order.product_name || order.product || "Unknown Product"}\n` +
                    `Category: ${order.category || "N/A"}\n` +
                    `Weight: ${order.weight || "0"}g\n` +
                    `Quantity: ${order.quantity || 1}\n\n` +
                    `Total: ₹${order.final_total || order.total || order.price || "0"}\n` +
                    `Payment Method: ${order.payment_method || "N/A"}\n\n` +
                    `📍 Address:\n${order.address || ""}\n${order.city || ""} - ${order.pincode || ""}\n\n` +
                    `Order ID: ${order.id || order.order_id || "N/A"}\n` +
                    `Status: 🟡 Pending\n\n` +
                    `---\nAuto-generated notification from STS Luxury Jewellers`;

    const adminPhoneNumber = "918825485658@c.us";

    // Ensure client is stable (MAIN) before sending
    const ready = await waitForWhatsAppState('MAIN (NORMAL)', 10000);
    if (!ready) console.warn('⚠️ WhatsApp not in MAIN state before send, continuing anyway');

    // Attempt send with retries/backoff to handle detached frames or transient reloads
    let attempts = 0;
    let lastError = null;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      attempts += 1;
      // diagnostic: show page/frame state before attempting send
      try {
        const isClosed = client && client.page && typeof client.page.isClosed === 'function' ? client.page.isClosed() : false;
        const frames = client && client.page && typeof client.page.frames === 'function' ? client.page.frames().map(f => f.url()).slice(0,5) : [];
        console.log('DBG client.page.isClosed=', isClosed, 'DBG frames=', frames);
      } catch (dbgErr) {
        console.error('DBG error while inspecting page/frames:', dbgErr && dbgErr.stack ? dbgErr.stack : dbgErr);
      }
      console.log(`ℹ️ Send attempt ${attempts}/${maxAttempts} via ${(client && typeof client.sendText === 'function') ? 'client.sendText' : 'page.evaluate'}`);
      try {
        if (client && typeof client.openChat === 'function') {
          try {
            await client.openChat(adminPhoneNumber);
          } catch (openErr) {
            console.warn('⚠️ client.openChat failed:', openErr && openErr.message ? openErr.message : openErr);
          }
        }

        if (client && typeof client.sendText === 'function') {
          const sendResult = await client.sendText(adminPhoneNumber, message);
          console.log("✅ Order notification sent via WhatsApp to:", adminPhoneNumber, sendResult);
          return JSON.parse(JSON.stringify(sendResult));
        }

        const evalResult = await sendViaWAPI(adminPhoneNumber, message);
        if (evalResult && evalResult.success) {
          console.log("✅ Order notification sent via WhatsApp to:", adminPhoneNumber, evalResult.result);
          return evalResult.result;
        }

        throw new Error(evalResult && evalResult.error ? evalResult.error : 'Unknown send error');
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || err);
        console.error(`⚠️ Send attempt ${attempts} failed:`, msg);

        const shouldTryWAPI = msg.toLowerCase().includes('chat not found') ||
          msg.toLowerCase().includes('chat_not_found') ||
          msg.toLowerCase().includes('chat not found in chatstore') ||
          /message .* not found/.test(msg.toLowerCase()) ||
          msg.toLowerCase().includes('detached') ||
          msg.toLowerCase().includes('target closed');

        if (shouldTryWAPI) {
          console.warn('⚠️ Attempting WAPI fallback to create/open chat and resend');
          try {
            const wapiRes = await sendViaWAPI(adminPhoneNumber, message);
            if (wapiRes && wapiRes.success) {
              console.log('✅ Order notification sent via WAPI fallback to:', adminPhoneNumber, wapiRes.result);
              return wapiRes.result;
            }
            console.warn('⚠️ WAPI fallback did not succeed:', wapiRes && wapiRes.error);
          } catch (wapiErr) {
            console.error('✖️ WAPI fallback error:', wapiErr && wapiErr.stack ? wapiErr.stack : wapiErr);
          }
        }

        // If detached frame or closed page, reinitialize the client.
        if (msg.toLowerCase().includes('detached') || msg.toLowerCase().includes('target closed') || msg.toLowerCase().includes('no open browser')) {
          console.warn('⚠️ Detected detached/closed page; reinitializing client...');
          try {
            client = await initializeWhatsApp();
            await new Promise(r => setTimeout(r, 1500 * attempts));
          } catch (initErr) {
            console.error('✖️ Reinitialize failed:', initErr && initErr.stack ? initErr.stack : initErr);
          }
        }

        await new Promise(r => setTimeout(r, 500 * attempts));
      }
    }

    // all attempts failed
    throw new Error(lastError?.message || 'Failed to send after retries');
  } catch (error) {
    console.error("❌ Failed to send WhatsApp notification:", error);
    throw error;
  }
}

module.exports = { sendOrderNotification, initializeWhatsApp };
