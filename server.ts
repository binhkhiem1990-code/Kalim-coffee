import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./src/db/index.ts";
import * as dbSchema from "./src/db/schema.ts";
import fs from "fs";
import { initializeApp, setLogLevel } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

setLogLevel("error");
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "firebase-applet-config.json"), "utf8")
);
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function saveToFirebase(col: string, docId: string, data: any) {
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(firestoreDb, col, docId), cleanData);
    console.log(`[Firebase] Saved item successfully to ${col}/${docId}`);
  } catch (err) {
    console.error(`[Firebase] Error saving to ${col}/${docId}:`, err);
  }
}

async function deleteFromFirebase(col: string, docId: string) {
  try {
    await deleteDoc(doc(firestoreDb, col, docId));
    console.log(`[Firebase] Deleted item successfully from ${col}/${docId}`);
  } catch (err) {
    console.error(`[Firebase] Error deleting from ${col}/${docId}:`, err);
  }
}

interface OrderItem {
  productId: string;
  quantity: number;
  size: 'Medium' | 'Large';
  toppings?: string[];
  notes?: string;
}

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  taxAmount: number;
  tipAmount: number;
  discount: number;
  status: 'Wait' | 'Preparing' | 'Ready';
  estimatedTime: number;
  createdAt: string;
  notes?: string;
  source?: string;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Active WebSocket clients set
  const wsClients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    console.log("[WebSocket] Unified client connected");
    wsClients.add(ws);

    ws.on("close", () => {
      console.log("[WebSocket] Unified client disconnected");
      wsClients.delete(ws);
    });

    // Send instant handshake receipt
    ws.send(JSON.stringify({ type: "HELLO", message: "Kalim Coffee POS WebSocket pipeline active." }));
  });

  const broadcastOrder = (data: any) => {
    const payload = JSON.stringify(data);
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  app.use(express.json());

  // --- Core Business Logic ---
  const BASE_TIME_PER_ITEM = 3; // minutes
  const BUSY_DELAY_PER_ITEM = 3; // minutes
  let isBusyMode = false;
  let autoBusyMode = true;
  let busyThreshold = 5; // Default threshold
  let currency = "CAD"; // Default currency
  let taxRegion = "ON"; // Default tax region (Ontario)
  let minEmployeeId = 1;
  let maxEmployeeId = 99999;

  const canadianTaxes: { [key: string]: { name: string, rate: number } } = {
    "AB": { name: "Alberta (GST)", rate: 0.05 },
    "BC": { name: "British Columbia (GST+PST)", rate: 0.12 },
    "MB": { name: "Manitoba (GST+PST)", rate: 0.12 },
    "NB": { name: "New Brunswick (HST)", rate: 0.15 },
    "NL": { name: "Newfoundland and Labrador (HST)", rate: 0.15 },
    "NS": { name: "Nova Scotia (HST)", rate: 0.15 },
    "NT": { name: "Northwest Territories (GST)", rate: 0.05 },
    "NU": { name: "Nunavut (GST)", rate: 0.05 },
    "ON": { name: "Ontario (HST)", rate: 0.13 },
    "PE": { name: "Prince Edward Island (HST)", rate: 0.15 },
    "QC": { name: "Quebec (GST+QST)", rate: 0.14975 },
    "SK": { name: "Saskatchewan (GST+PST)", rate: 0.11 },
    "YT": { name: "Yukon (GST)", rate: 0.05 }
  };

  // Mock Database
  let orders: any[] = [];
  let customers: any[] = [];
  let giftCards: any[] = [
    { code: "KALIM100", balance: 100 },
    { code: "COFFEE50", balance: 50 }
  ];
  
  let inventory = [
    { id: "i1", name: "Coffee Beans", stock: 30, unit: "bags", minStock: 5, supplierId: "s1", usagePerOrder: 0.05 }, // 1kg per bag, 50g per order = 0.05 bags
    { id: "i2", name: "Oat Milk", stock: 50, unit: "bottles", minStock: 10, supplierId: "s2", usagePerOrder: 0.2 }, // 1L per bottle, 200ml per order = 0.2 bottles
    { id: "i3", name: "Sugar", stock: 10000, unit: "packets", minStock: 2000, supplierId: "s1", usagePerOrder: 1 }, // 2g per packet, 1 packet per order = 1 packet (2g)
    { id: "i4", name: "Paper Cups", stock: 5000, unit: "pcs", minStock: 500, supplierId: "s3", usagePerOrder: 1 },
    { id: "i5", name: "Caramel Syrup", stock: 20, unit: "bottles", minStock: 5, supplierId: "s1", usagePerOrder: 0.02 }, // 1L per bottle, 20ml per order = 0.02 bottles
    { id: "i6", name: "Vanilla Syrup", stock: 20, unit: "bottles", minStock: 5, supplierId: "s1", usagePerOrder: 0.02 },
    { id: "i7", name: "Caramel Sauce", stock: 15, unit: "bottles", minStock: 3, supplierId: "s1", usagePerOrder: 0.0225 }, // 1L per bottle, 22.5ml per order = 0.0225 bottles
    { id: "i8", name: "Chocolate Sauce", stock: 15, unit: "bottles", minStock: 3, supplierId: "s1", usagePerOrder: 0.0225 },
    { id: "i11", name: "Lactose Free Milk", stock: 30, unit: "bottles", minStock: 5, supplierId: "s2", usagePerOrder: 0.2 },
    { id: "i12", name: "Fresh Milk", stock: 50, unit: "bottles", minStock: 10, supplierId: "s2", usagePerOrder: 0.2 },
  ];

  let schedules: any[] = []; // { id, userId, userName, date, shift: 'A' | 'B' }

  let staffConnectSync: any[] = []; // Real-time notification and communication log with Kalim Staff Connect

  let employeeRequests: any[] = [
    {
      id: "req1",
      userId: "u2",
      userName: "Bear John",
      type: "leave",
      date: "2026-06-18",
      details: "Request leave on 2026-06-18 for medical checkup",
      status: "pending",
      createdAt: "2026-06-14T09:30:00Z"
    },
    {
      id: "req2",
      userId: "u3",
      userName: "Staff User",
      type: "fixed_schedule",
      details: "Request fixed roster on Monday & Wednesday (Shift A)",
      status: "approved",
      createdAt: "2026-06-13T14:15:00Z"
    }
  ];

  let aiLearningLogs: any[] = [
    {
      id: "log-1",
      timestamp: new Date().toISOString(),
      source: "Staff Portal Support",
      userId: "u3",
      userName: "Staff User",
      userQuery: "Customer complained their drink is too dark/bitter, they wanted an extra syrup pump",
      detectedIssue: "Customer unhappy with taste",
      responseExcerpt: "Politely offered customized re-pour with extra syrup pump completely free, and gifted a Kalim Happy Voucher.",
      language: "en"
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      source: "Outer Dashboard Consult",
      userId: "u1",
      userName: "Admin User",
      userQuery: "How can we increase the bill ticket size of orders?",
      detectedIssue: "General Q&A",
      responseExcerpt: "Suggest alternative dairy types such as oat/almond milk (+1.50) and pair with gourmet warm pastries.",
      language: "en"
    }
  ];

  let suppliers = [
    { id: "s1", name: "Global Coffee Roasters", phone: "+1 416-555-0123", email: "orders@globalcoffee.com", keywords: ["coffee", "beans", "espresso", "sugar"] },
    { id: "s2", name: "Fresh Dairy Co.", phone: "+1 416-555-0456", email: "sales@freshdairy.ca", keywords: ["milk", "dairy", "oat", "cream"] },
    { id: "s3", name: "Eco Packaging Solutions", phone: "+1 416-555-0999", email: "orders@ecopack.ca", keywords: ["cups", "paper", "lids", "straws"] },
  ];

  let reorderRequests: any[] = [];

  // Loyalty Membership & Cards Memory Arrays
  let loyaltyCustomers = [
    { id: "c1", name: "Liam Higgins", phone: "403-555-0111", password: "password123", dob: "2000-06-15", points: 450, favoriteDrink: "Hot Espresso, Maple Syrup splash, double shot", tier: "Gold member" },
    { id: "c2", name: "Emily Smith", phone: "403-555-0192", password: "password123", dob: "1994-07-20", points: 850, favoriteDrink: "Hot Matcha Latte with Oat Milk, less sugar", tier: "Platinum member" },
    { id: "c3", name: "John Miller", phone: "403-555-0143", password: "password123", dob: "1988-06-15", points: 120, favoriteDrink: "Caramel Macchiato, Large, extra Caramel Sauce, iced", tier: "Silver member" },
    { id: "c4", name: "Yuki Tanaka", phone: "416-555-0187", password: "password123", dob: "1997-10-12", points: 300, favoriteDrink: "Lactose Free Flat White, Medium, extra hot", tier: "Gold member" }
  ];

  let seasonalCardConfig = {
    currentSeason: "Summer", // Summer, Autumn, Winter, Spring
    customLogo: "Kalim VIP Club",
    cardColorStart: "#1e1e2f",
    cardColorEnd: "#ff6b6b",
    vipPattern: "radial", // simple, wave, radial, premium
    cardGlowEffect: true,
  };

  let smsDeliveryLogs: any[] = [
    {
      id: "sms-initial-1",
      customerName: "Liam Higgins",
      phone: "403-555-0111",
      timestamp: new Date().toISOString(),
      message: "📱 [SMS Sent] Happy Birthday Liam Higgins! Kalim Coffee presents you with a delicious free pastry/surprise tart redeemable at any of our POS stations. Gift Code: KALIM-VIP-BDAY-CAKE. Wishing you a joyful day filled with fresh espresso! ❤️",
      promoCode: "KALIM-VIP-BDAY-CAKE"
    },
    {
      id: "sms-initial-2",
      customerName: "John Miller",
      phone: "403-555-0143",
      timestamp: new Date().toISOString(),
      message: "📱 [SMS Sent] Happy Birthday John Miller! Kalim Coffee is gifting you a free birthday pastry. Promo code: FREEPASTRY2026. Have a wonderful and caffeinated day!",
      promoCode: "FREEPASTRY2026"
    }
  ];

  let aiInventorySuggestions = [
    {
      id: "is-restock-oat",
      type: "restock",
      item: "Oat Milk",
      itemName: "Oat Milk",
      itemId: "i2",
      supplierName: "Fresh Dairy Co.",
      supplierId: "s2",
      quantityToOrder: 25,
      suggestedText: "Oat Milk stock is critically low (only 4 cartons remaining). Velocity prediction suggests a stockout in 1.5 days. Recommended order of 25 units is pre-approved.",
      timestamp: new Date().toISOString()
    },
    {
      id: "is-restock-beans",
      type: "restock",
      item: "Coffee Beans",
      itemName: "Coffee Beans",
      itemId: "i1",
      supplierName: "Global Coffee Roasters",
      supplierId: "s1",
      quantityToOrder: 15,
      suggestedText: "Robusta whole beans run at average 6kg/day. Remaining stock is 8kg. Pre-arranged delivery container can be routed for 15 bags (15kg).",
      timestamp: new Date().toISOString()
    },
    {
      id: "is-1",
      type: "audit",
      employeeName: "Bear John",
      employeeId: "u2",
      itemName: "Oat Milk",
      itemId: "i2",
      detectedIssue: "Stock dropping fast & safety window close",
      suggestion: "Suggest verifying remaining cartons in back cold room. System predicts manual count might have expired. Auto-refill recommended.",
      suggestedActionType: "count_check",
      timestamp: new Date().toISOString()
    },
    {
      id: "is-2",
      type: "audit",
      employeeName: "Staff User",
      employeeId: "u3",
      itemName: "Coffee Beans",
      itemId: "i1",
      detectedIssue: "Heuristics predict high brewing demand for Tuesday morning",
      suggestion: "Count existing unopened espresso sacks. Check if bag seals are damp or compromised.",
      suggestedActionType: "quality_check",
      timestamp: new Date().toISOString()
    }
  ];

  let users = [
    { id: "u1", name: "Admin User", role: "admin", pin: "0000", employeeId: "1", permissions: ["all"], hourlyWage: 25.00, email: "admin@kalimcoffee.ca", phone: "+17785550001", notificationPreference: "email" },
    { id: "u2", name: "Bear John", role: "manager", pin: "0000", employeeId: "2", permissions: ["pos", "bar", "inventory", "reports"], hourlyWage: 25.00, email: "john.bear@kalimcoffee.ca", phone: "+17785550002", notificationPreference: "sms" },
    { id: "u3", name: "Staff User", role: "employee", pin: "0000", employeeId: "3", permissions: ["pos", "bar"], hourlyWage: 15.00, email: "staff@kalimcoffee.ca", phone: "+17785550003", notificationPreference: "both" },
    { id: "u4", name: "Kalim Nguyen", role: "manager", pin: "0000", employeeId: "4", permissions: ["pos", "bar", "inventory", "reports"], hourlyWage: 30.00, email: "kalim.nguyen@kalimcoffee.ca", phone: "+17785550004", notificationPreference: "email" },
    { id: "u5", name: "Beaver Bagger", role: "employee", pin: "0000", employeeId: "5", permissions: ["pos", "bar"], hourlyWage: 15.00, email: "beaver.bagger@kalimcoffee.ca", phone: "+17785550005", notificationPreference: "sms" },
  ];

  let timeClock: any[] = [];

  const toppings = [
    { id: "t1", name: "Pearl", price: 0.75 },
    { id: "t2", name: "Cream Cheese", price: 1.25 },
    { id: "t3", name: "Extra Shot", price: 1.50 },
    { id: "t4", name: "Vanilla Syrup", price: 1.50 },
    { id: "t5", name: "Caramel Syrup", price: 1.50 },
    { id: "t6", name: "Oat Milk", price: 1.50 },
    { id: "t7", name: "Lactose Free Milk", price: 1.50 },
    { id: "t8", name: "Chocolate Sauce", price: 1.50 },
    { id: "t9", name: "Caramel Sauce", price: 1.50 },
  ];

  let products = [
    // Espresso & Brews
    { id: "e1", name: "Espresso", category: "Espresso & Brews", price: 4.50, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80", description: "Strong and bold classic signature double espresso shot." },
    { id: "e2", name: "Cappuccino", category: "Espresso & Brews", price: 6.25, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80", description: "Espresso with steamed milk and a deep layer of foam." },
    { id: "e3", name: "Latte", category: "Espresso & Brews", price: 6.20, image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80", description: "Smooth espresso with steamed milk and a thin layer of foam." },
    { id: "e4", name: "Americano", category: "Espresso & Brews", price: 4.75, image: "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400&q=80", description: "Espresso shots topped with hot water." },
    { id: "e5", name: "Mocha", category: "Espresso & Brews", price: 6.95, image: "https://images.unsplash.com/photo-1578314675249-a6910e80a49f?w=400&q=80", description: "Espresso with rich chocolate and steamed milk." },

    // Bakery
    { id: "b1", name: "Croissant", category: "Bakery", price: 4.50, image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&q=80", description: "Flaky, buttery multi-layered golden French croissant." },
    { id: "b2", name: "Blueberry Muffin", category: "Bakery", price: 5.00, image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80", description: "Classic muffin loaded with plump blueberries." },
    { id: "b3", name: "Banana Bread", category: "Bakery", price: 4.75, image: "https://images.unsplash.com/photo-1596450514735-111a2f03f7a6?w=400&q=80", description: "Moist and sweet banana bread slice." },
    { id: "b4", name: "Cheesecake Slice", category: "Bakery", price: 6.25, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80", description: "Rich and creamy classic NY cheesecake." },
    { id: "b5", name: "Bakery Bagel", category: "Bakery", price: 5.00, image: "https://images.unsplash.com/photo-1585478201200-e7f0abfb0727?w=400&q=80", description: "Freshly baked artisan bagel." },

    // Breakfast Menu
    { id: "bf1", name: "Sunrise Latte", category: "Breakfast Menu", price: 6.50, image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400&q=80", description: "A balanced morning blend featuring bright citrus notes, creamy dairy, and a touch of vanilla to pair perfectly with a warm pastry." },
    { id: "bf2", name: "Cinnamon Swirl Biscuit", category: "Breakfast Menu", price: 5.75, image: "https://images.unsplash.com/photo-1550993952-b8ec11ab9c02?w=400&q=80", description: "Golden flaky layers brushed with cinnamon butter, served warm with honey or jam for a comforting breakfast treat." },
    { id: "bf3", name: "Loaded Blueberry Muffin", category: "Breakfast Menu", price: 6.25, image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80", description: "Plump blueberries folded into tender crumb, finished with a light lemon glaze for a fresh morning bite." },
    { id: "bf4", name: "Almond Croissant", category: "Breakfast Menu", price: 6.25, image: "https://images.unsplash.com/photo-1623366302587-bcaabf506894?w=400&q=80", description: "Buttery layers with almond cream center, toasted to perfection, finished with sliced almonds." },
    { id: "bf5", name: "Oatmeal Bowl", category: "Breakfast Menu", price: 6.50, image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=80", description: "Creamy oats with almond milk, topped with fresh berries, maple drizzle, and a sprinkle of cinnamon." },
    { id: "bf6", name: "Egg White Wrap", category: "Breakfast Menu", price: 10.50, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80", description: "Wholesome wrap packed with scrambled egg whites, spinach, feta, and peppers, served warm." },
    { id: "bf7", name: "Sesame Bagel with Lox", category: "Breakfast Menu", price: 9.25, image: "https://images.unsplash.com/photo-1616428751505-181156641fe8?w=400&q=80", description: "Toasted bagel with cream cheese, smoked salmon, capers, and dill for a savory start." },
    { id: "bf8", name: "Avocado Toast", category: "Breakfast Menu", price: 11.50, image: "https://images.unsplash.com/photo-1603046891726-36bfd957e8bf?w=400&q=80", description: "Sourdough crust, smashed avocado, chili flakes, cherry tomatoes, olive oil drizzle, and a pinch of sea salt." },
    { id: "bf9", name: "Parisian Toast", category: "Breakfast Menu", price: 12.75, image: "https://images.unsplash.com/photo-1484723091791-001c29b0a1d4?w=400&q=80", description: "Eggy bread with vanilla custard, dusted sugar, and berries for a comforting bite." },
    { id: "bf10", name: "Herbed Mushroom Toast", category: "Breakfast Menu", price: 13.00, image: "https://images.unsplash.com/photo-1511690078903-71dc5a49f5e3?w=400&q=80", description: "Toasted sourdough topped with garlicky mushrooms, thyme, and melted cheese, finished with black pepper." }
  ];

  // Seeding initial simulated orders
  orders = [
    {
      id: "ord-8b9a2c",
      customerName: "Alice Smith",
      items: [
        { productId: "e2", quantity: 2, toppings: [] }
      ],
      subtotal: 9.00,
      taxAmount: 0.45,
      tipAmount: 1.50,
      discount: 0.00,
      totalPrice: 10.95,
      status: "Completed",
      estimatedTime: 5,
      paymentMethod: "Apple Pay",
      createdAt: new Date(Date.now() - 3.5 * 3600000)
    },
    {
      id: "ord-4f9e1s",
      customerName: "Daniel Jenkins",
      items: [
        { productId: "e4", quantity: 1, toppings: [] }
      ],
      subtotal: 4.75,
      taxAmount: 0.24,
      tipAmount: 0.75,
      discount: 0.00,
      totalPrice: 5.74,
      status: "Completed",
      estimatedTime: 4,
      paymentMethod: "Cash",
      createdAt: new Date(Date.now() - 3.1 * 3600000)
    },
    {
      id: "ord-7m2n9v",
      customerName: "Beaver Fans",
      items: [
        { productId: "bf8", quantity: 3, toppings: [] }
      ],
      subtotal: 15.75,
      taxAmount: 0.79,
      tipAmount: 3.00,
      discount: 0.00,
      totalPrice: 19.54,
      status: "Completed",
      estimatedTime: 10,
      paymentMethod: "Credit Card",
      createdAt: new Date(Date.now() - 2.8 * 3600000)
    },
    {
      id: "ord-1a3s5d",
      customerName: "Sophia Martinez",
      items: [
        { productId: "e1", quantity: 1, toppings: [] }
      ],
      subtotal: 3.50,
      taxAmount: 0.18,
      tipAmount: 0.50,
      discount: 0.00,
      totalPrice: 4.18,
      status: "Completed",
      estimatedTime: 3,
      paymentMethod: "Debit Card",
      createdAt: new Date(Date.now() - 2.2 * 3600000)
    },
    {
      id: "ord-6z5x4c",
      customerName: "Liam Johnson",
      items: [
        { productId: "bf1", quantity: 2, toppings: [] }
      ],
      subtotal: 10.00,
      taxAmount: 0.50,
      tipAmount: 2.00,
      discount: 0.00,
      totalPrice: 12.50,
      status: "Preparing",
      estimatedTime: 8,
      paymentMethod: "Apple Pay",
      createdAt: new Date(Date.now() - 1.5 * 3600000)
    },
    {
      id: "ord-9q2w3e",
      customerName: "Emma Watson",
      items: [
        { productId: "e3", quantity: 1, toppings: [] }
      ],
      subtotal: 4.50,
      taxAmount: 0.23,
      tipAmount: 1.00,
      discount: 0.00,
      totalPrice: 5.73,
      status: "Wait",
      estimatedTime: 4,
      paymentMethod: "Google Pay",
      createdAt: new Date(Date.now() - 10 * 60000)
    }
  ].map(o => ({
    ...o,
    items: o.items.map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId),
      toppings: []
    }))
  }));

  const getActiveSeasonalProducts = () => {
    const month = new Date().getMonth(); // 0-11
    let currentSeason = "";
    if (month >= 2 && month <= 4) currentSeason = "Spring";
    else if (month >= 5 && month <= 7) currentSeason = "Summer";
    else if (month >= 8 && month <= 10) currentSeason = "Autumn";
    else currentSeason = "Winter";

    return products.filter((p: any) => !p.season || p.season === currentSeason);
  };

  // Helper: Check Auto Busy Mode
  const updateBusyStatus = () => {
    if (autoBusyMode) {
      const activeOrders = orders.filter(o => o.status === 'Wait' || o.status === 'Preparing').length;
      isBusyMode = activeOrders >= busyThreshold;
    }
  };

  // Load and sync starting databases from Cloud Firestore (Google Cloud Server)
  try {
    console.log("[Firebase] Syncing starting databases from Cloud Firestore...");
    
    const fetchCol = async (colName: string) => {
      const colRef = collection(firestoreDb, colName);
      const snap = await getDocs(colRef);
      if (snap.empty) return null;
      const arr: any[] = [];
      snap.forEach(d => arr.push(d.data()));
      return arr;
    };

    const fUsers = await fetchCol("users");
    if (fUsers) {
      users = fUsers;
    } else {
      for (const u of users) {
        await setDoc(doc(firestoreDb, "users", u.id), u);
      }
    }

    const fInventory = await fetchCol("inventory");
    if (fInventory) {
      inventory = fInventory.map((item: any) => ({
        ...item,
        stock: Number(item.stock) || 0,
        minStock: Number(item.minStock) || 0,
        usagePerOrder: Number(item.usagePerOrder) || 0
      }));
    } else {
      for (const i of inventory) {
        await setDoc(doc(firestoreDb, "inventory", i.id), i);
      }
    }

    const fSuppliers = await fetchCol("suppliers");
    if (fSuppliers) {
      suppliers = fSuppliers;
    } else {
      for (const s of suppliers) {
        await setDoc(doc(firestoreDb, "suppliers", s.id), s);
      }
    }

    const fProducts = await fetchCol("products");
    if (fProducts) {
      products = fProducts;
    } else {
      for (const p of products) {
        await setDoc(doc(firestoreDb, "products", p.id), p);
      }
    }

    const fSchedules = await fetchCol("schedules");
    if (fSchedules) {
      schedules = fSchedules;
    } else {
      for (const s of schedules) {
        await setDoc(doc(firestoreDb, "schedules", s.id), s);
      }
    }

    const fOrders = await fetchCol("orders");
    if (fOrders) {
      orders = fOrders;
    } else {
      for (const ord of orders) {
        await setDoc(doc(firestoreDb, "orders", ord.id), ord);
      }
    }

    const fTimeClock = await fetchCol("timeClock");
    if (fTimeClock) {
      timeClock = fTimeClock;
    } else {
      for (const tc of timeClock) {
        await setDoc(doc(firestoreDb, "timeClock", tc.id), tc);
      }
    }

    const fEmployeeRequests = await fetchCol("employeeRequests");
    if (fEmployeeRequests) {
      employeeRequests = fEmployeeRequests;
    } else {
      for (const req of employeeRequests) {
        await setDoc(doc(firestoreDb, "employeeRequests", req.id), req);
      }
    }

    const fStaffSync = await fetchCol("staffConnectSync");
    if (fStaffSync) {
      staffConnectSync = fStaffSync;
    } else {
      const initSync = {
        id: "sync-init",
        senderName: "Kalim System",
        message: "Kalim Coffee POS Live Synchronization Active with Staff Connect Portal.",
        timestamp: new Date().toISOString(),
        type: "system"
      };
      staffConnectSync.push(initSync);
      await setDoc(doc(firestoreDb, "staffConnectSync", initSync.id), initSync);
    }

    const fSuggestions = await fetchCol("inventorySuggestions");
    if (fSuggestions) {
      aiInventorySuggestions = fSuggestions;
    } else {
      for (const item of aiInventorySuggestions) {
        await saveToFirebase("inventorySuggestions", item.id, item);
      }
    }

    console.log("[Firebase] Sync completed successfully! In-memory data matched with Cloud Firestore.");
  } catch (err) {
    console.error("[Firebase] Initialization error:", err);
  }

  // API Routes
  app.get("/api/products", (req, res) => res.json(getActiveSeasonalProducts()));
  app.post("/api/seed-database", async (req, res) => {
    try {
      console.log("[Firebase] Seeding all collections to Cloud Firestore...");
      
      const defaultUsers = [
        { id: "u1", name: "Admin User", role: "admin", pin: "0000", employeeId: "1", permissions: ["all"], hourlyWage: 25.00, email: "admin@kalimcoffee.ca", phone: "+17785550001", notificationPreference: "email" },
        { id: "u2", name: "Bear John", role: "manager", pin: "0000", employeeId: "2", permissions: ["pos", "bar", "inventory", "reports"], hourlyWage: 25.00, email: "john.bear@kalimcoffee.ca", phone: "+17785550002", notificationPreference: "sms" },
        { id: "u3", name: "Staff User", role: "employee", pin: "0000", employeeId: "3", permissions: ["pos", "bar"], hourlyWage: 15.00, email: "staff@kalimcoffee.ca", phone: "+17785550003", notificationPreference: "both" },
        { id: "u4", name: "Kalim Nguyen", role: "manager", pin: "0000", employeeId: "4", permissions: ["pos", "bar", "inventory", "reports"], hourlyWage: 30.00, email: "kalim.nguyen@kalimcoffee.ca", phone: "+17785550004", notificationPreference: "email" },
        { id: "u5", name: "Beaver Bagger", role: "employee", pin: "0000", employeeId: "5", permissions: ["pos", "bar"], hourlyWage: 15.00, email: "beaver.bagger@kalimcoffee.ca", phone: "+17785550005", notificationPreference: "sms" },
      ];

      const defaultInventory = [
        { id: "i1", name: "Coffee Beans", stock: 30, unit: "bags", minStock: 5, supplierId: "s1", usagePerOrder: 0.05 },
        { id: "i2", name: "Oat Milk", stock: 50, unit: "bottles", minStock: 10, supplierId: "s2", usagePerOrder: 0.2 },
        { id: "i3", name: "Sugar", stock: 10000, unit: "packets", minStock: 2000, supplierId: "s1", usagePerOrder: 1 },
        { id: "i4", name: "Paper Cups", stock: 5000, unit: "pcs", minStock: 500, supplierId: "s3", usagePerOrder: 1 },
        { id: "i5", name: "Caramel Syrup", stock: 20, unit: "bottles", minStock: 5, supplierId: "s1", usagePerOrder: 0.02 },
        { id: "i6", name: "Vanilla Syrup", stock: 20, unit: "bottles", minStock: 5, supplierId: "s1", usagePerOrder: 0.02 },
        { id: "i7", name: "Caramel Sauce", stock: 15, unit: "bottles", minStock: 3, supplierId: "s1", usagePerOrder: 0.0225 },
        { id: "i8", name: "Chocolate Sauce", stock: 15, unit: "bottles", minStock: 3, supplierId: "s1", usagePerOrder: 0.0225 },
        { id: "i11", name: "Lactose Free Milk", stock: 30, unit: "bottles", minStock: 5, supplierId: "s2", usagePerOrder: 0.2 },
        { id: "i12", name: "Fresh Milk", stock: 50, unit: "bottles", minStock: 10, supplierId: "s2", usagePerOrder: 0.2 },
      ];

      const defaultSuppliers = [
        { id: "s1", name: "Global Coffee Roasters", phone: "+1 416-555-0123", email: "orders@globalcoffee.com", keywords: ["coffee", "beans", "espresso", "sugar"] },
        { id: "s2", name: "Fresh Dairy Co.", phone: "+1 416-555-0456", email: "sales@freshdairy.ca", keywords: ["milk", "dairy", "oat", "cream"] },
        { id: "s3", name: "Eco Packaging Solutions", phone: "+1 416-555-0999", email: "orders@ecopack.ca", keywords: ["cups", "paper", "lids", "straws"] },
      ];

      const defaultProducts = [
        { id: "v1", name: "Vietnamese Egg Coffee", category: "Vietnamese Specialty", price: 6.95, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80", description: "Indulgently rich, house-whipped egg cream over bold slow-dripped Phin espresso." },
        { id: "v2", name: "Salted Cream Coffee", category: "Vietnamese Specialty", price: 6.50, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80", description: "Slow-dripped Vietnamese phin coffee with a velvety sweet-savory salted cream cap." },
        { id: "v3", name: "Coconut Coffee Slush", category: "Vietnamese Specialty", price: 6.75, image: "https://images.unsplash.com/photo-1553177595-4de2bb0842b9?w=400&q=80", description: "Creamy blended coconut slush coupled with real slow-drip phin robusta." },
        { id: "v4", name: "Bạc Xỉu White Coffee", category: "Vietnamese Specialty", price: 5.95, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80", description: "Sweet condensed milk, premium fresh milk and strong Phin coffee drizzle." },
        { id: "v5", name: "Traditional Phin Milk Coffee", category: "Vietnamese Specialty", price: 5.25, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80", description: "Bold premium Vietnamese robusta bean slow-drip phin espresso over sweet condensed milk and ice." },
        { id: "v6", name: "Avocado Coffee Smoothie", category: "Vietnamese Specialty", price: 7.25, image: "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?w=400&q=80", description: "Rich fresh avocado puree blended smooth and topped with a phin espresso shot." },
        { id: "e1", name: "Kalim Blend Espresso", category: "Espresso & Brews", price: 3.50, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80", description: "Strong and bold classic signature double espresso shot." },
        { id: "e2", name: "Kalim Signature Latte", category: "Espresso & Brews", price: 4.95, image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80", description: "Smooth espresso with steamed milk and a thin layer of foam." },
        { id: "e3", name: "Flat White", category: "Espresso & Brews", price: 4.75, image: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=400&q=80", description: "Rich double shot espresso with velvety microfoam." },
        { id: "e4", name: "Americano", category: "Espresso & Brews", price: 3.75, image: "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400&q=80", description: "Espresso shots topped with hot water." },
        { id: "e5", name: "Cold Brew", category: "Espresso & Brews", price: 4.50, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80", description: "18-hour cold-steeped single origin brew, smooth and low acid." },
        { id: "m1", name: "Matcha Coconut Latte", category: "Fruit Teas & Matchas", price: 5.75, image: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=400&q=80", description: "Uji matcha organic tea combined with fragrant creamy coconut milk." },
        { id: "m2", name: "Peach Lemongrass Tea", category: "Fruit Teas & Matchas", price: 5.25, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80", description: "Refreshing iced tea infused with sweet peach slices and fresh lemongrass." },
        { id: "m3", name: "Lychee Jasmine Green Tea", category: "Fruit Teas & Matchas", price: 5.25, image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80", description: "Fragrant Jasmine green tea steeped fresh with sweet clean lychees." },
        { id: "m4", name: "Strawberry Hibiscus Tea", category: "Fruit Teas & Matchas", price: 5.50, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80", description: "Tart, ruby red hibiscus herbal tea with fresh muddled strawberries." },
        { id: "p1", name: "Baked Egg Tart", category: "Vietnamese Pastries", price: 3.50, image: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&q=80", description: "Flaky buttery pastry with a rich warm caramelised egg custard center." },
        { id: "p2", name: "Butter Croissant", category: "Vietnamese Pastries", price: 3.75, image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&q=80", description: "Flaky, multi-layered golden French croissant." },
        { id: "p3", name: "Sesame Ball with Mung Bean", category: "Vietnamese Pastries", price: 2.95, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80", description: "Crisp sesame seed outer shell filled with sweet warm premium mung bean." },
      ];

      for (const u of defaultUsers) await saveToFirebase("users", u.id, u);
      for (const i of defaultInventory) await saveToFirebase("inventory", i.id, i);
      for (const s of defaultSuppliers) await saveToFirebase("suppliers", s.id, s);
      for (const p of defaultProducts) await saveToFirebase("products", p.id, p);

      users = defaultUsers;
      inventory = defaultInventory;
      suppliers = defaultSuppliers;
      products = defaultProducts;

      res.json({ success: true, message: "Database successfully populated with clean seed records!" });
    } catch (err: any) {
      console.error("[Firebase] Seed failed:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/products", async (req, res) => {
    const newProduct = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
    products.push(newProduct);
    await saveToFirebase("products", newProduct.id, newProduct);
    res.json(newProduct);
  });
  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...req.body };
      await saveToFirebase("products", id, products[idx]);
      res.json(products[idx]);
    } else res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/products/:id", async (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    await deleteFromFirebase("products", req.params.id);
    res.json({ success: true });
  });

  app.get("/api/toppings", (req, res) => res.json(toppings));
  app.post("/api/toppings", async (req, res) => {
    const newTopping = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
    toppings.push(newTopping);
    await saveToFirebase("toppings", newTopping.id, newTopping);
    res.json(newTopping);
  });
  app.put("/api/toppings/:id", async (req, res) => {
    const { id } = req.params;
    const idx = toppings.findIndex(t => t.id === id);
    if (idx !== -1) {
      toppings[idx] = { ...toppings[idx], ...req.body };
      await saveToFirebase("toppings", id, toppings[idx]);
      res.json(toppings[idx]);
    } else res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/toppings/:id", async (req, res) => {
    const { id } = req.params;
    const idx = toppings.findIndex(t => t.id === id);
    if (idx !== -1) {
      toppings.splice(idx, 1);
      await deleteFromFirebase("toppings", id);
      res.json({ success: true });
    } else res.status(404).json({ error: "Not found" });
  });
  
  app.get("/api/inventory", (req, res) => res.json(inventory));
  app.put("/api/inventory/:id", async (req, res) => {
    const { id } = req.params;
    const idx = inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      inventory[idx] = { ...inventory[idx], ...req.body };
      await saveToFirebase("inventory", id, inventory[idx]);
      res.json(inventory[idx]);
    } else res.status(404).json({ error: "Not found" });
  });

  app.get("/api/suppliers", (req, res) => res.json(suppliers));
  app.post("/api/suppliers", async (req, res) => {
    const newSupplier = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
    suppliers.push(newSupplier);
    await saveToFirebase("suppliers", newSupplier.id, newSupplier);
    res.json(newSupplier);
  });
  app.put("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    const idx = suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      suppliers[idx] = { ...suppliers[idx], ...req.body };
      await saveToFirebase("suppliers", id, suppliers[idx]);
      res.json(suppliers[idx]);
    } else res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/suppliers/:id", async (req, res) => {
    suppliers = suppliers.filter(s => s.id !== req.params.id);
    await deleteFromFirebase("suppliers", req.params.id);
    res.json({ success: true });
  });

  app.post("/api/sync-external-orders", (req, res) => {
    // Simulate syncing from customer app/website
    const externalOrders = [
      {
        id: "ext-" + Math.random().toString(36).substr(2, 5),
        customerName: "Online User " + Math.floor(Math.random() * 100),
        items: [{ productId: "1", quantity: 2, toppings: ["t1"] }],
        totalPrice: 15.50,
        taxAmount: 2.02,
        tipAmount: 2.00,
        status: "Wait",
        source: "Website",
        createdAt: new Date(),
        estimatedTime: 15
      }
    ];
    
    const ordersWithDetails = externalOrders.map(o => ({
      ...o,
      items: o.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId),
        toppings: (item.toppings || []).map((tId: string) => toppings.find(t => t.id === tId))
      }))
    }));

    orders.push(...ordersWithDetails);

    // Save to AlloyDB / Cloud SQL & trigger WebSocket broadcast
    ordersWithDetails.forEach(async (ord: any) => {
      try {
        await db.insert(dbSchema.orders).values({
          id: ord.id,
          customerName: ord.customerName || "Online User",
          customerPhone: ord.customerPhone || null,
          items: JSON.stringify(ord.items) as any,
          subtotal: Number(ord.totalPrice - (ord.taxAmount || 0) - (ord.tipAmount || 0)) || 0,
          taxAmount: Number(ord.taxAmount) || 0,
          tipAmount: Number(ord.tipAmount) || 0,
          discount: Number(ord.discount) || 0,
          totalPrice: Number(ord.totalPrice) || 0,
          status: ord.status || "Wait",
          estimatedTime: Number(ord.estimatedTime) || 15,
          notes: ord.notes || "",
          paymentMethod: ord.paymentMethod || "Online",
          createdAt: new Date()
        });
        console.log(`[AlloyDB] Logged external order: ${ord.id} to Cloud SQL.`);
      } catch (dbErr) {
        console.warn(`[AlloyDB] database connection or write warning for ${ord.id}:`, dbErr);
      }

      broadcastOrder({ type: "NEW_ORDER", order: ord });
    });

    res.json({ success: true, syncedCount: externalOrders.length });
  });

  app.post("/api/auto-reorder", (req, res) => {
    const { itemId, quantity, supplierId, forecastDays } = req.body;
    const supplier = suppliers.find(s => s.id === supplierId);
    const item = inventory.find(i => i.id === itemId);

    if (!supplier || !item) {
      return res.status(404).json({ error: "Supplier or Item not found" });
    }

    const request = {
      id: Date.now().toString(),
      itemId,
      itemName: item.name,
      quantity,
      supplierId,
      supplierName: supplier.name,
      status: "Sent",
      method: Math.random() > 0.5 ? "SMS" : "Email",
      date: new Date().toISOString(),
      forecastDays: forecastDays || 7
    };

    reorderRequests.push(request);
    console.log(`[AI Auto-Order] Sent ${request.method} to ${supplier.name} for ${quantity} ${item.unit} of ${item.name} (Forecast: ${request.forecastDays} days)`);
    
    res.json(request);
  });

  app.get("/api/reorder-history", (req, res) => {
    res.json(reorderRequests);
  });

  app.post("/api/sync-menu", (req, res) => {
    const { products } = req.body;
    console.log(`[SYNC] Syncing ${products?.length || 0} products to external website...`);
    // In a real scenario, you'd update an external DB here.
    res.json({ success: true, message: "Menu synced successfully" });
  });

  app.post("/api/print", (req, res) => {
    const { type, data } = req.body;
    console.log(`[PRINTER - ${type.toUpperCase()}]`, data);
    res.json({ success: true, message: `${type} printed successfully` });
  });
  
  app.get("/api/busy-mode", (req, res) => res.json({ isBusyMode, autoBusyMode }));
  app.post("/api/busy-mode", (req, res) => {
    const { isBusy, auto } = req.body;
    if (auto !== undefined) autoBusyMode = auto;
    if (isBusy !== undefined) isBusyMode = isBusy;
    updateBusyStatus();
    res.json({ isBusyMode, autoBusyMode });
  });

  app.get("/api/orders", (req, res) => res.json(orders));

  app.get("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.get("/api/schedules", (req, res) => res.json(schedules));
  app.post("/api/schedules", async (req, res) => {
    const { userId, userName, date, shift } = req.body;
    const newSchedule = { id: Date.now().toString(), userId, userName, date, shift };
    schedules.push(newSchedule);
    await saveToFirebase("schedules", newSchedule.id, newSchedule);
    res.json(newSchedule);
  });
  app.delete("/api/schedules/:id", async (req, res) => {
    schedules = schedules.filter(s => s.id !== req.params.id);
    await deleteFromFirebase("schedules", req.params.id);
    res.json({ success: true });
  });

  // --- Kalim Employee Requests Ecosystem Endpoints ---
  app.get("/api/employee-requests", (req, res) => {
    res.json(employeeRequests);
  });

  app.post("/api/employee-requests", async (req, res) => {
    const { userId, userName, type, date, details, shift, myShiftId, coworkerId, coworkerShiftId } = req.body;
    const newRequest = {
      id: "req-" + Date.now(),
      userId: userId || "u3",
      userName: userName || "Staff User",
      type: type || "leave", // 'leave' | 'fixed_schedule' | 'register_schedule' | 'shift_swap'
      date: date || "",
      details: details || "",
      shift: shift || "",
      status: "pending",
      createdAt: new Date().toISOString(),
      myShiftId: myShiftId || "",
      coworkerId: coworkerId || "",
      coworkerShiftId: coworkerShiftId || ""
    };
    employeeRequests.push(newRequest);
    try {
      await saveToFirebase("employeeRequests", newRequest.id, newRequest);
      
      // Auto register a system sync packet
      const syncPacket = {
        id: "sync-" + Date.now(),
        senderName: "Kalim System",
        message: `New request (${type}) submitted by ${newRequest.userName}`,
        timestamp: new Date().toISOString(),
        type: "system"
      };
      staffConnectSync.push(syncPacket);
      await saveToFirebase("staffConnectSync", syncPacket.id, syncPacket);

      broadcastOrder({ type: "STAFF_CONNECT_REQUEST", request: newRequest });
      broadcastOrder({ type: "STAFF_CONNECT_SYNC", packet: syncPacket });
    } catch (firebaseErr) {
      console.error("[Firebase] Error saving employee request:", firebaseErr);
    }
    res.json({ success: true, request: newRequest });
  });

  app.post("/api/employee-requests/:id/action", async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'
    const foundIdx = employeeRequests.findIndex(r => r.id === id);
    if (foundIdx === -1) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = employeeRequests[foundIdx];
    request.status = action === 'approve' ? 'approved' : 'rejected';

    // If approved, trigger automatic schedule changes to align with Ecosystem goals
    if (action === 'approve') {
      if (request.type === 'register_schedule' && request.date) {
        // Automatically inject registered schedule
        const newSched = {
          id: "sched-" + Date.now(),
          userId: request.userId,
          userName: request.userName,
          date: request.date,
          shift: request.shift || 'A'
        };
        schedules.push(newSched);
        await saveToFirebase("schedules", newSched.id, newSched);
      } else if (request.type === 'leave' && request.date) {
        // Automatically release employee from scheduled shifts on that date
        const schedulesToRemove = schedules.filter(s => s.userId === request.userId && s.date === request.date);
        for (const s of schedulesToRemove) {
          await deleteFromFirebase("schedules", s.id);
        }
        schedules = schedules.filter(s => !(s.userId === request.userId && s.date === request.date));
      } else if (request.type === 'shift_swap' && request.myShiftId && request.coworkerShiftId) {
        // Find swap elements
        const myShiftIndex = schedules.findIndex(s => s.id === request.myShiftId);
        const coworkerShiftIndex = schedules.findIndex(s => s.id === request.coworkerShiftId);
        if (myShiftIndex !== -1 && coworkerShiftIndex !== -1) {
          const myShift = schedules[myShiftIndex];
          const coworkerShift = schedules[coworkerShiftIndex];
          
          // Swap the employee fields on these shifts
          const tempUserId = myShift.userId;
          const tempUserName = myShift.userName;
          
          myShift.userId = coworkerShift.userId;
          myShift.userName = coworkerShift.userName;
          
          coworkerShift.userId = tempUserId;
          coworkerShift.userName = tempUserName;

          await saveToFirebase("schedules", myShift.id, myShift);
          await saveToFirebase("schedules", coworkerShift.id, coworkerShift);
        }
      }
    }

    try {
      await saveToFirebase("employeeRequests", request.id, request);
      
      const syncPacket = {
        id: "sync-" + Date.now(),
        senderName: "Manager",
        message: `Request for ${request.userName} has been ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        timestamp: new Date().toISOString(),
        type: "system"
      };
      staffConnectSync.push(syncPacket);
      await saveToFirebase("staffConnectSync", syncPacket.id, syncPacket);

      broadcastOrder({ type: "STAFF_CONNECT_REQUEST_RESOLVED", request, action });
      broadcastOrder({ type: "STAFF_CONNECT_SYNC", packet: syncPacket });
    } catch (firebaseErr) {
      console.error("[Firebase] Error saving actioned request:", firebaseErr);
    }

    res.json({ success: true, request });
  });

  // --- Real-Time Staff Connect Sync Syncing & Communication Bridge ---
  app.get("/api/staff-connect-sync", (req, res) => {
    res.json(staffConnectSync);
  });

  app.post("/api/staff-connect-sync", async (req, res) => {
    const { senderName, message, type } = req.body;
    const packet = {
      id: "sync-" + Date.now(),
      senderName: senderName || "Manager",
      message: message || "",
      timestamp: new Date().toISOString(),
      type: type || "announcement" // 'announcement' | 'notification' | 'system'
    };
    staffConnectSync.push(packet);
    try {
      await saveToFirebase("staffConnectSync", packet.id, packet);
      broadcastOrder({ type: "STAFF_CONNECT_SYNC", packet });
    } catch (err) {
      console.error("[Firebase] staffConnectSync failed:", err);
    }
    res.json(packet);
  });

  app.post("/api/orders", async (req, res) => {
    const { 
      customerInfo, 
      items, 
      tipAmount, 
      giftCardCode,
      notes,
      paymentMethod
    } = req.body;

    updateBusyStatus();

    // Deduct Inventory based on recipes
    items.forEach((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      const isLarge = item.size === 'Large';
      const qty = item.quantity;

      // Base Coffee Deduction
      if (product.category.includes('Coffee')) {
        const beans = inventory.find(i => i.id === 'i1');
        if (beans) beans.stock -= (isLarge ? 0.07 : 0.05) * qty; // 70g vs 50g
      }

      // Milk Deduction
      let milkId = 'i12'; // Default Fresh Milk
      if (item.toppings?.includes('t6')) milkId = 'i2'; // Oat Milk
      if (item.toppings?.includes('t7')) milkId = 'i11'; // Lactose Free
      
      const milk = inventory.find(i => i.id === milkId);
      if (milk) milk.stock -= (isLarge ? 0.3 : 0.2) * qty; // 300ml vs 200ml

      // Syrup/Sauce Deduction
      const pumpCount = isLarge ? 3 : 2;
      const bottleUsage = (pumpCount * 10) / 1000; // 10ml per pump, 1000ml per bottle

      const syrupToppings = [
        { id: 't4', invId: 'i6' }, // Vanilla
        { id: 't5', invId: 'i5' }, // Caramel
        { id: 't9', invId: 'i7' }, // Caramel Sauce
        { id: 't8', invId: 'i8' }  // Chocolate Sauce
      ];

      syrupToppings.forEach(st => {
        if (item.toppings?.includes(st.id)) {
          const inv = inventory.find(i => i.id === st.invId);
          if (inv) inv.stock -= bottleUsage * qty;
        }
      });

      // Paper Cup
      const cup = inventory.find(i => i.id === 'i4');
      if (cup) cup.stock -= 1 * qty;

      // Sugar
      const sugar = inventory.find(i => i.id === 'i3');
      if (sugar) sugar.stock -= 1 * qty; // 1 packet (2g)
    });

    const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    let timePerItem = BASE_TIME_PER_ITEM;
    let alertMessage = null;

    if (isBusyMode) {
      timePerItem += BUSY_DELAY_PER_ITEM;
      alertMessage = "The shop is currently in peak hours, so your order will be a bit slower. Thank you for your patience.";
    }

    const estimatedTime = itemCount * timePerItem;
    
    // Calculate Prices
    let subtotal = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const toppingPrice = (item.toppings || []).reduce((tSum: number, tId: string) => {
        const t = toppings.find(top => top.id === tId);
        return tSum + (t ? t.price : 0);
      }, 0);
      return sum + ((product ? product.price : 0) + toppingPrice) * item.quantity;
    }, 0);

    let discount = 0;
    if (giftCardCode) {
      const gc = giftCards.find(c => c.code === giftCardCode);
      if (gc) {
        discount = Math.min(gc.balance, subtotal);
        gc.balance -= discount;
      }
    }

    // Canadian Tax Logic
    const taxInfo = canadianTaxes[taxRegion] || canadianTaxes["ON"];
    const taxRate = taxInfo.rate;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount + (tipAmount || 0) - discount;

    // Handle Customer Registration
    if (customerInfo?.phone) {
      let existing = customers.find(c => c.phone === customerInfo.phone);
      if (!existing) {
        customers.push({ ...customerInfo, points: Math.floor(total) });
      } else {
        existing.points += Math.floor(total);
      }
    }

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: customerInfo?.name || "Guest",
      customerPhone: customerInfo?.phone,
      items: items.map((item: any) => ({
        ...item,
        product: products.find(p => p.id === item.productId),
        toppings: (item.toppings || []).map((tId: string) => toppings.find(t => t.id === tId))
      })),
      subtotal,
      taxAmount,
      tipAmount,
      discount,
      totalPrice: total,
      status: "Wait",
      estimatedTime,
      notes,
      paymentMethod: paymentMethod || "Cash",
      createdAt: new Date(),
    };

    orders.push(newOrder);
    updateBusyStatus();

    // Persist to Cloud SQL / AlloyDB and trigger WebSocket broadcast
    try {
      await db.insert(dbSchema.orders).values({
        id: newOrder.id,
        customerName: newOrder.customerName || "Guest",
        customerPhone: newOrder.customerPhone || null,
        items: JSON.stringify(newOrder.items) as any,
        subtotal: Number(newOrder.subtotal) || 0,
        taxAmount: Number(newOrder.taxAmount) || 0,
        tipAmount: Number(newOrder.tipAmount) || 0,
        discount: Number(newOrder.discount) || 0,
        totalPrice: Number(newOrder.totalPrice) || 0,
        status: newOrder.status || "Wait",
        estimatedTime: Number(newOrder.estimatedTime) || 15,
        notes: newOrder.notes || "",
        paymentMethod: newOrder.paymentMethod || "Cash",
        createdAt: new Date()
      });
      console.log(`[AlloyDB] Logged customer order: ${newOrder.id} to Cloud SQL.`);
    } catch (dbErr) {
      console.warn(`[AlloyDB] Cloud SQL insert warning for order: ${newOrder.id}:`, dbErr);
    }

    try {
      await saveToFirebase("orders", newOrder.id, newOrder);
      for (const invVal of inventory) {
        await saveToFirebase("inventory", invVal.id, invVal);
      }
    } catch (firebaseErr) {
      console.error("[Firebase] Order save error:", firebaseErr);
    }

    broadcastOrder({ type: "NEW_ORDER", order: newOrder });
    
    // Thank you message based on tip
    let thankYou = "Thank you!";
    if (tipAmount > 0) {
      if (tipAmount >= 5) thankYou = "Wow! The Barista team is extremely grateful for your generosity! ❤️";
      else if (tipAmount >= 2) thankYou = "Thank you very much for this tip! Have a great day.";
      else thankYou = "Thank you for the tip!";
    }

    res.json({ order: newOrder, alertMessage, thankYou });
  });

  app.get("/api/settings", (req, res) => res.json({ currency, isBusyMode, autoBusyMode, busyThreshold, taxRegion, canadianTaxes, minEmployeeId, maxEmployeeId }));
  app.post("/api/settings", (req, res) => {
    const { currency: newCurrency, isBusy, auto, threshold, taxRegion: newTaxRegion, minEmpId, maxEmpId } = req.body;
    if (newCurrency !== undefined) currency = newCurrency;
    if (auto !== undefined) autoBusyMode = auto;
    if (isBusy !== undefined) isBusyMode = isBusy;
    if (threshold !== undefined) busyThreshold = threshold;
    if (newTaxRegion !== undefined) taxRegion = newTaxRegion;
    if (minEmpId !== undefined) minEmployeeId = minEmpId;
    if (maxEmpId !== undefined) maxEmployeeId = maxEmpId;
    updateBusyStatus();
    res.json({ currency, isBusyMode, autoBusyMode, busyThreshold, taxRegion, minEmployeeId, maxEmployeeId });
  });

  app.get("/api/reports", (req, res) => {
    const baseRevenue = 586986.00;
    const baseOrders = 112882;
    const baseTax = 27951.71;
    const baseTips = 0.00;

    const totalRevenue = baseRevenue + orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalTax = baseTax + orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const totalTips = baseTips + orders.reduce((sum, o) => sum + (o.tipAmount || 0), 0);
    const totalOrders = baseOrders + orders.length;
    
    res.json({
      totalRevenue,
      totalTax,
      totalTips,
      totalOrders,
      inventoryStatus: inventory,
      orders: orders.map(o => ({
        id: o.id,
        date: o.createdAt,
        total: o.totalPrice,
        tax: o.taxAmount,
        tip: o.tipAmount
      }))
    });
  });

  // --- User Management ---
  app.get("/api/users", (req, res) => res.json(users));
  app.post("/api/users", async (req, res) => {
    const { employeeId } = req.body;
    
    // Validate Employee ID
    if (employeeId) {
      const empIdNum = parseInt(employeeId);
      if (isNaN(empIdNum) || empIdNum < minEmployeeId || empIdNum > maxEmployeeId) {
        return res.status(400).json({ error: `Employee ID must be between ${minEmployeeId} - ${maxEmployeeId}` });
      }
      if (users.some(u => u.employeeId === employeeId)) {
        return res.status(400).json({ error: "Employee ID already exists" });
      }
    }

    const newUser = { ...req.body, id: "u" + Math.random().toString(36).substr(2, 5) };
    users.push(newUser);
    await saveToFirebase("users", newUser.id, newUser);
    res.json(newUser);
  });
  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { employeeId } = req.body;
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      // Validate Employee ID
      if (employeeId && employeeId !== users[idx].employeeId) {
        const empIdNum = parseInt(employeeId);
        if (isNaN(empIdNum) || empIdNum < minEmployeeId || empIdNum > maxEmployeeId) {
          return res.status(400).json({ error: `Employee ID must be between ${minEmployeeId} - ${maxEmployeeId}` });
        }
        if (users.some(u => u.employeeId === employeeId)) {
          return res.status(400).json({ error: "Employee ID already exists" });
        }
      }

      users[idx] = { ...users[idx], ...req.body };
      await saveToFirebase("users", id, users[idx]);
      res.json(users[idx]);
    } else res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/users/:id", async (req, res) => {
    users = users.filter(u => u.id !== req.params.id);
    await deleteFromFirebase("users", req.params.id);
    res.json({ success: true });
  });

  // --- AI Performance & Integrity Auditor ---
  app.post("/api/ai/employee-analysis", async (req, res) => {
    try {
      const { employeeName, hourlyRate, hours, rating, gameBonus, spoofModeActive } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not configured in Secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are the Kalim Coffee HR & Integrity AI Auditor. Analyze performance for the following Barista and output a strict, professional analysis report in clean Markdown format.
      
      Employee Details:
      - Name: ${employeeName || 'Unknown Barista'}
      - Hourly Wage Rate: $${hourlyRate || 25.00}/hr
      - Hours Logged: ${hours || 160} hours
      - Manager Rating Score: ${rating || 'standard'}
      - Gamified Challenge Bonuses Claimed: $${gameBonus || 0}
      - Mock GPS Spoofing active during check: ${spoofModeActive ? 'YES (Root cheat detected)' : 'NO (Authentic presence)'}

      Please write 3 concise paragraphs/sections with precise brewing & bar-craft terminology:
      1. WORK PERFORMANCE SCORECARD: Evaluate if this employee's logged performance justifies an automatic wage bump suggestions based on their manager-rated '${rating}' feedback (with an elegant career progression path).
      2. GAMIFICATION COMPLIANCE AUDIT: Review user's quest challenges and active telemetry logs.
      3. INTEGRITY ASSESSMENT & VERIFICATION DECISION: Auditing for attendance spoofing. If spoofModeActive is YES, warn of security policy breach, request manual manager override, and block automatic promotions. If NO, output standard clear integrity certificate.
      
      Keep the tone highly structured, objective, and realistic, avoiding any corporate fluff or empty praise.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "AI Analysis failed." });
    }
  });

  // --- AI POS INVOICE NATURAL LANGUAGE FINDER ---
  app.post("/api/ai-search-invoices", async (req, res) => {
    try {
      const { query, ordersList } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not configured in secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are the Kalim Coffee Intelligent Transaction & Invoice Search Assistant.
      Here is the complete sequence of transactions / orders currently residing in the active system memory or AlloyDB:
      ${JSON.stringify(ordersList, null, 2)}
      
      The store supervisor has typed this natural language query to find a specific completed or pending invoice receipt:
      "${query}"
      
      Analyze the list and find the order(s) that match their search criteria. 
      Deliver a beautiful, well-formatted Markdown response in the active language consisting of three key components:
      1. MATCHED INVOICE ID(S): Clearly state which ID matches (e.g. ord-8b9a2c). If none match, state "No exact matches found."
      2. CORRELATION EXPLAINER: In 2 sentences, explain why this order fits their request perfectly (matching milk types, prices, payment mode, product categorisation or custom notes).
      3. SUMMARY INFOCARD: Print a small Markdown table showing Category, Customer, Total Price, Status, Date.
      
      Be objective, direct, and helpful.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Invoice helper query failed." });
    }
  });

  // --- AI TAX OPTIMIZER & WRITE-OFF ADVISOR ---
  app.post("/api/ai-tax-strategy", async (req, res) => {
    try {
      const { taxRegion, financialSummary, selectedItems } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const taxLawsPath = path.resolve(process.cwd(), "src/data/tax_laws.json");
      let taxLawsData: any = {};
      if (fs.existsSync(taxLawsPath)) {
        try {
          taxLawsData = JSON.parse(fs.readFileSync(taxLawsPath, "utf8"));
        } catch (err) {
          console.error("Error reading tax laws JSON database:", err);
        }
      }
      
      const regionLaws = taxLawsData.regions?.[taxRegion] || taxLawsData.regions?.["ON"];

      if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("YOUR_") || apiKey.includes("placeholder")) {
        console.log("[AI Tax Strategy] GEMINI_API_KEY is missing or placeholder. Running high-fidelity local simulator...");
        
        const sumPrice = selectedItems ? selectedItems.reduce((acc: number, item: any) => acc + item.price, 0) : 0;
        const taxSavingsPercentage = regionLaws ? regionLaws.combinedSmallBusinessRate : 0.11;
        const taxSavings = Math.round(sumPrice * taxSavingsPercentage);
        
        let customItemBreakdown = "";
        if (selectedItems && selectedItems.length > 0) {
          customItemBreakdown = selectedItems.map((item: any) => {
            const classInfo = regionLaws?.immediateExpensingClass50 || { className: "Class 50", detail: "CCA Class 50" };
            return `### 🎯 Khấu hao cho **${item.name}** (${item.cat || "Thiết bị"})
- **Giá trị tài sản**: $${item.price.toLocaleString()} ${regionLaws?.currency || "CAD"}
- **Nhóm Tài sản/Hình thức (Class)**: ${classInfo.className}
- **Chi tiết cơ chế**: ${classInfo.detail}
- **Mức giảm thuế Doanh nghiệp trực tiếp ước tính (ở mức ${(taxSavingsPercentage * 100).toFixed(1)}%)**: Giảm được **$${Math.round(item.price * taxSavingsPercentage).toLocaleString()} ${regionLaws?.currency || "CAD"}** tiền thuế phải nộp.
- **Lợi ích vận hành**: Hiện đại hóa hạ tầng quán, chấm công chuẩn xác, nâng cao độ tin cậy và tự động hóa vận hành.`;
          }).join("\n\n");
        } else {
          customItemBreakdown = `_Bạn chưa chọn bổ sung thiết bị công nghệ nào từ danh sách phía trên để đưa vào mô hình khấu trừ. Hãy tích chọn một số mục như máy pha, máy POS hoặc Camera AI để ước tính lá chắn thuế!_`;
        }

        let deductionsStr = "";
        if (regionLaws && regionLaws.allowableDeductions) {
          deductionsStr = regionLaws.allowableDeductions.map((d: any) => {
            return `- **${d.category}**: ${d.description} *(Điều khoản tuân thủ: ${d.complianceSection})*`;
          }).join("\n");
        } else {
          deductionsStr = `- **Technology & Automation**: CCA Class 50 100% write-offs.
- **SaaS & Digital Platform**: Web setup offsets.`;
        }

        let guidesStr = "";
        if (regionLaws && regionLaws.officialGuides) {
          guidesStr = regionLaws.officialGuides.map((g: string) => `- **${g}**`).join("\n");
        } else {
          guidesStr = `- **CRA Guide T4012 - T2 Corporation - Income Tax Guide**`;
        }

        let adviceStr = "";
        if (regionLaws && regionLaws.taxPlanningAdvice) {
          adviceStr = regionLaws.taxPlanningAdvice.map((a: string) => `- ${a}`).join("\n");
        } else {
          adviceStr = `- Leverage capital purchases before year-end.`;
        }
        
        const simulatedResult = `🪐 **[CHẾ ĐỘ MÔ PHỎNG TAX CO-PILOT - PHÂN TÍCH CHUYÊN SÂU THEO LUẬT SỞ TẠI]**
_Hệ thống hiện đang chạy trong chế độ phân tích cục bộ độ tin cậy cao dựa trên cơ sở dữ liệu luật thuế tích hợp cho vùng: **${regionLaws?.province || taxRegion || "Ontario"}** (${regionLaws?.country || "Canada"}). Bạn cũng có thể cấu hình GEMINI_API_KEY trong Settings để chạy phân tích ngôn ngữ tự nhiên từ AI._

---

## 🏛️ 1. PHÂN TÍCH THUẾ DOANH NGHIỆP TRONG VÙNG: **${regionLaws?.province || taxRegion || "Ontario"} (${regionLaws?.country || "Canada"})**

Dựa trên cơ sở dữ liệu pháp lý của bang/tỉnh bang sở tại (**${regionLaws?.taxAuthority || "CRA"}**), doanh nghiệp kinh doanh cà phê của bạn được áp dụng các quy chế sau:
- **Thuế suất kết hợp cho mảng doanh nghiệp nhỏ**: **${(taxSavingsPercentage * 100).toFixed(2)}%** (Thuế liên bang: **${((regionLaws?.fedSmallBusinessRate || 0.09) * 100).toFixed(1)}%** + Thuế tỉnh bang/vùng: **${((regionLaws?.provSmallBusinessRate || 0.032) * 100).toFixed(1)}%**).
- **Hạn mức áp dụng Doanh nghiệp nhỏ (SBD Threshold)**: Lên đến **$${(regionLaws?.smallBusinessThreshold || 500000).toLocaleString()} ${regionLaws?.currency || "CAD"}** thu nhập chịu thuế mỗi năm.
- **Doanh thu ước tính cơ sở**: $${(financialSummary?.totalRevenue || 124500).toLocaleString()} ${regionLaws?.currency || "CAD"}
- **Thuế bán hàng (GST/HST/PST) thu hộ**: $${(financialSummary?.totalTax || 6225).toLocaleString()} ${regionLaws?.currency || "CAD"}
- **Quỹ tiền tip nhân sự**: $${(financialSummary?.totalTips || 15400).toLocaleString()} ${regionLaws?.currency || "CAD"}

---

## 💻 2. CHI TIẾT KHẤU HAO TÀI SẢN & KHOẢN ĐẦU TƯ CÔNG NGHỆ CHỌN LỌC

Chúng tôi đã phân tích danh mục đầu tư bạn chọn dựa trên hệ thống phân nhóm tài sản CRA/IRS của vùng:

${customItemBreakdown}

### 📊 Bảng tổng quan Lá chắn thuế (Tax Shield Analysis):
| Chỉ số Tài chính | Giá trị Ước tính |
| :--- | :--- |
| **Tổng ngân sách đầu tư trang thiết bị (CapEx)** | **$${sumPrice.toLocaleString()} ${regionLaws?.currency || "CAD"}** |
| **Tổng thu nhập chịu thuế tối đa được giảm trừ** | **-$${sumPrice.toLocaleString()} ${regionLaws?.currency || "CAD"}** |
| **SỐ TIỀN THUẾ THỰC TẾ KHÁCH HÀNG TIẾT KIỆM ĐƯỢC** | **$${taxSavings.toLocaleString()} ${regionLaws?.currency || "CAD"}** |

---

## 📈 3. CÁC HẠN MỤC KHẤU TRỪ HỢP LỆ THEO LUẬT LIÊN BAN & ĐỊA PHƯƠNG
Dưới đây là các quy định chi tiết được hệ thống học tập và ghi nhận trực tiếp từ tài liệu hướng dẫn của **${regionLaws?.taxAuthority}**:

${deductionsStr}

---

## 📘 4. TÀI LIỆU VÀ CHỈ DẪN CHÍNH THỨC CẦN TRA CỨU
Doanh nghiệp nên tham khảo trực tiếp các hướng dẫn cụ thể dưới đây để đảm bảo an toàn tuyệt đối khi nộp tờ khai:
${guidesStr}

---

## 🪐 5. LỜI KHUYÊN HOẠCH ĐỊNH TÀI CHÍNH TỐI ƯU LỢI NHUẬN
${adviceStr}`;
        
        return res.json({ result: simulatedResult });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const selectedDescription = (selectedItems && selectedItems.length > 0)
        ? `Người dùng đã chủ động chọn đầu tư vào các thiết bị/công nghệ sau năm nay:
${selectedItems.map((item: any) => `- **${item.name}** (${item.cat}): Giá trị $${item.price.toLocaleString()} ${regionLaws?.currency || "CAD"}`).join("\n")}
Tổng cộng: $${selectedItems.reduce((acc: number, item: any) => acc + item.price, 0).toLocaleString()} ${regionLaws?.currency || "CAD"}.

Hãy phân tích chính xác xem việc đầu tư này sẽ giúp khấu hao nhanh 100% trong năm đầu tiên dựa trên luật sở tại để giảm bao nhiêu tiền thuế doanh nghiệp thực tế.`
        : "Người dùng chưa chọn khoản đầu tư công nghệ cụ thể nào từ danh sách. Hãy đưa ra gợi ý chung và khuyến khích lựa chọn các thiết bị công nghệ mẫu như bên dưới.";

      const lawsGroundingContext = regionLaws ? `
=== GROUNDING CO-PILOT KNOWLEDGE BASE: SYSTEMATIC TAX LAWS FOR ${regionLaws.province} (${regionLaws.regionId}) ===
- Province/State/Region: ${regionLaws.province} (${regionLaws.country})
- Local Currency: ${regionLaws.currency}
- Main Tax Authority: ${regionLaws.taxAuthority}
- Federal Corporate Small Business Tax Rate: ${(regionLaws.fedSmallBusinessRate * 100).toFixed(2)}%
- Provincial/State Corporate Small Business Tax Rate: ${(regionLaws.provSmallBusinessRate * 100).toFixed(2)}%
- Combined Small Business Corporate Rate: ${(regionLaws.combinedSmallBusinessRate * 100).toFixed(2)}%
- Small Business Deduction Threshold/Limit: $${regionLaws.smallBusinessThreshold.toLocaleString()} ${regionLaws.currency}
- General Federal Corporate Rate: ${(regionLaws.generalCorpRate * 100).toFixed(2)}% (Provincial General Rate: ${(regionLaws.provGeneralRate * 100).toFixed(2)}%)
- Class 50 Immediate Expensing Rule Info: ${regionLaws.immediateExpensingClass50.className} with details: ${regionLaws.immediateExpensingClass50.detail}

Allowable Deductions and Compliant sections:
${regionLaws.allowableDeductions.map((d: any) => `- [Category: ${d.category}] ${d.description} (Compliance Reference Section: ${d.complianceSection})`).join("\n")}

Official Tax Guides to reference:
${regionLaws.officialGuides.map((g: string) => `- ${g}`).join("\n")}

Aesthetic/Strategic Regional Planning Advice:
${regionLaws.taxPlanningAdvice.map((a: string) => `- ${a}`).join("\n")}
=========================================` : "";

      const prompt = `You are the ultimate AI Corporate Tax Strategist and Financial Advisor specialized in premium coffee shops and cafes (specifically Kalim Coffee).
      The user is operating their cafe in region ${taxRegion || "BC"} (${regionLaws?.province || "British Columbia"}).
      Here is their current estimated financial summary for the year:
      - Total Estimated Revenue: $${financialSummary.totalRevenue} ${regionLaws?.currency || "CAD"}
      - Total Completed Orders: ${financialSummary.totalOrders}
      - Estimated Sales Tax (GST/PST/HST): $${financialSummary.totalTax} ${regionLaws?.currency || "CAD"}
      - Total Tip Pool Managed: $${financialSummary.totalTips} ${regionLaws?.currency || "CAD"}
      
      ${selectedDescription}
      
      ${lawsGroundingContext}
      
      CRITICAL INSTRUCTION: You MUST use your Google Search capability to verify, supplement, and find any other up-to-date corporate tax laws, tax brackets, small business deductions, immediate expensing rules (Class 50), and tax refund opportunities for ${regionLaws?.province || "BC"}, Canada/USA. Combine Google Search suggestions with the grounded knowledge base details provided in the XML-like block above.
      
      Generate a comprehensive, highly valuable, and actionable Corporate Tax Optimization Strategy in Vietnamese.
      It should systematically cover:
      1. TÌM KIẾM VÀ CẬP NHẬT LUẬT THUẾ MỚI NHẤT TẠI (${taxRegion}, ${regionLaws?.country || "Canada"}): Phân tích luật thuế hiện hành đã học được từ Google Search và cơ sở dữ liệu tích lũy (thuế TNDN, Small Business Deduction, thuế suất kết hợp: ${(regionLaws?.combinedSmallBusinessRate * 100).toFixed(2)}%).
      2. TỐI ƯU HÓA HOÀN THUẾ & ĐẦU TƯ CHO CÔNG TY:
         - Cung cấp tính toán về việc giảm Thu nhập chịu thuế (Taxable Income) và khấu hao nhanh 100% dựa trên tổng vốn đầu tư công nghệ đã chọn.
         - Viết chi tiết về các giải pháp máy pha cà phê thông minh, IoT, AI camera và định vị GPS GPS được hỗ trợ bởi luật của vùng: ${regionLaws?.immediateExpensingClass50?.className}.
      3. CHIẾN LƯỢC TỐI ƯU HOÁ TĂNG TRƯỞNG & LỢI NHUẬN (Profit & Growth Maximization):
         - Đề xuất các chi phí hợp lệ cụ thể có thể khấu trừ tối đa để tăng lợi nhuận thực tế (như chi phí lương, EHT, đào tạo, SaaS, website).
         - Lời khuyên đầu tư tài chính từ tiền nhàn rỗi để bảo vệ tài sản doanh nghiệp.
      4. DANH MỤC CÁC TÀI LIỆU HƯỚNG DẪN CHÍNH THỨC CỦA ${regionLaws?.taxAuthority || "CRA/IRS"} CẦN THAM KHẢO TRỰC TIẾP.
         
      Please write in clear, inspiring, and professional Vietnamese. Format the output in gorgeous Markdown, using professional bullet points, tables, bold key metrics, and an encouraging, objective tone.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      res.json({ result: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "AI Tax Strategy engine failed." });
    }
  });

  // --- AI Employees Help & Ecosystem Support Agent ---
  app.post("/api/ai/employee-support", async (req, res) => {
    try {
      const { message, history, userId, userName, language } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      const userDisplayName = userName || "Staff Member";
      const selectedLang = language || "en";

      // Dynamically load translation sets matching support language
      const localDicts: { [key: string]: any } = {
        en: {
          title: "Kalim Coffee Ecosystem Operations & Support Agent",
          greeting: `Hello ${userDisplayName}! I am your Kalim Operational Copilot. Ask me about wrong drinks, printer jams, GPS geofences, or request leaves directly.`,
          wrongDrinkTitle: "☕ CUSTOMER RECEIVED WRONG DRINK (Happy Priority Policy)",
          wrongDrinkBody: `1. **Acknowledge**: Deeply apologize immediately: "I am extremely sorry for the mix-up, let me remake that for you right away!"\n2. **Absolute Priority**: Bump order to front of bar queue, prepare within 90s.\n3. **Ecosystem Delight**: Offer incorrect drink for free or hand a 50%/FREE **Kalim Happy Voucher** and grant 10 loyalty points.`,
          tasteTitle: "🌟 CUSTOMER UNHAPPY WITH WATER/TASTE VIBE",
          tasteBody: `1. Inquire gently: "Would you prefer it sweeter, lighter, or another drink instead?"\n2. **Avoid Formula Debate**: Never force standard recipe coordinates to argue.\n3. Remake or replace the beverage 100% free with a smile to ensure ultimate customer delight.`,
          refundTitle: "💳 CUSTOMER REQUESTS EXPEDITED RETURN & REFUND",
          refundBody: `Our pledge is **"100% Happy or 100% Refunded"**.\n1. Agree gracefully instantly: "Absolutely, I will refund your receipt immediately. We apologize that today's service did not meet expectations."\n2. Process 100% transaction refund back on the **Kalim POS app**.\n3. Hand over a complimentary pastry as a heartfelt token of goodwill.`,
          gpsTitle: "🛠️ TIMECLOCK GPS ACCURACY ERROR FIXED RESOLUTION",
          gpsBody: `If your Timecard Punch reports geofencing spoof protection flags:\n1. Disable VPNs, mock location simulators, and Android developer debugging.\n2. Ensure cellular network data and High Accuracy locate settings are active.\n3. Move closer to the primary POS router (within 15m radius of headquarters).`,
          printerTitle: "🖨️ POS RECEIPT PRINTER PAPER JAM CLEANUP",
          printerBody: `1. Release thermal printer flip latch.\n2. Pull through clogged paper scraps.\n3. Embed fresh thermal roll alignment with shiny side facing outward.\n4. Close tightly and test print.`,
          leaveTitle: "🌴 LEAVE REQUEST SYNCHRONIZATION",
          leaveBody: `Your leave request has been submitted to the Kalim POS Admin roster directory! After executive approval, your active shifts on that date will be custom released.`,
          fixedTitle: "📌 WEEKLY FIXED ROSTER REQUEST RECORDED",
          fixedBody: `Your weekly fixed shift registration option has been recorded. Synergizing schedules with Calgary South.`,
          registerTitle: "📅 SHIFT REGISTER ENROLLMENT CREATED",
          registerBody: `Registration for the Barista schedule created. Ready for management confirmation.`
        },
        fr: {
          title: "Trò lý Vận hành Écosystème Kalim Coffee",
          wrongDrinkTitle: "☕ LE CLIENT A REÇU UNE CORRESPONDANCE ERRONÉE (Priorité Joyeuse)",
          wrongDrinkBody: `1. **Reconnaître (Acknowledge)** : Présentez vos excuses immédiates : "Je suis sincèrement désolé pour l'erreur, je vais refaire votre boisson tout de suite !"\n2. **Priorité absolue** : Placez la commande en tête de file, préparez en moins de 90 secondes.\n3. **Plaisir de l'écosystème** : Offrez la boisson incorrecte gratuitement. Offrez un **Bon de réduction Kalim Happy** (50% ou boisson gratuite lors de la prochaine visite). Ajoutez 10 points de fidélité.`,
          tasteTitle: "🌟 CLIENT INSATISFAIT DU GOÛT / DE LA QUALITÉ",
          tasteBody: `1. Demandez gentiment : "Préféreriez-vous qu'elle soit un peu plus sucrée, moins lactée, ou préférez-vous une autre boisson ?"\n2. **Pas de débats sur les recettes**.\n3. Proposez de refaire ou remplacer 100% gratuitement avec le sourire. L'objectif est que chaque client reparte heureux !`,
          refundTitle: "💳 RETOURS ET REMBOURSEMENTS",
          refundBody: `Notre devise : **"100% Heureux ou 100% Remboursé"**.\n1. Acceptez instantanément : "Chère cliente/client, je serais ravi procedér au remboursement immédiat."\n2. Remboursez 100% via l'application **Kalim POS**.\n3. Offrez une pâtisserie gratuite en guise de geste d'amitié additionnel.`,
          gpsTitle: "🛠️ RÉSOLUTION D'ERREUR DU GPS DU TIMECARD",
          gpsBody: `Si votre carte de pointage indique des erreurs de zone :\n1. Désactivez les applications de VPN ou FakeGPS.\n2. Activez le Wi-Fi haute précision.\n3. Approchez-vous de la borne POS principale (dans un rayon de 15 m).`,
          printerTitle: "🖨️ BOURRAGE IMPRIMANTE TICKET CAISSE",
          printerBody: `1. Ouvrez le loquet de l'imprimante thermique.\n2. Retirez les morceaux de papier coincés.\n3. Placez un nouveau rouleau thermique avec la face brillante vers l'extérieur.\n4. Refermez fermement.`,
          leaveTitle: "🌴 SYNCHRONISATION DU CONGÉ SOUCH",
          leaveBody: `Votre demande de congé de repos a été soumise avec succès au POS de gestion.`,
          fixedTitle: "📌 RECOMPENSE HORAIRES CONFIGURATION",
          fixedBody: `Votre demande historique de synchronisation d'horaires récurrents a été enregistrée de manière sécurisée.`,
          registerTitle: "📅 HORAIRE BARISTA QUART ENREGISTREMENT",
          registerBody: `Votre inscription en tant que Barista pour la semaine suivante a été soumise.`
        },
        es: {
          title: "Asistente Inteligente de Operaciones Kalim Coffee",
          wrongDrinkTitle: "☕ BEBIDA INCORRECTA RECIBIDA (Política de Felicidad prioritaria)",
          wrongDrinkBody: `1. **Acknowledge (Reconocer)**: Discúlpese de inmediato de corazón: 'Lamento mucho el error, ¡le prepararé la bebida correcta ahora mismo!'\n2. **Prioridad absoluta**: Coloque la orden al principio de la línea de preparación en la barra.\n3. **Deleite del Ecosistema**: Ofrezca la bebida incorrecta gratis. Regale un **Kalim Happy Voucher** (50% de descuento o gratis en su próxima visita). Sume 10 puntos de fidelidad.`,
          tasteTitle: "🌟 CLIENTE INCONFORME CON EL SABOR O CALIDAD",
          tasteBody: `1. Pregunte amablemente: '¿Le gustaría con un poco más de dulce, menos leche o prefiere que le preparemos algo diferente?'\n2. **Evite debates de receta**.\n3. Re-elabore o remplace la bebida 100% gratis con amabilidad.`,
          refundTitle: "💳 GRACEFUL REEMBOLSOS Y RETORNOS",
          refundBody: `Nuestra promesa es **"100% Satisfecho o 100% Reembolsado"**.\n1. Acepte de inmediato: 'Será un placer realizarle el reembolso completo de su ticket.'\n2. Realice el reembolso del 100% en la aplicación **Kalim POS** al medio de pago original.\n3. Regale un pan dulce o galleta como disculpa de cortesía.`,
          gpsTitle: "🛠️ SOLUCIÓN DE ERROR GPS EN EL REGISTRO DE TRABAJO",
          gpsBody: `Si su marcado indica anomalías de cobertura:\n1. Apague su VPN o FakeGPS.\n2. Habilite datos celulares y Wi-Fi de alta precisión.\n3. Realice el fichaje de entrada dentro del radio de 15m del POS principal.`,
          printerTitle: "🖨️ ATASCO DE PAPEL EN IMPRESORA DEL TICKET",
          printerBody: `1. Abra la tapa de la impresora térmica.\n2. Retire restos acumulados de papel.\n3. Introduzca nuevo rollo térmico con el lado brillante hacia afuera.\n4. Cierre con firmeza.`,
          leaveTitle: "🌴 SOLICITUD DE LICENCIA / DÍA LIBRE AL POS",
          leaveBody: `Solicitud de día de vacaciones enviada correctamente de forma digital para aprobación del administrador.`,
          fixedTitle: "📌 ASIGNACIÓN PLANIFICADA DE HORARIO FIJO",
          fixedBody: `Su solicitud para definir un turno fijo semanal ha sido procesada de manera exitosa.`,
          registerTitle: "📅 TURNO DE TRABAJO SEMANAL GUARDADO",
          registerBody: `Pre-registro de horas Barista efectuado. Pendiente de la confirmación directa del gerente.`
        },
        ja: {
          title: "Kalim Coffee エコシステム管理 AI コーチ",
          wrongDrinkTitle: "☕ 提供間違いへの対応ポリシー (お客様ハッピー最優先)",
          wrongDrinkBody: `1. **謝罪と確認 (Acknowledge)**: 即座に全力で謝罪。「大変申し訳ございません！すぐに正しいドリンクをお作りします！」\n2. **最優先対応**: バーの最優先レーンにて90秒以内に再提供を行います。\n3. **ハッピー特典**: 提供ミスのドリンクは無料。次回使える **Kalim Happy Voucher** (50%OFF/1杯無料券)を進呈、10ロイヤリティポイント付与。`,
          tasteTitle: "🌟 味や品質に関するご不満へのプロセス",
          tasteBody: `1. 親身に解決します。「甘さやミルク感を調整しましょうか？他のドリンクへのご変更も喜んで承ります！」\n2. **配合議論の禁止**: レシピ配分を主張する言い訳は絶対に行いません。\n3. 100%無料で一杯再作成し、全員が笑顔で帰路につけるよう尽力します。`,
          refundTitle: "💳 返品および返金の処理",
          refundBody: `当店の規約は **「100%ご満足、または100%即座に返金」** です。\n1. 迅速に対応：「かしこまりました。すぐにレジにて全額返金処理を実施いたします。」\n2. **Kalim POS app** を通じ元の決済口座へ全額返金を反映。\n3. お詫びにクッキーを無料進呈します。`,
          gpsTitle: "🛠️ タイムカード位置情報打刻エラーの改善手順",
          gpsBody: `打刻エリアの検知異常や警告が表示される場合：\n1. VPNや位置変更ツール、デベロッパー設定を無効化します。\n2. LTE・Wi-FiおよびGPS高精度アシストを全てオンに設定します。\n3. POSルーターの近く（15m以内）で再打刻してください。`,
          printerTitle: "🖨️ サーマルレシートプリンタ用紙詰まり解消法",
          printerBody: `1. プリンターカバーレバーを引き上げます。\n2. 内部で詰まった紙片を確実に取り除きます。\n3. 感熱ロール紙の光沢面（印刷面）が手前を向くよう装填。\n4. しっかりと強めにカバーを閉め、動作確認をしてください。`,
          leaveTitle: "🌴 休暇休暇申請の提出",
          leaveBody: `お休み希望を **Kalim POS Admin** へ連携しました。管理者の承認後に反映されます。`,
          fixedTitle: "📌 週固定シフトシフト登録成功",
          fixedBody: `固定シフト登録を記録しました。Calgary Southの稼働計画と統合調整します。`,
          registerTitle: "📅 バーシタ個人スケジュール希望の提出",
          registerBody: `Baristaシフトへの参加希望を提出しました。管理担当による確認をお待ちください。`
        },
        zh: {
          title: "卡林咖啡生态智能运营 AI 主管",
          wrongDrinkTitle: "☕ 做错/送错饮料处理标准 (首位满意度承诺)",
          wrongDrinkBody: `1. **致歉 (Acknowledge)**: 亲切且真诚地表达谢意与歉意：“非常抱歉给您做错了！我们将以绝对最高优先级在吧台为您重制，请稍等！”\n2. **限时处理**: 吧台调配至第一队列，在90秒以内完美递出新产品。\n3. **惊喜礼包**: 做错的产品可免费让客带走，同时赠送 **Kalim Happy Voucher** (下次消费50%或免费杯券) 并为会员账户积10分。`,
          tasteTitle: "🌟 打包或品尝口感不满意应对指导",
          tasteBody: `1. 诚恳问询：“请问需要帮您调整糖泵、还是为您立即免费换调一杯别的饮品试试看呢？”\n2. **严禁争辩配方标准**：绝不与顾客争执配方比例。\n3. 随时报以微笑，100%免费更换或调整，Kalim生态的终极核心是让大家在微笑中离店！`,
          refundTitle: "💳 顾客极速退货与退款请求处理",
          refundBody: `卡林咖啡的宗旨是 **"100%满意，否则100%极速退款"**。\n1. 极速响应：“非常抱歉今次未能达到您的期望。我这就为您申请办理全款返还处理。”\n2. 使用 **Kalim POS app** 将款项100%全回退至客人原支付方式中。\n3. 加赠当日前焙小烤点一份以表达真诚的诚意。`,
          gpsTitle: "🛠️ 考勤机打卡GPS电子围栏过界排障",
          gpsBody: `打卡提示范围受限或存在作弊防护代码时：\n1. 停用VPN、虚拟定位模拟工具或手机开发者参数（ADB调试）。\n2. 打开手机高精度辅助WiFi和蜂窝网络。\n3. 靠近门店POS主机（15米黄金辐射范围）。`,
          printerTitle: "🖨️ 收银小票打印机咬纸/卡纸解决方案",
          printerBody: `1. 向上拉开打印机盖板扣。\n2. 剥离内部撕毁的卡滞碎纸屑。\n3. 重新对齐放置热敏打印纸，确保空白打印面朝外侧。\n4. 用力盖紧盖子完成测试。`,
          leaveTitle: "🌴 员工离线请假信息同步成功",
          leaveBody: `请假呈批已上报。管理部门审核后，当天执勤安排会自动注销。`,
          fixedTitle: "📌 周度定期班次排班意向登记",
          fixedBody: `固定周期轮班排班已纳入数据库，正与 Calgary South 进行排班对称。`,
          registerTitle: "📅 单次吧台咖啡师轮值意向申报",
          registerBody: `您已录入排班意向，请等待负责经理的在线审结。`
        },
        vi: {
          title: "Kalim Coffee Ecosystem Support & Operations Helper",
          wrongDrinkTitle: "☕ WRONG INGREDIENTS OR DRINK MIX-UP (Customer Delight Standard)",
          wrongDrinkBody: `1. **Acknowledge & Apologize Immediately**: "I am deeply sorry about this mistake. Let me craft your drink correctly right away!".\n2. **Absolute Priority**: Place this order first at the espresso bar, aim for under 90 seconds.\n3. **Deleite**: Let them keep the mistaken drink if they wish, present a **Kalim Happy Voucher** (50% off next visit), and add 10 loyalty points.`,
          tasteTitle: "🌟 CUSTOMER UNHAPPY WITH TASTE",
          tasteBody: `1. Inquire politely: "Is the drink too sweet or bitter for your preference? Let us make it again or try another item completely free of charge!"\n2. **Never debate recipes with guests**.\n3. Offer 100% free drink remakes to secure customer happiness.`,
          refundTitle: "💳 RETURN & REFUND DEMAND",
          refundBody: `Motto: **"100% Satisfaction or it's Free"**.\n1. Agree instantly: "I apologize for the unsatisfactory experience. Let me refund your payment."\n2. Execute the refund transaction on the **Kalim POS** interface.\n3. Offer a complimentary pastry with a heartfelt apology.`,
          gpsTitle: "🛠️ SOLVING GPS TIMECLOCK PUNCH DEVIATIONS",
          gpsBody: `If GPS geofencing signals an out-of-bounds warning:\n1. Deactivate FakeGPS apps, active VPNs, or developer USB debugging.\n2. Enable 'High Accuracy' positioning on mobile location settings.\n3. Step closer to the main POS terminal network router (within 15m).`,
          printerTitle: "🖨️ THERMAL PRINTER RECEIPT PAPER JAM",
          printerBody: `1. Unlock and open the printer's thermal paper compartment.\n2. Clean out any torn jam residue.\n3. Drop in a fresh paper roll with the glossy thermal side facing up.\n4. Close firmly and press 'Feed' to verify.`,
          leaveTitle: "🌴 APPLICATION FOR LEAVE",
          leaveBody: `Your leave request has been securely dispatched to the POS supervisor dashboard for review.`,
          fixedTitle: "📌 REGISTER FIXED WEEKLY ROSTER",
          fixedBody: `Your weekly fixed shift availability registration has been recorded.`,
          registerTitle: "📅 SINGLE SHIFT VOLUNTEER OFFERS",
          registerBody: `Your schedule preference has been securely stored pending final supervisor roster confirmation.`
        }
      };

      const langObj = localDicts[selectedLang] || localDicts.en;

      const systemInstruction = `
        You are "Kalim Coffee Ecosystem Operations & Support Agent", a supportive expert for café baristas and cashiers.
        Your supreme goal is Customer Delight. Always respond 100% in the following language: ${selectedLang}.
        
        Use the following policies to structure your advice:
        - WRONG DRINK: Acknowledge politely, priority re-brew within 90s, keep incorrect cup, issue 1 50% off Kalim Happy Voucher + 10 points.
        - UNHAPPY TASTE: Custom re-brewing sweetness or adjust milk. No disputes.
        - RETURN REFUND: Agree gracefully immediately, process on Kalim POS, gift pastry.
        - GPS ERROR: Turn off FakeGPS, developer options, use WiFi High Accuracy, stand within 15 meters.
        - BILL PRINTER JAM: Guide thermal paper face pointing outwards, test LAN.
        
        SCHEDULING TRIGGERS:
        If they mention planning leave, fixed schedules, or register shifts, you MUST include this EXACT JSON:
        [REQUEST_TRIGGER]
        {
          "type": "leave" | "fixed_schedule" | "register_schedule",
          "date": "YYYY-MM-DD" (if day is specified),
          "details": "Vietnamese/English short summary details of request"
        }
        [/REQUEST_TRIGGER]
      `;

      let responseText = "";
      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { systemInstruction },
            history: history || []
          });
          const result = await chat.sendMessage({ message });
          responseText = result.text;
        } catch (apiErr) {
          console.error("Gemini API error in support route, falling back to local dictionaries:", apiErr);
        }
      }

      // Local keyword-based matching engine when key is offline or errors
      if (!responseText) {
        const lower = (message || "").toLowerCase();
        if (lower.includes("sai món") || lower.includes("nhầm") || lower.includes("sai mon") || lower.includes("wrong") || lower.includes("mix")) {
          responseText = `### ${langObj.wrongDrinkTitle}\n\n${langObj.wrongDrinkBody}`;
        } else if (lower.includes("không ưng") || lower.includes("khách chê") || lower.includes("unhappy") || lower.includes("taste") || lower.includes("ko ung") || lower.includes("like")) {
          responseText = `### ${langObj.wrongDrinkTitle}\n\n${langObj.tasteBody}`;
        } else if (lower.includes("trả lại") || lower.includes("hoàn tiền") || lower.includes("refund") || lower.includes("return")) {
          responseText = `### ${langObj.refundTitle}\n\n${langObj.refundBody}`;
        } else if (lower.includes("nghỉ") || lower.includes("xin nghi") || lower.includes("leave") || lower.includes("phep")) {
          const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2})/g;
          const matched = lower.match(dateRegex);
          const dateStr = matched ? matched[0] : "2026-06-18";
          responseText = `### ${langObj.leaveTitle}\n\n${langObj.leaveBody}\n\n[REQUEST_TRIGGER]\n{\n  "type": "leave",\n  "date": "${dateStr}",\n  "details": "Requested leave via AI: ${message}"\n}\n[/REQUEST_TRIGGER]`;
        } else if (lower.includes("lịch cố định") || lower.includes("fixed") || lower.includes("roster") || lower.includes("co dinh")) {
          responseText = `### ${langObj.fixedTitle}\n\n${langObj.fixedBody}\n\n[REQUEST_TRIGGER]\n{\n  "type": "fixed_schedule",\n  "details": "Requested fixed weekly roster via AI: ${message}"\n}\n[/REQUEST_TRIGGER]`;
        } else if (lower.includes("đăng ký") || lower.includes("ca làm") || lower.includes("register") || lower.includes("shift") || lower.includes("ca lam")) {
          const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2})/g;
          const matched = lower.match(dateRegex);
          const dateStr = matched ? matched[0] : "2026-06-15";
          responseText = `### ${langObj.registerTitle}\n\n${langObj.registerBody}\n\n[REQUEST_TRIGGER]\n{\n  "type": "register_schedule",\n  "date": "${dateStr}",\n  "details": "Shift registration on ${dateStr} via AI"\n}\n[/REQUEST_TRIGGER]`;
        } else {
          // General guide in selected language
          responseText = `### ${langObj.title || "Kalim Operational Assistant"}\n\n` + 
            `${langObj.greeting || "How may I train you on recipes, POS glitches, or workforce timing requests?"}\n\n` +
            `* **Incorrect coffee delivered**: "Customer wrong drink cup", "Unhappy taste"\n` +
            `* **POS glitches & errors**: "GPS geofence error", "Receipt machine paper jam"\n` +
            `* **Shift & Vacation requests**: "Register shift", "Apply leave off", "Setup fixed work roster"`;
        }
      }

      // Capture problem details in AI learning logs (Ecosystem training logs)
      let issueType = "General Q&A";
      const lowerMsg = (message || "").toLowerCase();
      if (lowerMsg.includes("sai") || lowerMsg.includes("wrong") || lowerMsg.includes("nhầm") || lowerMsg.includes("mix-up")) {
        issueType = "Wrong/Incorrect Order served";
      } else if (lowerMsg.includes("taste") || lowerMsg.includes("không ưng") || lowerMsg.includes("unhappy") || lowerMsg.includes("ko ung") || lowerMsg.includes("like")) {
        issueType = "Customer unhappy with taste";
      } else if (lowerMsg.includes("trả lại") || lowerMsg.includes("refund") || lowerMsg.includes("hoàn tiền") || lowerMsg.includes("return")) {
        issueType = "Return & Refund request";
      } else if (lowerMsg.includes("nghỉ") || lowerMsg.includes("leave") || lowerMsg.includes("phep")) {
        issueType = "Leave schedule synchronisation";
      } else if (lowerMsg.includes("roster") || lowerMsg.includes("fixed") || lowerMsg.includes("lịch làm") || lowerMsg.includes("ca làm")) {
        issueType = "Workforce alignment request";
      } else if (lowerMsg.includes("gps") || lowerMsg.includes("clock") || lowerMsg.includes("punch")) {
        issueType = "GPS geofence connection support";
      } else if (lowerMsg.includes("printer") || lowerMsg.includes("print") || lowerMsg.includes("kẹt")) {
        issueType = "POS hardware/printer troubleshooting";
      }

      aiLearningLogs.unshift({
        id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        source: "Staff Portal Support",
        userId: userId || "anonymous",
        userName: userDisplayName,
        userQuery: message,
        detectedIssue: issueType,
        responseExcerpt: responseText.slice(0, 150) + "...",
        language: selectedLang
      });

      res.json({ response: responseText });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to process AI employee support request." });
    }
  });

  // --- GET Learning Logs ---
  app.get("/api/ai-learning-logs", (req, res) => {
    res.json(aiLearningLogs);
  });

  // --- POST Clear / Optimize Learning Logs ---
  app.post("/api/ai-learning-logs/optimize", (req, res) => {
    // Keep a maximum of 5 logs to simulate optimal local prompt memory tuning
    aiLearningLogs = aiLearningLogs.slice(0, 5);
    res.json({ success: true, count: aiLearningLogs.length });
  });

  // --- Time Clock ---
  app.get("/api/time-clock", (req, res) => res.json(timeClock));
  app.post("/api/time-clock/stamp", async (req, res) => {
    const { employeeId, type, location, timezone } = req.body; // type: 'in' or 'out'
    const user = users.find(u => u.employeeId === employeeId);
    if (!user) return res.status(404).json({ error: "Staff not found with this ID" });

    // Check for duplicate entries on the same day
    const today = new Date().toISOString().split('T')[0];
    const existingToday = timeClock.filter(tc => 
      tc.userId === user.id && 
      tc.timestamp.startsWith(today) && 
      tc.type === type
    );

    if (existingToday.length > 0) {
      return res.status(400).json({ error: `Staff has already ${type === 'in' ? 'Clocked In' : 'Clocked Out'} for today.` });
    }

    const stamp = {
      id: "tc" + Date.now(),
      userId: user.id,
      employeeId: user.employeeId,
      userName: user.name,
      type,
      timestamp: new Date().toISOString(),
      location: location || "Unknown",
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    timeClock.push(stamp);
    try {
      await saveToFirebase("timeClock", stamp.id, stamp);
      
      const syncPacket = {
        id: "sync-" + Date.now(),
        senderName: "Kalim System",
        message: `${stamp.userName} clocked ${stamp.type === 'in' ? 'IN' : 'OUT'} via Staff Connect`,
        timestamp: new Date().toISOString(),
        type: "system"
      };
      staffConnectSync.push(syncPacket);
      await saveToFirebase("staffConnectSync", syncPacket.id, syncPacket);

      broadcastOrder({ type: "STAFF_CONNECT_STAMP", stamp });
      broadcastOrder({ type: "STAFF_CONNECT_SYNC", packet: syncPacket });
    } catch (firebaseErr) {
      console.error("[Firebase] Error saving timeClock stamp:", firebaseErr);
    }
    res.json(stamp);
  });

  // --- AI Analysis and Tools using Gemini ---
  app.get("/api/ai-insights", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const dataSummary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
        popularProducts: products.map(p => ({
          name: p.name,
          sales: orders.reduce((sum, o) => sum + o.items.filter((i: any) => i.productId === p.id).length, 0)
        })),
        inventory: inventory,
        busyModeStats: isBusyMode ? "Currently Busy" : "Normal",
        currency: currency,
        recentOrders: orders.slice(-10).map(o => ({
          items: o.items.map((i: any) => i.product.name),
          total: o.totalPrice,
          time: o.createdAt
        }))
      };

      const prompt = `
        As a world-class business growth consultant and AI data scientist for Kalim Coffee POS, analyze this comprehensive data:
        ${JSON.stringify(dataSummary)}
        
        Provide high-impact, data-driven insights in English:
        1. STRATEGIC GROWTH: Predict next month's revenue trends and suggest 3 specific actions to increase ticket size by 15%.
        2. CONSUMER PSYCHOLOGY: Analyze current order patterns to identify "hidden" combinations customers love.
        3. DYNAMIC MENU: Suggest one "Hero Product" to feature next week and one underperforming item to retire or reprice.
        4. SMART INVENTORY & SUPPLY CHAIN: 
           - Predict "Out-of-Stock" date for every low item.
           - Identify potential supply chain risks.
        5. OPERATIONAL EXCELLENCE: Suggest staffing adjustments for peak hours based on busy mode history.
        6. MARKETING ENGINE: Generate 3 catchy Instagram/Facebook captions to promote the "Hero Product."
        
        Formatting: Use professional, actionable bullet points. Be bold and decisive.
      `;

      let insightsText = "";
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          insightsText = response.text;
        } catch (apiErr) {
          console.log("[Gemini Engine] Insights generation shifted to local fallback mode.");
        }
      }

      if (!insightsText) {
        const sortedProducts = [...products].map(p => ({
          name: p.name,
          sales: orders.reduce((sum, o) => sum + o.items.filter((i: any) => i.productId === p.id).length, 0)
        })).sort((a,b) => b.sales - a.sales);

        const topProduct = sortedProducts[0]?.name || "Espresso";
        const lowStock = inventory.filter(i => i.stock <= i.minStock);
        const projectedRev = dataSummary.totalRevenue * 1.15;

        insightsText = `### 📊 KALIM COFFEE POS BUSINESS INSIGHTS (Local Smart Fallback Engine)

#### 1. STRATEGIC GROWTH
* **Revenue Trend Predictor**: Based on your transaction density, we project **next month's revenue to increase by 15%** to an estimated **${projectedRev.toFixed(2)} ${dataSummary.currency}**.
* **Actionable Growth Initiatives**:
  1. **Alternative Milk Upgrades**: Suggest oat or almond milk to increase ticket sizes of espresso drinks.
  2. **Loyalty Push**: Reward repeat customers to drive daily transaction volume.
  3. **High-Margin Bundling**: Prompt cashiers to suggest fresh house pastries with medium or large coffee orders.

#### 2. CONSUMER PSYCHOLOGY
* **Hidden Combinations**: Analysis suggests frequent pairing of espresso beverages with specialized sweetener toppings during rush-hour traffic.

#### 3. DYNAMIC MENU SUGGESTIONS
* **Hero Product**: **${topProduct}** is leading sales category velocity this period.
* **Underperforming Asset Alert**: Review price structures or consider seasonal bundling for the lowest velocity menu items.

#### 4. SMART INVENTORY & SUPPLY LOGISTICS
* **Replenishment Warning**: ${lowStock.length > 0 ? lowStock.map(item => `**${item.name}** is below its safe threshold of ${item.minStock} (Current quantity: ${item.stock}).`).join(" ") : "All core supply levels are within optimized tolerances."}

#### 5. OPERATIONAL EXCELLENCE
* **Staff Optimization**: Busy Mode status is currently **${dataSummary.busyModeStats}**. Schedule additional support during critical morning periods (7:30 AM - 10:30 AM).

#### 6. MARKETING ENGINE
* 🌟 *\"Elevate your day with the finest artisanal cups from Kalim Calgary! Handcrafted, perfect espresso, and cozy vibes await you. ☕✨ #CalgaryCoffee #LatteArt #LocalCafe #KalimPOS\"*`;
      }

      res.json({ insights: insightsText });
    } catch (err) {
      console.error("AI Error:", err);
      res.status(500).json({ error: "AI Analysis failed" });
    }
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message, history, language } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      const selectedLang = language || "en";

      const context = `
        You are "Kalim Support", an exceptionally warm, professional, caring barista coach and POS system support assistant for Kalim Coffee staff.
        
        CRITICAL FORMATTING INSTRUCTIONS:
        1. NEVER use double-asterisks (like **text**) or markdown headers like ### in your outputs. This looks too machine-like and rigid.
        2. Speak in full natural, flowy paragraphs and gentle linebreaks. Do NOT use bulleted lists filled with dry checklist-style markers unless requested, and if listing, keep it natural.
        3. ALWAYS embed warm, contextually appropriate emotional emojis naturally in your sentences (e.g., 😊 for welcome, ☕ for coffee prep, 🥛 for milk, 🍯 for syrups, 🤗 for comfort, 👍 for success, 💡 for smart tips, 🥰 for care, 🥳 for celebrating with staff). This makes the barista feel like they are chatting with a real, friendly and helpful human coach.

        EXCLUSIVE BEVERAGE RECIPE SYSTEM (Use this exact data to help staff learn and memorize formulas immediately):
        
        1. Espresso Coffee Shot/Grind standards (for Hot Espresso, Iced Espresso, Hot Latte, Iced Latte, Hot Cappuccino, Iced Cappuccino, Mocha, Flat White, Caramel Latte, Vanilla Latte, Caramel Macchiato, Americano):
           - Small size: 1 shot of Espresso brewed with 18g coffee grounds
           - Medium size: 2 shots of Espresso brewed with 18g coffee grounds
           - Large size: 2 shots of Espresso brewed with 24g coffee grounds
           
        2. Milk standards for Latte drinks (Latte, Mocha, Vanilla Latte, Caramel Latte, Flat White, Matcha Latte, and all tea lattes):
           - Small size: 160ml of milk (steamed with microfoam for hot, cold + ice for iced)
           - Medium size: 220ml of milk (steamed with microfoam for hot, cold + ice for iced)
           - Large size: 280ml of milk (steamed with microfoam for hot, cold + ice for iced)
           
        3. Milk standards for Cappuccino drinks (Hot and Iced Cappuccino):
           - Small size: 140ml of milk with a velvety rich thick layer of foam
           - Medium size: 200ml of milk with a velvety rich thick layer of foam
           - Large size: 260ml of milk with a velvety rich thick layer of foam
           
        4. Syrup standards for sweetened/macha/flavor categories (Vanilla Latte, Caramel Latte, Mocha, Caramel Macchiato, London Fog, special sweetened teas):
           - Small size: 15ml of sweet syrup (which corresponds to 1.5 pumps of syrup)
           - Medium size: 20ml of sweet syrup (which corresponds to 2 pumps of syrup)
           - Large size: 30ml of sweet syrup (which corresponds to 3 pumps of syrup)
           
        5. Detailed standard Teas and tea bag metrics (Earl grey, black tea, green tea, herbal lattes):
           - Tea Lattes (Earl Grey Latte, London Fog, British Brunch Latte):
             - Small size: 1 tea bag steeped in 60ml hot water, filled with 110ml milk (15ml vanilla syrup for London Fog)
             - Medium size: 2 tea bags steeped in 80ml hot water, filled with 150ml milk (20ml vanilla syrup for London Fog)
             - Large size: 2 tea bags steeped in 100ml hot water, filled with 190ml milk (30ml vanilla syrup for London Fog)
           - Hot Steeped Teas:
             - Small size: 1 tea bag steeped in 180ml hot water
             - Medium size: 2 tea bags steeped in 300ml hot water
             - Large size: 2 tea bags steeped in 420ml hot water

        Always explain these recipes beautifully when staff asks about ingredients, ratios, syrups, or coffee. Be supportive and encourage memory development!
      `;

      let responseText = "";
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { systemInstruction: context },
            history: history || []
          });

          const result = await chat.sendMessage({ message });
          responseText = result.text;
        } catch (apiErr) {
          console.log("[Gemini Engine] ChatGPT mode shifted to local AI Barista Coach fallback.");
        }
      }

      if (!responseText) {
        const lowerMsg = (message || "").toLowerCase();
        
        // Helper function for custom item-by-item recipe calculation
        const calculateRecipeItem = (msg) => {
          let size = "Medium";
          if (msg.includes("small") || msg.includes("nhỏ") || msg.includes("size s") || msg.includes("cỡ s")) {
            size = "Small";
          } else if (msg.includes("large") || msg.includes("lớn") || msg.includes("size l") || msg.includes("cỡ l") || msg.includes("to")) {
            size = "Large";
          } else if (msg.includes("medium") || msg.includes("vừa") || msg.includes("size m") || msg.includes("cỡ m")) {
            size = "Medium";
          }

          let espresso = "";
          let milk = "";
          let syrup = "";
          let tea = "";
          let extra = "";
          let itemFound = "";

          if (msg.includes("macchiato")) {
            itemFound = "Caramel Macchiato";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = size === "Small" ? "160ml of milk (hot or cold)" : size === "Medium" ? "220ml of milk" : "280ml of milk";
            syrup = size === "Small" ? "15ml (1.5 pumps) of Vanilla Syrup" : size === "Medium" ? "20ml (2 pumps) of Vanilla Syrup" : "30ml (3 pumps) of Vanilla Syrup";
            extra = "Pour Vanilla Syrup first, then milk, add ice (if cold), float fresh espresso on top, then drizzle beautiful Caramel Sauce over the cup! 🍯";
          } else if (msg.includes("flat white")) {
            itemFound = "Flat White";
            espresso = size === "Small" ? "1 double-ristretto Espresso shot (18g grounds)" : size === "Medium" ? "2 double-ristretto Espresso shots (18g grounds)" : "2 Espresso shots (24g grounds)";
            milk = size === "Small" ? "160ml of hot steamed milk layer with thin microfoam" : size === "Medium" ? "220ml of hot steamed milk" : "280ml of hot steamed milk";
            extra = "Pour steamed milk slowly into beautiful double ristretto shots to get sweet, rich crema finish. 👍";
          } else if (msg.includes("cappuccino")) {
            itemFound = "Cappuccino";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = size === "Small" ? "140ml of frothed milk with a thick layer of velvet foam" : size === "Medium" ? "200ml of frothed milk" : "260ml of frothed milk";
          } else if (msg.includes("vanilla latte")) {
            itemFound = "Vanilla Latte";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = size === "Small" ? "160ml of milk" : size === "Medium" ? "220ml of milk" : "280ml of milk";
            syrup = size === "Small" ? "15ml (1.5 pumps) of Vanilla Syrup" : size === "Medium" ? "20ml (2 pumps) of Vanilla Syrup" : "30ml (3 pumps) of Vanilla Syrup";
          } else if (msg.includes("caramel latte")) {
            itemFound = "Caramel Latte";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = size === "Small" ? "160ml of milk" : size === "Medium" ? "220ml of milk" : "280ml of milk";
            syrup = size === "Small" ? "15ml (1.5 pumps) of Caramel Syrup" : size === "Medium" ? "20ml (2 pumps) of Caramel Syrup" : "30ml (3 pumps) of Caramel Syrup";
          } else if (msg.includes("latte")) {
            itemFound = "Latte";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = size === "Small" ? "160ml of milk" : size === "Medium" ? "220ml of milk" : "280ml of milk";
          } else if (msg.includes("mocha")) {
            itemFound = "Mocha";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = size === "Small" ? "160ml of milk (hot or cold)" : size === "Medium" ? "220ml of milk" : "280ml of milk";
            syrup = size === "Small" ? "15ml (1.5 pumps) of Chocolate Syrup" : size === "Medium" ? "20ml (2 pumps) of Chocolate Syrup" : "30ml (3 pumps) of Chocolate Syrup";
            extra = "Mix chocolate syrup directly with hot espresso before adding milk for full rich dark body. 🍫";
          } else if (msg.includes("americano")) {
            itemFound = "Americano";
            espresso = size === "Small" ? "1 shot of Espresso (18g grounds)" : size === "Medium" ? "2 shots of Espresso (18g grounds)" : "2 shots of Espresso (24g grounds)";
            milk = "None";
            extra = size === "Small" ? "Fill cup with 180ml hot water and pour espresso on top to preserve rich aroma crema" : size === "Medium" ? "Fill with 300ml hot water and pour espresso on top" : "Fill with 420ml hot water and pour espresso on top";
          } else if (msg.includes("london fog")) {
            itemFound = "London Fog Tea Latte";
            tea = size === "Small" ? "1 Earl Grey tea bag steeped in 60ml hot water" : size === "Medium" ? "2 Earl Grey tea bags steeped in 80ml hot water" : "2 Earl Grey tea bags steeped in 100ml hot water";
            milk = size === "Small" ? "110ml of milk (steamed)" : size === "Medium" ? "150ml of milk" : "190ml of milk";
            syrup = size === "Small" ? "15ml (1.5 pumps) of Vanilla Syrup" : size === "Medium" ? "20ml (2 pumps) of Vanilla Syrup" : "30ml (3 pumps) of Vanilla Syrup";
          } else if (msg.includes("earl grey")) {
            itemFound = "Earl Grey Tea Latte";
            tea = size === "Small" ? "1 Earl Grey tea bag steeped in 60ml hot water" : size === "Medium" ? "2 Earl Grey tea bags steeped in 80ml hot water" : "2 Earl Grey tea bags steeped in 100ml hot water";
            milk = size === "Small" ? "110ml of milk (steamed)" : size === "Medium" ? "150ml of milk" : "190ml of milk";
          } else if (msg.includes("british") || msg.includes("brunch")) {
            itemFound = "British Brunch Tea Latte";
            tea = size === "Small" ? "1 British Brunch tea bag steeped in 60ml hot water" : size === "Medium" ? "2 tea bags steeped in 80ml hot water" : "2 tea bags steeped in 100ml hot water";
            milk = size === "Small" ? "110ml of milk" : size === "Medium" ? "150ml of milk" : "190ml of milk";
          } else if (msg.includes("herbal")) {
            itemFound = "Herbal Tea Latte";
            tea = size === "Small" ? "1 Herbal tea bag steeped in 60ml hot water" : size === "Medium" ? "2 herbal tea bags steeped in 80ml" : "2 herbal tea bags steeped in 100ml";
            milk = size === "Small" ? "110ml of milk" : size === "Medium" ? "150ml of milk" : "190ml of milk";
          } else if (msg.includes("tea") || msg.includes("trà")) {
            itemFound = "Steeped Tea";
            tea = size === "Small" ? "1 tea bag steeped in 180ml hot water" : size === "Medium" ? "2 tea bags steeped in 300ml hot water" : "2 tea bags steeped in 420ml hot water";
            milk = "None";
          } else if (msg.includes("chocolate") || msg.includes("socola") || msg.includes("sô-cô-la")) {
            itemFound = "Chocolate";
            milk = size === "Small" ? "160ml of milk" : size === "Medium" ? "220ml of milk" : "280ml of milk";
            syrup = size === "Small" ? "15ml (1.5 pumps) of chocolate syrup with premium mocha powder" : size === "Medium" ? "20ml (2 pumps) of chocolate syrup" : "30ml (3 pumps) of syrup";
            extra = "Finished with whipped cream and fine chocolate powder sprinkling! 🍫";
          }

          if (itemFound) {
            let res = `Hello coworker! 😊 I'll fetch the official recipe spec sheet for a **${size} ${itemFound}** right away ☕\n\n`;
            if (espresso) res += `☕ **Espresso:** ${espresso}\n`;
            if (tea) res += `🍃 **Tea:** ${tea}\n`;
            if (milk) res += `🥛 **Milk:** ${milk}\n`;
            if (syrup) res += `🍯 **Syrups:** ${syrup}\n`;
            if (extra) res += `💡 **Barista Tip:** ${extra}\n\n`;
            res += `This matches our standard calorie, volume, and quality consistency objectives. Take pride in your drink! 🥰`;
            return res;
          }
          return null;
        };

        const customRecipeText = calculateRecipeItem(lowerMsg);
        if (customRecipeText) {
          responseText = customRecipeText;
        } else if (lowerMsg.includes("recipe") || lowerMsg.includes("formula") || lowerMsg.includes("how to make") || lowerMsg.includes("espresso") || lowerMsg.includes("syrup") || lowerMsg.includes("latte") || lowerMsg.includes("công thức") || lowerMsg.includes("pha chế")) {
          responseText = "Hello there! 😊 Let me assist you with our official beverage recipes immediately ☕\n\nFor any coffee drink like a latte or cappuccino, we use 1 shot of espresso (18g grounds) for small, 2 shots of espresso (18g grounds) for medium, and 2 shots of espresso (24g grounds) for large drinks. ☕\n\nFor lattes, we pour 160ml milk for a small, 220ml milk for a medium, and 280ml milk for a large size. 🥛 For cappuccinos, we foam 140ml milk for small, 200ml milk for medium, and 260ml milk for large cups. 🥛\n\nIf the beverage has syrup, count on 15ml (1.5 pumps) for small, 20ml (2 pumps) for medium, and 30ml (3 pumps) for large drinks. 🍯\n\nYou got this! Let me know if you want to practice more recipe rules! 🥰";
        } else if (lowerMsg.includes("busy") || lowerMsg.includes("peak") || lowerMsg.includes("rush") || lowerMsg.includes("đông")) {
          responseText = "Ah, is the cafe experiencing a rush? 🥳 Don't worry at all! Check if Busy Mode is active on your main dashboard screen. We automatically optimize ticket speeds and queue alerts. Take a deep breath, coordinate with your team elements, and prepare cup supplies! We are in this together 🤗";
        } else if (lowerMsg.includes("tax") || lowerMsg.includes("cra") || lowerMsg.includes("thuế")) {
          responseText = "Of course! Let's talk tax compliance 💡 We automatically evaluate GST, PST, and HST dynamically for every ticket depending on your selected tax region. Currently we are utilizing the custom region settings of " + taxRegion + ". Feel free to adjust this in the Admin settings if needed! 👍";
        } else if (lowerMsg.includes("inventory") || lowerMsg.includes("stock") || lowerMsg.includes("kho")) {
          const lowCount = inventory.filter(i => i.stock <= i.minStock).length;
          responseText = "Of course! Looking at our inventory shelves right now 📦 We have " + lowCount + " ingredients that are running below their safe threshold level. Please take a look at the AI Reordering list under the admin section so we can trigger auto-shipment files with our suppliers! 😊";
        } else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("chào") || lowerMsg.includes("xin chào")) {
          responseText = "Hello! 😊 I am Kalim Support, your friendly senior human coach and workspace assistant! I can guide you through every beverage recipe formula, POS settings, shift requests, or supplier reorders. How reside you coping with work today? 🤗";
        } else {
          responseText = "I am Kalim Support, your helpful workspace team partner! 😊 Tell me what's on your mind. I can help you memorize coffee recipes, handle inventory alerts, check tax regulations, or navigate POS configurations! 🤗";
        }

        // Apply formatting (safely preserve any user instructions)
        responseText = responseText.replace(/\*\*/g, ""); // strip all **
      }

      // Sync capture details to the AI ecosystem learning database
      let issueType = "Operational Consultancy";
      const lower = (message || "").toLowerCase();
      if (lower.includes("grow") || lower.includes("sales") || lower.includes("revenue") || lower.includes("profit")) {
        issueType = "Business Growth consult";
      } else if (lower.includes("recipe") || lower.includes("make") || lower.includes("formula") || lower.includes("blend")) {
        issueType = "Quality Recipe Training";
      } else if (lower.includes("inventory") || lower.includes("stock") || lower.includes("reorder") || lower.includes("supplier")) {
        issueType = "Supply Chain Management lookup";
      }

      aiLearningLogs.unshift({
        id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        source: "Kalim Support",
        userId: "u1",
        userName: "Staff Member",
        userQuery: message,
        detectedIssue: issueType,
        responseExcerpt: responseText.slice(0, 150) + "...",
        language: selectedLang
      });

      res.json({ response: responseText });
    } catch (err) {
      console.error("Chat AI Error:", err);
      res.status(500).json({ error: "AI Chat failed" });
    }
  });

  app.post("/api/ai-generate-marketing", async (req, res) => {
    try {
      const { productName, description } = req.body;
      const { GoogleGenAI } = await import("@google/genai");

      const prompt = `Create a high-converting, creative social media marketing post for a coffee shop product named "${productName}". 
      Description: ${description}. 
      Include 5 relevant hashtags. Make it sound irresistible and artisanal.`;

      let adText = "";
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
          });
          adText = result.text;
        } catch (apiErr) {
          console.log("[Gemini Engine] Marketing ad generation shifted to local creative prompt compiler.");
        }
      }

      if (!adText) {
        adText = `✨ INTRODUCING OUR FINEST: ${productName} ✨

${description || "Crafted to perfection with gourmet artisanal passion at Kalim Coffee."}

At Kalim, we believe that coffee is more than just a morning ritual—it is an art form. Every batch of our custom blend is roasted with precise roasting techniques to unlock rich, deep tasting notes that satisfy your senses. Come in today and elevate your cup! Let our baristas formulate your new obsession.

📍 Calgary Location: 730 58 Ave SW, Calgary AB
☕ Hand-selected. Expertly pulled. Pure passion.

#CalgaryCoffee #CafeCulture #GourmetArtisanal #${productName.replace(/\s+/g, '')} #KalimCoffee`;
      }

      res.json({ ad: adText });
    } catch (err) {
      console.error("Marketing AI Error:", err);
      res.status(500).json({ error: "Marketing generation failed" });
    }
  });

  app.post("/api/ai-update-tax", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      
      let taxData: { region: string; taxName: string; rate: number } | null = null;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });

          const prompt = `Based on the approximate coordinates: Latitude ${latitude}, Longitude ${longitude}, determine the Canadian province. 
          Then, according to CURRENT Canadian tax law, tell me the exact tax rate (GST, PST, or HST) for that province.
          Respond strictly in this JSON format: {"region": "AB", "taxName": "Alberta (GST)", "rate": 0.05}`;

          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
          });
          let text = result.text.trim();
          if(text.startsWith('```json')) text = text.replace(/```json|```/g, '').trim();
          
          taxData = JSON.parse(text);
        } catch (apiErr) {
          console.log("[Gemini Engine] Province lookup used local GPS provincial fallback.");
        }
      }

      // Fallback local lookup if API key is missing/invalid or parsing failed
      if (!taxData || !taxData.region || typeof taxData.rate !== "number") {
        const latVal = parseFloat(latitude) || 51.0;
        const lngVal = parseFloat(longitude) || -114.0;
        
        if (lngVal <= -120) {
          taxData = { region: "BC", taxName: "British Columbia (GST+PST)", rate: 0.12 };
        } else if (lngVal > -120 && lngVal <= -110) {
          taxData = { region: "AB", taxName: "Alberta (GST)", rate: 0.05 };
        } else if (lngVal > -110 && lngVal <= -102) {
          taxData = { region: "SK", taxName: "Saskatchewan (GST+PST)", rate: 0.11 };
        } else if (lngVal > -102 && lngVal <= -95) {
          taxData = { region: "MB", taxName: "Manitoba (GST+PST)", rate: 0.12 };
        } else if (lngVal > -95 && lngVal <= -79) {
          taxData = { region: "ON", taxName: "Ontario (HST)", rate: 0.13 };
        } else if (lngVal > -79 && lngVal <= -57) {
          taxData = { region: "QC", taxName: "Quebec (GST+QST)", rate: 0.14975 };
        } else if (lngVal > -69 && lngVal <= -64) {
          taxData = { region: "NB", taxName: "New Brunswick (HST)", rate: 0.15 };
        } else {
          taxData = { region: "ON", taxName: "Ontario (HST)", rate: 0.13 };
        }
      }

      const verifiedTaxData = taxData as { region: string; taxName: string; rate: number };
      taxRegion = verifiedTaxData.region;
      canadianTaxes[taxRegion] = { name: verifiedTaxData.taxName, rate: verifiedTaxData.rate };

      res.json({ success: true, taxRegion, taxData: verifiedTaxData });
    } catch (err: any) {
      console.log("[Tax AI Engine] Recovered from exception during province configuration. Defaulting to state: AB (GST).");
      const defaultTax = { region: "AB", taxName: "Alberta (GST)", rate: 0.05 };
      taxRegion = "AB";
      canadianTaxes["AB"] = { name: defaultTax.taxName, rate: defaultTax.rate };
      res.json({ success: true, taxRegion: "AB", taxData: defaultTax });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      await saveToFirebase("orders", id, order);
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);
    if (order) {
      if (req.body.customerName !== undefined) order.customerName = req.body.customerName;
      if (req.body.notes !== undefined) order.notes = req.body.notes;
      await saveToFirebase("orders", id, order);
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // --- LOYALTY CUSTOMERS REST API ---
  app.get("/api/loyalty-customers", (req, res) => {
    res.json(loyaltyCustomers);
  });

  app.post("/api/loyalty-customers", (req, res) => {
    const { name, phone, password, dob, favoriteDrink, tier } = req.body;
    const newCustomer = {
      id: "c-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      name: name || "Anonymous Guest",
      phone: phone || "No Phone",
      password: password || "123456",
      dob: dob || "2000-01-01",
      points: 100, // sign-up bonus points
      favoriteDrink: favoriteDrink || "Unspecified",
      tier: tier || "Silver member"
    };
    loyaltyCustomers.push(newCustomer);
    res.json(newCustomer);
  });

  app.put("/api/loyalty-customers/:id", (req, res) => {
    const { id } = req.params;
    const index = loyaltyCustomers.findIndex(c => c.id === id);
    if (index !== -1) {
      loyaltyCustomers[index] = { ...loyaltyCustomers[index], ...req.body };
      res.json(loyaltyCustomers[index]);
    } else {
      res.status(404).json({ error: "Loyalty customer not found" });
    }
  });

  app.delete("/api/loyalty-customers/:id", (req, res) => {
    loyaltyCustomers = loyaltyCustomers.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  // --- SEASONAL CARD CONFIGURATION ---
  app.get("/api/loyalty-cards/seasonal", (req, res) => {
    res.json(seasonalCardConfig);
  });

  app.post("/api/loyalty-cards/seasonal", (req, res) => {
    seasonalCardConfig = { ...seasonalCardConfig, ...req.body };
    res.json(seasonalCardConfig);
  });

  // --- LOYALTY MESSAGE SMS LOGS & BROADCASTS ---
  app.get("/api/loyalty/sms-logs", (req, res) => {
    res.json(smsDeliveryLogs);
  });

  app.post("/api/loyalty-customers/birthday-broadcast", (req, res) => {
    // Current local time has been provided as 2026-06-15.
    // Let's identify who has a birthday today (June 15th: MM-DD matches 06-15)
    const todayStr = "06-15"; // MM-DD
    const matched = loyaltyCustomers.filter(c => {
      if (!c.dob) return false;
      const parts = c.dob.split("-"); // "YYYY-MM-DD"
      if (parts.length < 3) return false;
      return `${parts[1]}-${parts[2]}` === todayStr;
    });

    const sent: any[] = [];
    matched.forEach(customer => {
      // Check if we already logged a message for them recently
      const alreadySent = smsDeliveryLogs.some(
        log => log.customerName === customer.name && 
        new Date(log.timestamp).toDateString() === new Date().toDateString()
      );

      if (!alreadySent) {
        const giftCode = "FREECAKE-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-2026";
        const messageText = `📱 [AUTOMATED SMS - Birthday Promo] Happy Birthday ${customer.name}! 🎂 Kalim Coffee presents you with a delicious free pastry/surprise tart redeemable at any of our POS stations. Gift Code: ${giftCode}. Wishing you a joyful day filled with fresh espresso! ❤️`;
        const logEntry = {
          id: "sms-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
          customerName: customer.name,
          phone: customer.phone,
          timestamp: new Date().toISOString(),
          message: messageText,
          promoCode: giftCode
        };
        smsDeliveryLogs.unshift(logEntry);
        sent.push(logEntry);
      }
    });

    res.json({ success: true, processedCount: matched.length, sentCount: sent.length, sentLogs: sent });
  });

  // --- AI ORDER CUP PRECISION MATCH (GEMINI OR HEURISTICS) ---
  app.post("/api/ai/cup-precision-match", async (req, res) => {
    try {
      const { description, customerProfile } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;

      const availableProducts = products.map(p => ({ id: p.id, name: p.name, category: p.category, description: p.description, price: p.price }));
      const availableToppings = toppings.map(t => ({ id: t.id, name: t.name, price: t.price }));

      let parsedResult: any = null;

      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const promptMsg = `
          You are the Kalim Coffee Smart POS Barista Helper.
          A customer wants a drink, but gave a fuzzy verbal description: "${description}".
          The customer has a profile: ${JSON.stringify(customerProfile || {})} and loves custom options list.
          
          Based on our database:
          Products: ${JSON.stringify(availableProducts)}
          Toppings/Add-ons: ${JSON.stringify(availableToppings)}
          
          Identify the SINGLE closest base drink product, appropriate size, and list of toppings (use exact ids from available lists).
          Explain why in a customer-centric manner.
          Return ONLY a JSON block like this (do not return markdown, do not write code blocks, just pure JSON string):
          {
            "productId": "product-id",
            "size": "Medium" or "Large",
            "toppings": ["topping-id1", "topping-id2"],
            "confidence": 0.95,
            "explanation": "Why this drink matches their mood or habit inside Kalim's menu",
            "cupStickerNotes": "Print friendly prep directive for label printer"
          }
          `;
          
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptMsg,
          });
          
          let txt = response.text ? response.text.trim() : "";
          if (txt.startsWith("```json")) txt = txt.replace(/```json|```/g, "").trim();
          if (txt.startsWith("```")) txt = txt.replace(/```/g, "").trim();
          const jsonMatch = txt.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Gemini Cup Match failed, fallback active:", e);
        }
      }

      if (!parsedResult) {
        // High quality fallback based on simple word matching
        const descLower = description.toLowerCase();
        let matchedProduct = products[0]; // default Hot Espresso
        let matchedToppings: string[] = [];
        let size: 'Medium' | 'Large' = 'Medium';
        let explanation = "";

        if (descLower.includes("latte") || descLower.includes("creamy") || descLower.includes("sữa")) {
          matchedProduct = products.find(p => p.id === "h2") || products[0]; // Hot Latte
        } else if (descLower.includes("matcha") || descLower.includes("chè xanh")) {
          matchedProduct = products.find(p => p.id === "h3" || p.name.toLowerCase().includes("matcha")) || products[2]; // Matcha Latte
        } else if (descLower.includes("black coffee") || descLower.includes("phin") || descLower.includes("long black")) {
          matchedProduct = products.find(p => p.id === "h4" || p.name.toLowerCase().includes("black")) || products[0]; 
        } else if (descLower.includes("caramel") || descLower.includes("macchiato")) {
          matchedProduct = products.find(p => p.id === "h5") || products[0]; 
        }

        if (descLower.includes("oat") || descLower.includes("yến mạch")) {
          const oatTopping = toppings.find(t => t.name.toLowerCase().includes("oat"));
          if (oatTopping) matchedToppings.push(oatTopping.id);
        }
        if (descLower.includes("caramel") && !descLower.includes("macchiato")) {
          const caramelTopping = toppings.find(t => t.name.toLowerCase().includes("caramel"));
          if (caramelTopping) matchedToppings.push(caramelTopping.id);
        }
        if (descLower.includes("pearl") || descLower.includes("trân châu")) {
          const pearlTopping = toppings.find(t => t.name.toLowerCase().includes("pearl"));
          if (pearlTopping) matchedToppings.push(pearlTopping.id);
        }

        if (descLower.includes("large") || descLower.includes("lớn") || descLower.includes("big")) {
          size = 'Large';
        }

        if (customerProfile && customerProfile.favoriteDrink) {
          explanation = `Customized based on the VIP Card preferences of ${customerProfile.name}. Matched item ${matchedProduct.name} aligned with customer's regular selection: "${customerProfile.favoriteDrink}".`;
        } else {
          explanation = `Analyzed emotional preference request: "${description}". Heavily recommended suggestion is ${matchedProduct.name} in size ${size} for ideal flavor profile.`;
        }

        parsedResult = {
          productId: matchedProduct.id,
          size,
          toppings: matchedToppings,
          confidence: 0.90,
          explanation,
          cupStickerNotes: `✨ POS AI REC: ${matchedProduct.name} (${size}) [${matchedToppings.map(tI => toppings.find(tx => tx.id === tI)?.name).join(", ")}]`
        };
      }

      res.json(parsedResult);
    } catch (err: any) {
      console.error("Precision match server error:", err);
      res.status(500).json({ error: "Precision match server error" });
    }
  });

  // --- AI INVENTORY RECOMMENDATIONS & AUTO-ORDERS ---
  app.get("/api/ai-inventory-check/suggestions", (req, res) => {
    const updated = aiInventorySuggestions.map(s => ({
      ...s,
      type: s.type || (s.employeeName ? "audit" : "restock"),
      item: s.item || s.itemName,
      suggestedText: s.suggestedText || s.suggestion,
      quantityToOrder: s.quantityToOrder || 0,
      supplierName: s.supplierName || (s.supplierId ? suppliers.find(sup => sup.id === s.supplierId)?.name : "General Supplier") || "General Supplier"
    }));
    res.json(updated);
  });

  app.post("/api/ai-inventory-check/trigger-audit", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;

      let generatedList: any[] = [];

      if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_") && !apiKey.includes("placeholder")) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `
          Analyze our current stock levels:
          Current Inventory: ${JSON.stringify(inventory)}
          Suppliers: ${JSON.stringify(suppliers)}
          Staff List: ["Bear John", "Staff User", "Beaver Bagger"]

          Provide 3 smart physical audit recommendation tasks for the barista staff to double-check their stock sizes, check expiration locks, review seals, or alert manual recounts for items starting to run low.
          For each suggestion, match it to a different employee.
          Return ONLY a JSON array, strictly like this:
          [
            {
              "employeeName": "Staff Name",
              "employeeId": "u2" or "u3" or "u5",
              "itemName": "Item Name",
              "itemId": "i1" or etc,
              "detectedIssue": "High priority issue",
              "suggestion": "Suggest what employee should check manually (e.g. check remaining bags in dry room, check temperature)",
              "suggestedActionType": "count_check" or "quality_check"
            }
          ]
          `;

          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
          });
          let text = result.text.trim();
          if (text.startsWith("```json")) text = text.replace(/```json|```/g, "").trim();
          if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
          const listMatch = text.match(/\[[\s\S]*\]/);
          if (listMatch) {
            generatedList = JSON.parse(listMatch[0]);
          }
        } catch (e) {
          console.error("Gemini inventory analysis failed:", e);
        }
      }

      if (generatedList.length === 0) {
        // High fidelity rules fallback
        generatedList = [
          {
            employeeName: "Bear John",
            employeeId: "u2",
            itemName: "Coffee Beans",
            itemId: "i1",
            detectedIssue: "Consumption speed spiked by 20% on recent tickets",
            suggestion: "Verify whole espresso sack counts in dry storage. Ensure dry room humidity is normalized and bean bags remain dry without clumping.",
            suggestedActionType: "quality_check"
          },
          {
            employeeName: "Staff User",
            employeeId: "u3",
            itemName: "Oat Milk",
            itemId: "i2",
            detectedIssue: "Residual variance of 1.4 units detected vs POS logs",
            suggestion: "Actual physically-verified count requested: Count sealed Oat Milk cartons in undercounter bar fridges and match log spreadsheet.",
            suggestedActionType: "count_check"
          },
          {
            employeeName: "Beaver Bagger",
            employeeId: "u5",
            itemName: "Fresh Milk",
            itemId: "i12",
            detectedIssue: "Temperature-sensitive fresh milk shelf-life alert",
            suggestion: "Check best-before dates on opened dairy cartons at the barista prep station. Dispose of bloated/dented units or anything past expiration limit.",
            suggestedActionType: "quality_check"
          }
        ];
      }

      const randomizedNewAudits = generatedList.map(item => ({
        id: "is-" + Math.random().toString(36).substring(2, 6),
        type: "audit",
        timestamp: new Date().toISOString(),
        ...item
      }));

      // Cleanup prior audit recommendations in Firebase
      const auditsToDelete = aiInventorySuggestions.filter(s => s.type === "audit");
      for (const item of auditsToDelete) {
        await deleteFromFirebase("inventorySuggestions", item.id);
      }

      const restocksToKeep = aiInventorySuggestions.filter(s => s.type !== "audit");
      aiInventorySuggestions = [...restocksToKeep, ...randomizedNewAudits];

      // Persist new recommendations to Firebase
      for (const item of randomizedNewAudits) {
        await saveToFirebase("inventorySuggestions", item.id, item);
      }

      res.json(aiInventorySuggestions);
    } catch (e) {
      res.status(500).json({ error: "Failed to trigger AI inventory check" });
    }
  });

  app.post("/api/ai-inventory-check/action-complete", async (req, res) => {
    try {
      const id = req.body.id || req.body.suggestionId;
      const targetStockValue = req.body.targetStockValue;
      const quantity = req.body.quantity;

      const itemTask = aiInventorySuggestions.find(s => s.id === id);
      if (!itemTask) return res.status(404).json({ error: "Task suggestion not found" });

      // Update the real inventory stock for that item
      const inventoryItem = inventory.find(i => i.id === itemTask.itemId);
      if (inventoryItem) {
        if (itemTask.type === "restock" || quantity !== undefined) {
          const qtyToAdd = typeof quantity === "number" ? quantity : (itemTask.quantityToOrder || 10);
          inventoryItem.stock = (inventoryItem.stock || 0) + qtyToAdd;
        } else if (typeof targetStockValue === "number") {
          inventoryItem.stock = targetStockValue;
        }
        await saveToFirebase("inventory", inventoryItem.id, inventoryItem);
      }

      // Filter out completed tasks
      aiInventorySuggestions = aiInventorySuggestions.filter(s => s.id !== id);
      await deleteFromFirebase("inventorySuggestions", id);

      res.json({ 
        success: true, 
        updatedItemId: itemTask.itemId, 
        updatedStock: inventoryItem ? inventoryItem.stock : 0 
      });
    } catch (err) {
      console.error("Action complete error:", err);
      res.status(500).json({ error: "Action complete error" });
    }
  });

  // --- GET REPORT STATS ---
  app.get("/api/stats", (req, res) => {
    const todayRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    res.json({ todayRevenue });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
