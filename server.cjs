const express = require("express");
const cors = require("cors");
const { sendOrderNotification, initializeWhatsApp } = require("./whatsapp.cjs");

const app = express();
app.use(cors());
app.use(express.json());

let client = null;

// Initialize WhatsApp client on server startup
(async () => {
  try {
    client = await initializeWhatsApp();
    console.log("✅ WhatsApp client initialized");
    
    // Listen for state changes
    client.onStateChange((state) => {
      console.log("🔔 WhatsApp STATE CHANGED:", state);
    });

    // WhatsApp is initialized and ready for order notifications.
    console.log("📍 WhatsApp client is ready for order notifications.");

  } catch (error) {
    console.error("❌ Failed to initialize WhatsApp:", error.message);
  }
})();

app.post("/send-order-notification", async (req, res) => {
  console.log("📬 ORDER NOTIFICATION REQUEST RECEIVED");
  console.log(req.body);
  
  try {
    if (!client) {
      console.warn("⚠️ Server WhatsApp client not initialized, retrying initialization...");
      client = await initializeWhatsApp();
    }

    const order = req.body;
    await sendOrderNotification(order);
    console.log("✅ Order notification sent via WhatsApp");
    res.json({ success: true, message: "WhatsApp notification sent successfully" });
  } catch (error) {
    console.error("❌ Error sending WhatsApp notification:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to send notification",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
