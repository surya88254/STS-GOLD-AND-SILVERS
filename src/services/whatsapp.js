// Service wrapper to re-export Node-side WhatsApp sender.
// Frontend imports this file path; be cautious—this module proxies to a Node-only module.
export { sendOrderNotification } from "../../whatsapp.js";
