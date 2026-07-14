import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Layers, 
  Terminal, 
  Wifi, 
  WifiOff, 
  Battery, 
  ChevronRight, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Copy, 
  Check, 
  ShoppingBag, 
  User, 
  Volume2, 
  Sliders, 
  FileCode, 
  Clock, 
  Database, 
  TrendingUp, 
  Settings, 
  Coffee,
  CheckCircle2,
  RefreshCw,
  Edit2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  isNew?: boolean;
}

interface Topping {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  product?: Product;
  toppings?: string[];
  notes?: string;
  milkType?: string;
  iceLevel?: string;
  sweetness?: string;
}

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'Wait' | 'Preparing' | 'Ready';
  estimatedTime: number;
  createdAt: string;
  notes?: string;
  tipAmount?: number;
  source?: string;
  paymentMethod?: string;
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  pin: string;
  employeeId: string;
  permissions: string[];
}

interface TimeStamp {
  id: string;
  userId: string;
  employeeId: string;
  userName: string;
  type: 'in' | 'out';
  timestamp: string;
  location?: string;
}

interface IosSwiftUiSimulatorProps {
  products: Product[];
  toppings: Topping[];
  orders: Order[];
  users: User[];
  timeClock: TimeStamp[];
  isOnline: boolean;
  currency: string;
  fetchData: () => Promise<void>;
}

// Structuring simulated synchronization log packets
interface SyncPacket {
  id: string;
  timestamp: string;
  direction: 'OUT' | 'IN';
  type: 'REST_API' | 'WEBSOCKET' | 'FIRESTORE';
  endpoint: string;
  payload: string;
  status: 'SUCCESS' | 'PENDING' | 'ERROR';
}

export default function IosSwiftUiSimulator({
  products: rawProducts,
  toppings: rawToppings,
  orders: rawOrders,
  users: rawUsers,
  timeClock: rawTimeClock,
  isOnline,
  currency,
  fetchData
}: IosSwiftUiSimulatorProps) {
  // Defensive fallback sanitization for robust rendering
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const toppings = Array.isArray(rawToppings) ? rawToppings : [];
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const users = Array.isArray(rawUsers) ? rawUsers : [];
  const timeClock = Array.isArray(rawTimeClock) ? rawTimeClock : [];
  // Device Configuration State
  const [deviceType, setDeviceType] = useState<'ipad' | 'iphone'>('ipad');
  const [activeScreen, setActiveScreen] = useState<'cashier' | 'bar' | 'command'>('cashier');
  const [workspaceTab, setWorkspaceTab] = useState<'simulator' | 'code' | 'sync'>('simulator');
  const [selectedSwiftFile, setSelectedSwiftFile] = useState<'Models' | 'POSViewModel' | 'Views' | 'APIService' | 'CloudAPIService'>('POSViewModel');
  
  const tipOptions = currency === 'VND' ? [5000, 10000, 20000] : [1, 2, 5];
  
  // App States inside Simulated SwiftUI iOS POS App
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Customization modal (SwiftUI configuration sheet)
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
  const [customization, setCustomization] = useState<{
    size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
    milkType: string;
    iceLevel: string;
    sweetness: string;
    selectedToppings: string[];
    notes: string;
    quantity: number;
  }>({
    size: 'Medium',
    milkType: 'Whole Milk',
    iceLevel: 'Regular',
    sweetness: 'Regular',
    selectedToppings: [],
    notes: '',
    quantity: 1
  });

  // Long press name-editing simulation (Faithful replica of SwiftUI_Reference.swift editable text)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductNameValue, setEditingProductNameValue] = useState<string>('');
  
  // Checkout sheet
  const [showCheckoutSheet, setShowCheckoutSheet] = useState<boolean>(false);
  const [checkoutName, setCheckoutName] = useState<string>('');
  const [checkoutPhone, setCheckoutPhone] = useState<string>('');
  const [tipSelection, setTipSelection] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [paymentDoneMessage, setPaymentDoneMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Sound Synth and Push notifications
  const [pushNotification, setPushNotification] = useState<{ title: string; body: string } | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncPacket[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Active sync indicators
  const [activeOperator, setActiveOperator] = useState<TimeStamp | null>(null);
  const prevTimeClockLength = useRef(timeClock.length);

  // Track checked-in employees in Staff Connect to bind as POS Active operators
  useEffect(() => {
    const checkins = [...timeClock]
      .filter(tc => tc.type === 'in')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Find if the latest checkin doesn't have a corresponding check-out yet
    const activeOp = checkins.find(cin => {
      const checkout = [...timeClock].find(cout => cout.userId === cin.userId && cout.type === 'out' && new Date(cout.timestamp).getTime() > new Date(cin.timestamp).getTime());
      return !checkout;
    });

    setActiveOperator(activeOp || null);

    // If new check-in occurred, trigger dynamic push notification on the iPad
    if (timeClock.length > prevTimeClockLength.current) {
      const latest = timeClock[timeClock.length - 1];
      if (latest && latest.type === 'in') {
        triggerNotification(
          "🔔 iOS Staff Connection Push",
          `${latest.userName} has Clocked In via Kalim Staff Connect! POS Operator updated.`
        );
        logSyncPacket('IN', 'WEBSOCKET', 'broadcast/timeclock', JSON.stringify(latest));
      } else if (latest && latest.type === 'out') {
        triggerNotification(
          "🔔 iOS Staff Connection Push",
          `${latest.userName} has Clocked Out. Active operator removed.`
        );
        logSyncPacket('IN', 'WEBSOCKET', 'broadcast/timeclock', JSON.stringify(latest));
      }
      prevTimeClockLength.current = timeClock.length;
    }
  }, [timeClock]);

  // Audio synthesis feedback
  const playIOSSound = (type: 'lock' | 'unlock' | 'sent' | 'notif' | 'error' | 'click') => {
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = actx.createOscillator();
      const gainNode = actx.createGain();
      osc.connect(gainNode);
      gainNode.connect(actx.destination);

      if (type === 'unlock') {
        osc.frequency.setValueAtTime(523.25, actx.currentTime); // C5
        gainNode.gain.setValueAtTime(0.04, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.1);
        setTimeout(() => {
          const osc2 = actx.createOscillator();
          const gain2 = actx.createGain();
          osc2.connect(gain2);
          gain2.connect(actx.destination);
          osc2.frequency.setValueAtTime(659.25, actx.currentTime); // E5
          gain2.gain.setValueAtTime(0.03, actx.currentTime);
          osc2.start();
          osc2.stop(actx.currentTime + 0.15);
        }, 100);
      } else if (type === 'notif') {
        osc.frequency.setValueAtTime(1046.50, actx.currentTime); // C6
        gainNode.gain.setValueAtTime(0.05, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.1);
        setTimeout(() => {
          const osc2 = actx.createOscillator();
          const gain2 = actx.createGain();
          osc2.connect(gain2);
          gain2.connect(actx.destination);
          osc2.frequency.setValueAtTime(1318.51, actx.currentTime); // E6
          gain2.gain.setValueAtTime(0.04, actx.currentTime);
          osc2.start();
          osc2.stop(actx.currentTime + 0.12);
        }, 80);
      } else if (type === 'sent') {
        osc.frequency.setValueAtTime(880, actx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.06, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.3);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, actx.currentTime);
        gainNode.gain.setValueAtTime(0.08, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.25);
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(1200, actx.currentTime);
        gainNode.gain.setValueAtTime(0.02, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.02);
      }
    } catch {
      // Ignored if unsupported
    }
  };

  // Push notifications
  const triggerNotification = (title: string, body: string) => {
    playIOSSound('notif');
    setPushNotification({ title, body });
    setTimeout(() => {
      setPushNotification(null);
    }, 6000);
  };

  // Sync Packet Logger
  const logSyncPacket = (
    direction: 'OUT' | 'IN',
    type: 'REST_API' | 'WEBSOCKET' | 'FIRESTORE',
    endpoint: string,
    payload: string,
    status: 'SUCCESS' | 'PENDING' | 'ERROR' = 'SUCCESS'
  ) => {
    const p: SyncPacket = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      type,
      endpoint,
      payload,
      status
    };
    setSyncHistory(prev => [p, ...prev].slice(0, 50));
  };

  // Calculate pricing
  const getItemSinglePrice = (item: OrderItem) => {
    let base = item.product?.price || 0;
    // Size offsets conformant to pricing laws
    if (item.size === 'Large') base += currency === 'VND' ? 10000 : 1.00;
    if (item.size === 'Extra Large') base += currency === 'VND' ? 15000 : 1.50;
    if (item.size === 'Small') base -= currency === 'VND' ? 5000 : 0.50;

    // Toppings cost accumulators
    if (item.toppings && item.toppings.length > 0) {
      item.toppings.forEach(tId => {
        const top = toppings.find(t => t.id === tId);
        if (top) {
          base += top.price;
        }
      });
    }

    // Milk premium milk modifiers
    if (item.milkType && item.milkType !== 'Whole Milk' && item.milkType !== 'None') {
      base += currency === 'VND' ? 10000 : 1.00;
    }

    return base;
  };

  // Custom configuration additions to cart
  const handleAddConfiguredProduct = () => {
    if (!configuringProduct) return;
    playIOSSound('click');

    const item: OrderItem = {
      productId: configuringProduct.id,
      quantity: customization.quantity,
      size: customization.size,
      product: configuringProduct,
      toppings: [...customization.selectedToppings],
      milkType: customization.milkType,
      iceLevel: customization.iceLevel,
      sweetness: customization.sweetness,
      notes: customization.notes
    };

    setCart(prev => [...prev, item]);
    
    // Out packet tracking
    logSyncPacket(
      'OUT', 
      'FIRESTORE', 
      'local/cart-state', 
      JSON.stringify({ action: 'add_item', item: { ...item, product: undefined } })
    );

    // Clean states
    setConfiguringProduct(null);
    setCustomization({
      size: 'Medium',
      milkType: 'Whole Milk',
      iceLevel: 'Regular',
      sweetness: 'Regular',
      selectedToppings: [],
      notes: '',
      quantity: 1
    });

    triggerNotification(
      "🛒 Added to iOS Cart",
      `${item.quantity}x ${configuringProduct.name} customized successfully.`
    );
  };

  // Remove items
  const handleRemoveCartItem = (idx: number) => {
    playIOSSound('click');
    const removedItem = cart[idx];
    setCart(prev => prev.filter((_, i) => i !== idx));

    logSyncPacket(
      'OUT',
      'FIRESTORE',
      'local/cart-state',
      JSON.stringify({ action: 'remove_item', index: idx })
    );

    if (removedItem?.product) {
      triggerNotification("🗑️ Item Removed", `${removedItem.product.name} removed from iOS checkout cart.`);
    }
  };

  // Submit complete checkout request to Server API (sync back-and-forth)
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutName.trim()) {
      playIOSSound('error');
      alert("Please provide the customer name!");
      return;
    }

    setIsProcessingPayment(true);
    playIOSSound('click');

    const orderSubtotal = cart.reduce((acc, curr) => acc + (getItemSinglePrice(curr) * curr.quantity), 0);
    const finalTotal = orderSubtotal + Number(tipSelection);

    // Preparing synchronization payload
    const payload = {
      customerInfo: {
        name: checkoutName,
        phone: checkoutPhone
      },
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        toppings: item.toppings || [],
        notes: item.notes || '',
        milkType: item.milkType || 'Whole Milk',
        iceLevel: item.iceLevel || 'Regular',
        sweetness: item.sweetness || 'Regular'
      })),
      tipAmount: Number(tipSelection),
      paymentMethod: paymentMethodSelector,
      notes: checkoutNotes,
      source: "SwiftUI iOS App"
    };

    logSyncPacket('OUT', 'REST_API', 'POST /api/orders', JSON.stringify(payload), 'PENDING');

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("HTTP connection error");
      }

      const resData = await res.json();
      
      logSyncPacket('IN', 'REST_API', 'POST /api/orders', JSON.stringify(resData), 'SUCCESS');
      logSyncPacket('IN', 'WEBSOCKET', 'broadcast/NEW_ORDER', JSON.stringify({ type: "NEW_ORDER", order: resData }), 'SUCCESS');

      playIOSSound('sent');
      setPaymentDoneMessage(tipSelection >= (currency === 'VND' ? 20000 : 5) 
        ? "Wow! Thank you for your amazing generosity! ❤️" 
        : "Payment successful! Thank you very much!"
      );
      
      // Sync database view
      await fetchData();

      // Notify external Connect hub
      triggerNotification("🔔 Kalim Core Synchronized", `Order ${resData.id || "POS-Order"} placed. Synced live to Staff connect bar monitor!`);

      // Clear checkout/cart state
      setCart([]);
      setCheckoutName('');
      setCheckoutPhone('');
      setTipSelection(0);
      setCheckoutNotes('');
    } catch {
      playIOSSound('error');
      logSyncPacket('OUT', 'REST_API', 'POST /api/orders', "Timeout network bypass - local database offline cache queue active", 'ERROR');
      
      // offline fallback simulation
      triggerNotification("⚠️ POS Offline Cache Engaged", "Unable to hit server. Order stored locally in CoreData SQLite queue.");
      alert("Connect network warning. Cache queued.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const [paymentMethodSelector, setPaymentMethodSelector] = useState('Apple Pay 🍏');

  // Multi-gesture product name edit simulation (conforming to EditableText in SwiftUI_Reference.swift)
  const handleCommitProductNameChange = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    playIOSSound('click');

    const updatePlay = { name: newName };
    logSyncPacket('OUT', 'REST_API', `PUT /api/products/${id}`, JSON.stringify(updatePlay), 'PENDING');

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePlay)
      });

      if (res.ok) {
        const resData = await res.json();
        logSyncPacket('IN', 'REST_API', `PUT /api/products/${id}`, JSON.stringify(resData), 'SUCCESS');
        triggerNotification("✏️ iOS Name Updated", `Product updated: ${newName}`);
        setEditingProductId(null);
        await fetchData(); // Refresh core view
      } else {
        throw new Error("Server rejected modification");
      }
    } catch (e: any) {
      logSyncPacket('OUT', 'REST_API', `PUT /api/products/${id}`, `Error: ${e.message}`, 'ERROR');
      playIOSSound('error');
      alert("Failed to sync name modifier back to cloud server.");
    }
  };

  // Direct toggle mock order statuses from iOS POS
  const handleToggleSimulatedOrderStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: 'Wait' | 'Preparing' | 'Ready' = 'Wait';
    if (currentStatus === 'Wait') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else return;

    playIOSSound('click');
    logSyncPacket('OUT', 'REST_API', `POST /api/orders/${orderId}/status`, JSON.stringify({ status: nextStatus }), 'PENDING');

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        const resData = await res.json();
        logSyncPacket('IN', 'REST_API', `POST /api/orders/${orderId}/status`, JSON.stringify(resData), 'SUCCESS');
        triggerNotification("🔄 Order Status Updated", `Order ${orderId.substring(0, 6)} is now ${nextStatus}`);
        await fetchData();
      }
    } catch {
      playIOSSound('error');
    }
  };

  // Categories helper
  const uniqueCategories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartSubtotal = cart.reduce((acc, curr) => acc + (getItemSinglePrice(curr) * curr.quantity), 0);

  // Copy code helper
  const handleCopyCode = () => {
    const codeContent = getSwiftCode();
    navigator.clipboard.writeText(codeContent);
    setCopiedCode(true);
    playIOSSound('unlock');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getSwiftCode = () => {
    if (selectedSwiftFile === 'Models') {
      return `import Foundation

// MARK: - Core POS Domain Models Conforming to iOS Standards
struct Product: Identifiable, Codable {
    let id: String
    let name: String
    let category: String
    let price: Double
    let image: String
    let description: String?
}

struct Topping: Identifiable, Codable {
    let id: String
    let name: String
    let price: Double
}

struct OrderItem: Identifiable, Codable {
    var id = UUID()
    let productId: String
    let quantity: Int
    let size: String
    var product: Product?
    var toppings: [String] = []
    var milkType: String = "Whole Milk"
    var iceLevel: String = "Regular"
    var sweetness: String = "Regular"
    var notes: String = ""
    
    enum CodingKeys: String, CodingKey {
        case productId, quantity, size, toppings, milkType, iceLevel, sweetness, notes
    }
}

struct Order: Identifiable, Codable {
    let id: String
    let customerName: String
    let items: [OrderItem]
    let totalPrice: Double
    var status: String // "Wait" | "Preparing" | "Ready"
    let estimatedTime: Int
    let createdAt: String
    var notes: String?
    var tipAmount: Double?
    var source: String?
}`;
    } else if (selectedSwiftFile === 'POSViewModel') {
      return `import Foundation
import Combine

// MARK: - POS Operations View Model with Pipeline Sync
class POSViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var toppings: [Topping] = []
    @Published var orders: [Order] = []
    @Published var cart: [OrderItem] = []
    @Published var activeOperator: String = "No Clerk Connected"
    
    @Published var isSyncing: Bool = false
    @Published var syncError: String? = nil
    
    private var cancellables = Set<AnyCancellable>()
    private let apiService = APIService.shared
    
    init() {
        fetchInitialData()
        setupWebSocketListener()
    }
    
    func fetchInitialData() {
        self.isSyncing = true
        
        Publishers.Zip3(
            apiService.fetchProducts(),
            apiService.fetchToppings(),
            apiService.fetchOrders()
        )
        .receive(on: DispatchQueue.main)
        .sink { completion in
            self.isSyncing = false
            if case .failure(let err) = completion {
                self.syncError = err.localizedDescription
            }
        } receiveValue: { products, toppings, orders in
            self.products = products
            self.toppings = toppings
            self.orders = orders
            self.syncError = nil
        }
        .store(in: &cancellables)
    }
    
    func addToCart(product: Product, quantity: Int, size: String, toppings: [String], milk: String, ice: String, sweet: String, notes: String) {
        let item = OrderItem(
            productId: product.id,
            quantity: quantity,
            size: size,
            product: product,
            toppings: toppings,
            milkType: milk,
            iceLevel: ice,
            sweetness: sweet,
            notes: notes
        )
        self.cart.append(item)
    }
    
    func placeOrder(customerName: String, phone: String, tip: Double, notes: String, payment: String) {
        guard !cart.isEmpty else { return }
        self.isSyncing = true
        
        let orderPayload = Order(
            id: "", // Server handles UUID
            customerName: customerName,
            items: cart,
            totalPrice: cart.reduce(0) { $0 + (Double($1.quantity) * ($1.product?.price ?? 0)) } + tip,
            status: "Wait",
            estimatedTime: cart.count * 3,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            notes: notes,
            tipAmount: tip,
            source: "iOS Swift POS"
        )
        
        apiService.submitOrder(orderPayload)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                self.isSyncing = false
                if case .failure(let err) = completion {
                    self.syncError = "Checkout Failed: \\(err.localizedDescription)"
                }
            } receiveValue: { newOrder in
                self.orders.append(newOrder)
                self.cart.removeAll()
                self.syncError = nil
            }
            .store(in: &cancellables)
    }
    
    private func setupWebSocketListener() {
        // Integrates Real-time triggers from Staff Portal backend
        apiService.webSocketPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] message in
                self?.handleIncomingSocketPayload(message)
            }
            .store(in: &cancellables)
    }
    
    private func handleIncomingSocketPayload(_ json: String) {
        // Decodes and processes live clock-ins or cancel hooks from Kalim Staff Portal
    }
}`;
    } else if (selectedSwiftFile === 'Views') {
      return `import SwiftUI

// MARK: - SwiftUI Product POS Grid screen
struct CashierView: View {
    @ObservedObject var viewModel: POSViewModel
    @State private var selectedCategory: String = "All"
    @State private var searchKeywords: String = ""
    @State private var showCheckoutSheet: Bool = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // SwiftUI Glassmorphic Operations Info Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Kalim Coffee Mobile")
                            .font(.title2).bold()
                        Text("Clerk: \\(viewModel.activeOperator)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    DatePicker("", selection: .constant(Date()), displayedComponents: .date)
                        .labelsHidden()
                }
                .padding()
                .background(Color(.systemBackground).edgesIgnoringSafeArea(.top))
                
                // SwiftUI Categories horizontal list
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(viewModel.categories, id: \\.self) { cat in
                            Button(action: { selectedCategory = cat }) {
                                Text(cat)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == cat ? Color.black : Color(.systemGray6))
                                    .foregroundColor(selectedCategory == cat ? .white : .black)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Grid Content
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        ForEach(viewModel.products.filter { selectedCategory == "All" || $0.category == selectedCategory }) { prod in
                            ProductCardView(product: prod) {
                                // Add config custom sheet trigger
                            }
                        }
                    }
                    .padding()
                }
                
                // Bottom Apple Pay Bar
                if !viewModel.cart.isEmpty {
                    VStack(spacing: 12) {
                        HStack {
                            Text("Total Items: \\(viewModel.cart.count)").font(.caption)
                            Spacer()
                            Text("\\((viewModel.cartSubtotal/1000).formatted())k VND").font(.title3).bold()
                        }
                        Button(action: { showCheckoutSheet = true }) {
                            Text("PROCEED TO CHECKOUT")
                                .bold()
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.black)
                                .cornerRadius(16)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .shadow(radius: 5)
                }
            }
        }
    }
}`;
    } else if (selectedSwiftFile === 'APIService') {
      return `import Foundation
import Combine

// MARK: - Synchronous Swift REST and Socket Pipeline connection API
class APIService {
    static let shared = APIService()
    private let baseURL = URL(string: "http://127.0.0.1:3000/api")!
    
    // WebSocket endpoint pipelines
    var webSocketPublisher = PassthroughSubject<String, Never>()
    private var webSocketTask: URLSessionWebSocketTask?
    
    func fetchProducts() -> AnyPublisher<[Product], Error> {
        let url = baseURL.appendingPathComponent("products")
        return URLSession.shared.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: [Product].self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
    
    func submitOrder(_ order: Order) -> AnyPublisher<Order, Error> {
        let url = baseURL.appendingPathComponent("orders")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(order)
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: Order.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
    
    func connectWebSocket() {
        let session = URLSession(configuration: .default)
        let wsURL = URL(string: "ws://127.0.0.1:3000")!
        webSocketTask = session.webSocketTask(with: wsURL)
        webSocketTask?.resume()
        
        listenForSocketPayloads()
    }
    
    private func listenForSocketPayloads() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.webSocketPublisher.send(text)
                default:
                    break
                }
                self?.listenForSocketPayloads() // Recursively listen of events
            case .failure(let error):
                print("Socket disconnect: \(error.localizedDescription)")
            }
        }
    }
}`;
    } else {
      return `import Foundation

// MARK: - Cloud Functions API Integrations (SwiftUI / iOS Client)
// Định dạng Endpoint: https://<region>-<project-id>.cloudfunctions.net/handleAppCommunication

struct CloudPayload: Codable {
    let action: String
    let senderId: String
    let data: [String: String]
}

struct CloudResponse: Codable {
    let success: Bool
    let message: String
    let timestamp: String
    let result: ProcessResult?
    
    struct ProcessResult: Codable {
        let status: String
        let note: String?
    }
}

class CloudAPIService {
    static let shared = CloudAPIService()
    
    // Đổi URL này thành URL của Cloud Function thực tế của bạn
    private let functionURL = URL(string: "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/handleAppCommunication")!
    
    /// Gửi một yêu cầu (API Request-Response) tới Firebase Cloud Function
    /// - Parameters:
    ///   - action: Tên tác vụ xử lý (Ví dụ: "verify_clock_in")
    ///   - senderId: ID của nhân viên hoặc khách hàng gửi yêu cầu
    ///   - requestData: Thông tin dữ liệu đi kèm (Ví dụ: tọa độ GPS, thời gian...)
    ///   - completion: Trả kết quả thành công hoặc lỗi về cho UI xử lý
    func sendRequest(action: String, senderId: String, requestData: [String: String], completion: @escaping (Result<CloudResponse, Error>) -> Void) {
        var request = URLRequest(url: functionURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload = CloudPayload(action: action, senderId: senderId, data: requestData)
        
        do {
            request.httpBody = try JSONEncoder().encode(payload)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(error))
                    return
                }
                
                guard let data = data else {
                    let noDataError = NSError(domain: "CloudAPI", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])
                    completion(.failure(noDataError))
                    return
                }
                
                do {
                    let decoder = JSONDecoder()
                    let responseData = try decoder.decode(CloudResponse.self, from: data)
                    completion(.success(responseData))
                } catch {
                    completion(.failure(error))
                }
            }
        }.resume()
    }
}

// MARK: - Cách tích hợp vào Button trong SwiftUI
/*
struct ClockInView: View {
    @State private var isLoading = false
    @State private var alertMessage = ""
    @State private var showAlert = false
    
    var body: some View {
        Button(action: {
            self.isLoading = true
            CloudAPIService.shared.sendRequest(
                action: "verify_clock_in",
                senderId: "EMP001",
                requestData: ["lat": "10.762622", "lng": "106.660172", "location": "Kalim Coffee Store 1"]
            ) { result in
                self.isLoading = false
                switch result {
                case .success(let response):
                    if response.success {
                        self.alertMessage = "Thành công: \\(response.message) - Trạng thái: \\(response.result?.status ?? "")"
                    } else {
                        self.alertMessage = "Thất bại: \\(response.message)"
                    }
                case .failure(let error):
                    self.alertMessage = "Lỗi kết nối: \\(error.localizedDescription)"
                }
                self.showAlert = true
            }
        }) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .padding(.trailing, 5)
                }
                Text("XÁC NHẬN ĐIỂM DANH (MOBILE)")
                    .font(.subheadline)
                    .bold()
            }
            .foregroundColor(.white)
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.black)
            .cornerRadius(14)
        }
        .disabled(isLoading)
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Trạng Thái Hệ Thống"), message: Text(alertMessage), dismissButton: .default(Text("OK")))
        }
    }
}
*/`;
    }
  };

  return (
    <div className="bg-[#121216] p-4 lg:p-6 rounded-3xl border border-white/5 space-y-6 text-white overflow-hidden shadow-2xl">
      {/* Upper Status Ribbon */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white">
              <Smartphone size={20} />
            </span>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                Kalim Swift POS SDK Sandbox 📱
              </h2>
              <p className="text-xs text-neutral-400">
                Operates full-stack SwiftUI architecture. Generates Swift Xcode sources & simulates bi-directional packets context!
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status Hud */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/5 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeOperator ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeOperator ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-mono text-neutral-300">
              {activeOperator ? `Active: ${activeOperator.userName}` : 'No Clerk Logged In'} 
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/5 text-[11px]">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold"><Wifi size={12}/> Live Connect</span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-bold"><WifiOff size={12}/> SQLite Local Cache</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Interface Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Selector sidebar for coding / logging */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-neutral-900/60 p-1.5 rounded-2xl flex border border-white/5 justify-between">
            <button 
              onClick={() => { playIOSSound('click'); setWorkspaceTab('simulator'); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${workspaceTab === 'simulator' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <Smartphone size={14} /> Device Control
            </button>
            <button 
              onClick={() => { playIOSSound('click'); setWorkspaceTab('code'); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${workspaceTab === 'code' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <FileCode size={14} /> Xcode Swift Files
            </button>
            <button 
              onClick={() => { playIOSSound('click'); setWorkspaceTab('sync'); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${workspaceTab === 'sync' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <Terminal size={14} /> Sync Pipeline ({syncHistory.length})
            </button>
          </div>

          {/* Tab 1: Device Controller Panel */}
          {workspaceTab === 'simulator' && (
            <div className="bg-neutral-900 p-4 rounded-3xl border border-white/5 space-y-4">
              <h3 className="font-extrabold text-xs text-neutral-400 tracking-wider font-mono">SANDBOX CONFIGURATION</h3>
              
              {/* App Operator state binder details */}
              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">Dynamic Operator Bind</span>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-neutral-300">Staff Connect Active User:</span>
                  <span className="text-xs text-indigo-400 font-extrabold">{activeOperator?.userName || 'Offline Queue Mode'}</span>
                </div>
                <div className="text-[10px] text-neutral-500 leading-normal">
                  *When baristas Clock-In/Out in the Staff Connect Portal (NFC tap, QR scanner or GPS geofence), this SDK client automatically binds active credentials and relays push logs.
                </div>
              </div>

              {/* Layout ratios switchers */}
              <div className="space-y-2">
                <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">Simulated Device Ratio</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { playIOSSound('unlock'); setDeviceType('ipad'); }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${deviceType === 'ipad' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500' : 'bg-neutral-950 text-neutral-400 border-white/5 hover:text-white'}`}
                  >
                    iPad Pro Landscape (POS Mode)
                  </button>
                  <button 
                    onClick={() => { playIOSSound('unlock'); setDeviceType('iphone'); }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${deviceType === 'iphone' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500' : 'bg-neutral-950 text-neutral-400 border-white/5 hover:text-white'}`}
                  >
                    iPhone 15 Pro Portrait (Mobile client)
                  </button>
                </div>
              </div>

              {/* Swift compiler instructions */}
              <div className="p-3.5 bg-indigo-950/20 rounded-2xl border border-indigo-500/10 space-y-1.5">
                <span className="text-xs font-extrabold text-indigo-400 flex items-center gap-1">🚀 Compile to iPad or iPhone Device:</span>
                <p className="text-[11px] text-neutral-300 leading-normal">
                  To load as a physical app, create a new <b>SwiftUI Multiplatform Single View App</b> target in Xcode, enable <b>Network connection capability</b> in Entitlements, copy the files from Xcode tab, build, and deploy. Real-time updates automatically map.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Code Explorer */}
          {workspaceTab === 'code' && (
            <div className="bg-neutral-900 p-4 rounded-3xl border border-white/5 flex flex-col h-[550px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-xs text-neutral-400 tracking-wider font-mono">SWIFTUI SOURCES</h3>
                <button 
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-[11px] bg-neutral-800 text-neutral-300 rounded-lg flex items-center gap-1 hover:bg-neutral-700"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-400"/> : <Copy size={11}/>}
                  {copiedCode ? 'Copied' : 'Copy swift Code'}
                </button>
              </div>

              {/* Selector for Files */}
              <div className="grid grid-cols-5 gap-1 mb-3 bg-neutral-950 p-1 rounded-xl border border-white/5">
                {(['Models', 'POSViewModel', 'Views', 'APIService', 'CloudAPIService'] as const).map(file => (
                  <button 
                    key={file}
                    onClick={() => { playIOSSound('click'); setSelectedSwiftFile(file); }}
                    className={`py-1 rounded-lg text-[9px] font-bold transition-all ${selectedSwiftFile === file ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    {file}.swift
                  </button>
                ))}
              </div>

              {/* Pre code area */}
              <div className="flex-1 overflow-y-auto bg-neutral-950 p-3 rounded-2xl border border-white/5 text-[10px] font-mono leading-relaxed text-indigo-300 select-all scrollbar-thin">
                <pre>{getSwiftCode()}</pre>
              </div>
            </div>
          )}

          {/* Tab 3: Logging HUD */}
          {workspaceTab === 'sync' && (
            <div className="bg-neutral-900 p-4 rounded-3xl border border-white/5 flex flex-col h-[550px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-xs text-neutral-400 tracking-wider font-mono flex items-center gap-1.5">
                  <Database size={12}/> LIVE REST & WS TELEMETRY
                </h3>
                <button 
                  onClick={() => { playIOSSound('unlock'); setSyncHistory([]); }}
                  className="text-[10px] font-extrabold text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 rounded-lg"
                >
                  Clear logs
                </button>
              </div>

              {/* Log wrapper */}
              <div className="flex-1 overflow-y-auto space-y-2 bg-neutral-950 p-3 rounded-2xl border border-white/5 h-[400px]">
                {syncHistory.length === 0 ? (
                  <div className="text-[11px] text-neutral-600 font-mono text-center pt-24">
                    -- Listening for outbound SwiftUI clicks and Staff Connect state transitions --
                  </div>
                ) : (
                  syncHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-2 rounded-lg border text-[10px] font-mono space-y-1.5 transition-all ${item.direction === 'OUT' ? 'bg-indigo-950/20 border-indigo-500/10' : 'bg-emerald-950/10 border-emerald-500/10'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`px-1.5 py-0.5 text-[8px] font-black rounded ${item.direction === 'OUT' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-black'}`}>
                          {item.direction}
                        </span>
                        <span className="text-[9px] text-neutral-500">{item.timestamp}</span>
                      </div>
                      <div className="text-neutral-400 text-[9px] font-semibold break-all">
                        <span className="text-indigo-400 font-bold">[{item.type}]</span> {item.endpoint}
                      </div>
                      <div className="text-[8px] text-neutral-550 leading-relaxed bg-black/40 p-1.5 rounded border border-white/5 break-words">
                        {item.payload}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Physical device mockup rendering SwiftUI layout */}
        <div className="lg:col-span-7 flex justify-center items-center">
          
          {/* Main simulator casing frame */}
          <div className="relative w-full flex justify-center py-4">
            
            {/* iOS push notification overlay */}
            <AnimatePresence>
              {pushNotification && (
                <motion.div 
                  initial={{ top: -40, opacity: 0, scale: 0.95 }}
                  animate={{ top: 20, opacity: 1, scale: 1 }}
                  exit={{ top: -40, opacity: 0 }}
                  className="absolute z-50 left-6 right-6 mx-auto max-w-sm bg-neutral-900/90 text-white p-3 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-2.5 backdrop-blur-xl"
                >
                  <span className="p-2.5 bg-indigo-500 text-white rounded-xl">
                    <Coffee size={14}/>
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-indigo-400">{pushNotification.title}</h4>
                    <p className="text-[10px] text-neutral-300 leading-tight mt-0.5">{pushNotification.body}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulated Case wrapper depending on types selected */}
            <div className={`transition-all duration-300 bg-neutral-800 rounded-[44px] shadow-2xl border-[12px] border-neutral-700/90 overflow-hidden relative ${deviceType === 'ipad' ? 'w-full max-w-3xl aspect-[1.4]' : 'w-[330px] aspect-[0.49]'}`}>
              
              {/* Dynamic Island camera Notch for iPhone */}
              {deviceType === 'iphone' && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black z-40 rounded-full flex items-center justify-between px-3 text-[8px] text-indigo-400 font-bold border border-white/5 shadow-inner">
                  <span>🟢</span>
                  <span>Kalim App</span>
                </div>
              )}

              {/* Statusbar */}
              <div className="bg-[#121216] select-none text-white px-6 py-2 flex justify-between items-center text-[10px] font-black tracking-tight border-b border-white/5 z-30 relative">
                <span className="font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                
                {/* Mid island reference */}
                {deviceType === 'ipad' && (
                  <div className="text-[9px] tracking-wider text-neutral-400 font-extrabold select-none bg-neutral-900 px-3.5 py-0.5 rounded-full border border-white/5 uppercase">
                    iPad Native App (SwiftUI Prototype)
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Wifi size={11} className="text-emerald-400"/>
                  <span>5G</span>
                  <Battery size={13} className="text-neutral-400"/>
                </div>
              </div>

              {/* Device Main Inner Screen */}
              <div className="absolute inset-0 bg-[#f7f7f8] text-black overflow-y-auto flex flex-col mt-7">
                
                {/* Screen Header Bar */}
                <div className="bg-white border-b border-neutral-200/90 shadow-sm p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 px-1.5 bg-black text-white text-[9px] font-black rounded uppercase tracking-widest leading-none">SwiftUI</span>
                      <h1 className="font-black text-base tracking-tight text-neutral-950">Kalim Express</h1>
                    </div>

                    {/* Active Barista Status indicator inside SwiftUI */}
                    <div className="flex items-center gap-1 bg-neutral-100 rounded-full py-0.5 px-2.5 border border-neutral-200/80 text-[10px] font-bold">
                      <User size={10} className="text-neutral-500" />
                      <span className="text-neutral-700 truncate max-w-[100px]">
                        {activeOperator ? activeOperator.userName : "Offline Queue (No Employee Bound)"}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal pill category slider */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                    {uniqueCategories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => { playIOSSound('click'); setSelectedCategory(cat); }}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-neutral-900 text-white shadow' : 'bg-neutral-150 text-neutral-500 hover:text-neutral-800'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search query field */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={12}/>
                    <input 
                      type="text"
                      placeholder="Search drinks or bites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-[11px] bg-neutral-100/90 py-1.5 pl-8 pr-3 rounded-lg border border-neutral-200/50 outline-none focus:border-neutral-300"
                    />
                  </div>
                </div>

                {/* Main Viewport depending on bottom Tab Selection */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                  {activeScreen === 'cashier' ? (
                    
                    /* Simulated View 1: Cashier view containing grids of products */
                    <div className="space-y-3">
                      
                      {/* Products visual list */}
                      <div className="grid grid-cols-2 gap-3.5">
                        {filteredProducts.map(product => (
                          <div 
                            key={product.id}
                            className="bg-white p-3 rounded-2xl border border-neutral-200/70 shadow-sm relative hover:shadow transition-all group select-none cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              {/* Editable long-press product titles (Faithful replica of SwiftUI_Reference.swift EditableText) */}
                              {editingProductId === product.id ? (
                                <div className="flex items-center gap-1 mb-1">
                                  <input 
                                    type="text"
                                    value={editingProductNameValue}
                                    onChange={(e) => setEditingProductNameValue(e.target.value)}
                                    className="bg-neutral-100 p-0.5 border border-neutral-300 rounded text-[11px] outline-none max-w-[100px] text-black"
                                    autoFocus
                                  />
                                  <button 
                                    onClick={() => handleCommitProductNameChange(product.id, editingProductNameValue)}
                                    className="px-1.5 py-0.5 bg-black text-white text-[9px] rounded"
                                  >
                                    Done
                                  </button>
                                </div>
                              ) : (
                                <h3 
                                  onDoubleClick={() => {
                                    setEditingProductId(product.id);
                                    setEditingProductNameValue(product.name);
                                    triggerNotification("✏️ iOS Edit Mode", "Modify title. Tap 'Done' to push metadata to Kalim Cloud.");
                                  }}
                                  className="text-[12px] font-black text-neutral-900 leading-tight mb-0.5 flex items-center gap-1 flex-wrap active:scale-95 transition-transform"
                                  title="Double click to edit title (simulating long-press gesture)"
                                >
                                  {product.name}
                                  <Edit2 size={8} className="opacity-0 group-hover:opacity-100 text-neutral-400" />
                                </h3>
                              )}
                              <p className="text-[9px] text-neutral-400 line-clamp-1.5 leading-tight mb-1.5">{product.description}</p>
                            </div>

                            <div className="flex items-end justify-between mt-1 pt-1 border-t border-dotted border-neutral-100">
                              <span className="text-[11px] font-black text-neutral-900">
                                {currency === 'VND' ? `${Math.round(product.price/1000)}k` : `$${product.price.toFixed(2)}`}
                              </span>
                              <button 
                                onClick={() => {
                                  playIOSSound('click');
                                  setConfiguringProduct(product);
                                }}
                                className="p-1 px-1.5 bg-neutral-900 text-white rounded-lg flex items-center gap-0.5 text-[9px] font-black"
                              >
                                <Plus size={9}/> Customize
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredProducts.length === 0 && (
                        <div className="text-center py-12 text-[11px] text-neutral-400">
                          No customized items found matching matching keyword.
                        </div>
                      )}
                    </div>
                  ) : activeScreen === 'bar' ? (
                    
                    /* Simulated View 2: Bar Station View */
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">ACTIVE ORDER QUEUE</span>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200 px-1.5 rounded-full">
                          {orders.filter(o => o.status !== 'Ready').length} pending
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {orders.filter(o => o.status !== 'Ready').slice(0, 15).map(order => (
                          <div 
                            key={order.id}
                            className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm space-y-2.5 text-black"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-[12px] font-black">{order.customerName || "Walk-In Customer"}</h4>
                                <span className="text-[8px] font-mono text-neutral-400">{order.id.slice(0, 8)} • Src: {order.source || 'POS'}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${order.status === 'Wait' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {order.status}
                              </span>
                            </div>

                            <div className="border-t border-neutral-100 pt-2 space-y-1">
                              {order.items.map((item, id) => (
                                <div key={id} className="flex justify-between text-[11px]">
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-neutral-800">{item.product?.name}</span>
                                    <div className="flex flex-wrap gap-1 text-[8px]">
                                      <span className="bg-neutral-100 px-1 text-neutral-500 rounded">{item.size}</span>
                                      {item.milkType && item.milkType !== 'None' && item.milkType !== 'Whole Milk' && <span className="font-black text-amber-600">🥛 {item.milkType}</span>}
                                      {item.sweetness && item.sweetness !== 'Regular' && <span className="text-purple-600 font-extrabold">🍯 {item.sweetness}</span>}
                                    </div>
                                  </div>
                                  <span className="font-mono font-black text-neutral-500">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <button 
                              onClick={() => handleToggleSimulatedOrderStatus(order.id, order.status)}
                              className="w-full py-1.5 bg-neutral-100 text-neutral-700 text-[10px] font-extrabold rounded-lg hover:bg-neutral-200 leading-none transition-all flex items-center justify-center gap-1"
                            >
                              {order.status === 'Wait' ? 'Start Preparing ⚡' : 'Mark as Ready ✅'}
                            </button>
                          </div>
                        ))}

                        {orders.filter(o => o.status !== 'Ready').length === 0 && (
                          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-4">
                            <span className="text-xs text-neutral-400 font-bold block">-- Bar Station is completely clear --</span>
                            <span className="text-[10px] text-neutral-400">All synced POS orders are served and completed.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    
                    /* Simulated View 3: Command view mimicking diagnostic reports */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
                          <span className="text-[8px] font-extrabold tracking-widest text-neutral-400 uppercase">TODAY REVENUE</span>
                          <h4 className="text-lg font-black text-neutral-950 mt-1">
                            {currency === 'VND' 
                              ? `${Math.round(orders.reduce((sum, o) => sum + o.totalPrice, 0)/1000)}k` 
                              : `$${orders.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}`}
                          </h4>
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
                          <span className="text-[8px] font-extrabold tracking-widest text-neutral-400 uppercase">TOTAL SYSTEM ORDERS</span>
                          <h4 className="text-lg font-black text-neutral-950 mt-1">{orders.length} orders</h4>
                        </div>
                      </div>

                      {/* Barista schedule lists inside native SwiftUI replica */}
                      <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
                        <span className="text-[9px] font-black tracking-widest text-cyan-700 uppercase p-1 bg-cyan-50 rounded select-none inline-block leading-none">SwiftUI roster sync</span>
                        <div className="space-y-1 pt-1.5">
                          {users.slice(0, 4).map(usr => {
                            const isClockedIn = [...timeClock].reverse().find(tc => tc.userId === usr.id)?.type === 'in';
                            return (
                              <div key={usr.id} className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-neutral-800">{usr.name} <span className="text-neutral-400">({usr.role})</span></span>
                                <span className={`px-1 rounded-full text-[8px] font-bold ${isClockedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                  {isClockedIn ? 'CLOCKED_IN' : 'OFFLINE'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Floating Shopping Cart ribbon inside SwiftUI */}
                {cart.length > 0 && !showCheckoutSheet && activeScreen === 'cashier' && (
                  <div className="absolute bottom-16 left-3 right-3 bg-neutral-950 p-3 rounded-2xl text-white shadow-2xl z-30 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/10 p-1.5 rounded-lg text-indigo-400"><ShoppingBag size={12}/></span>
                      <div>
                        <h4 className="text-[11px] font-black">{cart.length} Drink{cart.length > 1 ? 's' : ''} in iOS check</h4>
                        <span className="text-[9px] text-neutral-400">
                          Subtotal: {currency === 'VND' ? `${Math.round(cartSubtotal/1000)}k` : `$${cartSubtotal.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => { playIOSSound('click'); setCart([]); }}
                        className="p-1 px-2.5 text-[9px] font-bold text-rose-400 bg-rose-500/15 rounded-lg"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => { playIOSSound('unlock'); setShowCheckoutSheet(true); }}
                        className="py-1 px-3 bg-white text-black text-[10px] font-black rounded-lg shadow-sm"
                      >
                        Proceed
                      </button>
                    </div>
                  </div>
                )}

                {/* Device Bottom TabBar */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#fbfbfb] border-t border-neutral-200/60 p-1 px-4 flex justify-around z-30 select-none">
                  <button 
                    onClick={() => { playIOSSound('click'); setActiveScreen('cashier'); }}
                    className={`flex flex-col items-center py-1.5 ${activeScreen === 'cashier' ? 'text-black font-extrabold' : 'text-neutral-400'}`}
                  >
                    <ShoppingBag size={14} className={activeScreen === 'cashier' ? 'scale-110' : ''}/>
                    <span className="text-[8px] mt-0.5">Cashier</span>
                  </button>
                  <button 
                    onClick={() => { playIOSSound('click'); setActiveScreen('bar'); }}
                    className={`flex flex-col items-center py-1.5 ${activeScreen === 'bar' ? 'text-black font-extrabold' : 'text-neutral-400'}`}
                  >
                    <Clock size={14} className={activeScreen === 'bar' ? 'scale-110' : ''}/>
                    <span className="text-[8px] mt-0.5">Bar Queue</span>
                  </button>
                  <button 
                    onClick={() => { playIOSSound('click'); setActiveScreen('command'); }}
                    className={`flex flex-col items-center py-1.5 ${activeScreen === 'command' ? 'text-black font-extrabold' : 'text-neutral-400'}`}
                  >
                    <TrendingUp size={14} className={activeScreen === 'command' ? 'scale-110' : ''}/>
                    <span className="text-[8px] mt-0.5">Terminal</span>
                  </button>
                </div>

                {/* SwiftUI Customization Configurator Sheet Modal overlay */}
                <AnimatePresence>
                  {configuringProduct && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end text-black"
                    >
                      <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="bg-white rounded-t-[32px] p-4 max-h-[90%] overflow-y-auto space-y-3.5 shadow-2xl"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-100 px-1.5 py-0.5 rounded">SWIFT MODIFIERS CUSTOMIZER</span>
                            <h3 className="text-sm font-black mt-1">{configuringProduct.name}</h3>
                          </div>
                          <button 
                            onClick={() => { playIOSSound('click'); setConfiguringProduct(null); }}
                            className="p-1 px-2.5 bg-neutral-100 text-neutral-500 rounded-lg text-xs"
                          >
                            <X size={12}/>
                          </button>
                        </div>

                        {/* Sizes */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Choose Cup Size</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['Small', 'Medium', 'Large', 'Extra Large'].map((sz) => (
                              <button 
                                key={sz}
                                onClick={() => setCustomization(prev => ({ ...prev, size: sz as any }))}
                                className={`text-[10px] py-1 font-bold rounded-lg border transition-all ${customization.size === sz ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200/50'}`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Extra Toppings */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Add Extras Toppings</label>
                          <div className="flex flex-wrap gap-1.5">
                            {toppings.map(t => {
                              const isSel = customization.selectedToppings.includes(t.id);
                              return (
                                <button 
                                  key={t.id}
                                  onClick={() => {
                                    playIOSSound('click');
                                    setCustomization(prev => {
                                      const arr = prev.selectedToppings.includes(t.id) 
                                        ? prev.selectedToppings.filter(id => id !== t.id)
                                        : [...prev.selectedToppings, t.id];
                                      return { ...prev, selectedToppings: arr };
                                    });
                                  }}
                                  className={`text-[9px] px-2.5 py-1 rounded-full border transition-all ${isSel ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold' : 'bg-neutral-50 text-neutral-500 border-neutral-200/55'}`}
                                >
                                  +{t.name} ({currency === 'VND' ? `${Math.round(t.price/1000)}k` : `$${t.price}`})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Milk selections */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Choose Milk Base</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['None', 'Whole Milk', 'Oat Milk', 'Lactose Free'].map(mk => (
                              <button 
                                key={mk}
                                onClick={() => setCustomization(prev => ({ ...prev, milkType: mk }))}
                                className={`text-[10px] py-1 font-bold rounded-lg border transition-all ${customization.milkType === mk ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200/50'}`}
                              >
                                {mk.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Ice selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Ice Modifier</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['None', 'Low', 'Regular', 'Extra'].map(ic => (
                              <button 
                                key={ic}
                                onClick={() => setCustomization(prev => ({ ...prev, iceLevel: ic }))}
                                className={`text-[10px] py-1 font-bold rounded-lg border transition-all ${customization.iceLevel === ic ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200/50'}`}
                              >
                                {ic}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sweetness selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Sweetness Modifier</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['None', 'Low 30%', 'Regular 100%', 'Extra 120%'].map(sw => (
                              <button 
                                key={sw}
                                onClick={() => setCustomization(prev => ({ ...prev, sweetness: sw }))}
                                className={`text-[10px] py-1 font-bold rounded-lg border transition-all ${customization.sweetness === sw ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200/50'}`}
                              >
                                {sw.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom notes */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block font-mono">Special Recipe Notes Conformance (String)</label>
                          <input 
                            type="text"
                            placeholder="e.g. Extra hot, double shot..."
                            value={customization.notes}
                            onChange={(e) => setCustomization(prev => ({ ...prev, notes: e.target.value }))}
                            className="bg-neutral-100 p-2 border border-neutral-300 w-full text-xs rounded-xl outline-none"
                          />
                        </div>

                        {/* Checkout Ribbon actions */}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-100">
                          <div className="flex items-center gap-2 bg-neutral-150 p-1 rounded-full">
                            <button 
                              onClick={() => setCustomization(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                              className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-black w-4 text-center">{customization.quantity}</span>
                            <button 
                              onClick={() => setCustomization(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                              className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button 
                            onClick={handleAddConfiguredProduct}
                            className="px-6 py-2 bg-black text-white text-xs font-black rounded-full"
                          >
                            Add To Cart ({currency === 'VND' ? `${Math.round((getItemSinglePrice({ productId: configuringProduct.id, quantity: customization.quantity, size: customization.size, toppings: customization.selectedToppings, milkType: customization.milkType })*customization.quantity)/1000)}k` : `$${(getItemSinglePrice({ productId: configuringProduct.id, quantity: customization.quantity, size: customization.size, toppings: customization.selectedToppings, milkType: customization.milkType })*customization.quantity).toFixed(2)}`})
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulated Checkout Slide Sheet Modal */}
                <AnimatePresence>
                  {showCheckoutSheet && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end text-black"
                    >
                      <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="bg-white rounded-t-[32px] p-4 max-h-[95%] overflow-y-auto space-y-3 shadow-2xl"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-black text-sm text-neutral-950">Confirm Checkout (Swift UI)</h3>
                          <button 
                            onClick={() => { playIOSSound('click'); setShowCheckoutSheet(false); }}
                            className="p-1 px-2.5 bg-neutral-100 text-neutral-500 rounded-lg text-xs"
                          >
                            Close
                          </button>
                        </div>

                        {/* List items reviewed */}
                        <div className="bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200/50 space-y-2 max-h-24 overflow-y-auto">
                          {cart.map((it, i) => (
                            <div key={i} className="flex justify-between text-[10px] text-neutral-700">
                              <span>{it.quantity}x {it.product?.name} ({it.size})</span>
                              <span className="font-extrabold">{currency === 'VND' ? `${Math.round((getItemSinglePrice(it)*it.quantity)/1000)}k` : `$${(getItemSinglePrice(it)*it.quantity).toFixed(2)}`}</span>
                            </div>
                          ))}
                        </div>

                        {/* Customer inputs */}
                        <form onSubmit={handleSubmitCheckout} className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest pl-1 mb-1">Customer Name</label>
                              <input 
                                type="text"
                                placeholder="..."
                                required
                                value={checkoutName}
                                onChange={(e) => setCheckoutName(e.target.value)}
                                className="w-full bg-neutral-100 p-2 rounded-xl text-[11px] border border-neutral-200 focus:bg-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest pl-1 mb-1">Phone Number</label>
                              <input 
                                type="text"
                                placeholder="..."
                                value={checkoutPhone}
                                onChange={(e) => setCheckoutPhone(e.target.value)}
                                className="w-full bg-neutral-100 p-2 rounded-xl text-[11px] border border-neutral-200 focus:bg-white outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick tip slider conformant to SwiftUI_Reference.swift */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest pl-1">ADD A TIP</label>
                            <div className="flex gap-1.5">
                              {tipOptions.map((opt) => (
                                <button 
                                  key={opt}
                                  type="button"
                                  onClick={() => { playIOSSound('click'); setTipSelection(opt); }}
                                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${tipSelection === opt ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-500 border-neutral-200/50'}`}
                                >
                                  {currency === 'VND' ? `+${opt/1000}k` : `+$${opt}`}
                                </button>
                              ))}
                              <button 
                                type="button"
                                onClick={() => { playIOSSound('click'); setTipSelection(0); }}
                                className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${tipSelection === 0 ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-50 text-neutral-500'}`}
                              >
                                None
                              </button>
                            </div>
                          </div>

                          {/* Method selection */}
                          <div className="space-y-1 text-black">
                            <label className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest pl-1">Select Payment</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {['Apple Pay 🍏', 'Cash 💵', 'Credit Card 💳', 'Loyalty Card ⭐️'].map(pm => (
                                <button 
                                  key={pm}
                                  type="button"
                                  onClick={() => { playIOSSound('click'); setPaymentMethodSelector(pm); }}
                                  className={`py-1 rounded text-[10px] font-extrabold border ${paymentMethodSelector === pm ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200/50'}`}
                                >
                                  {pm}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Additional order comments */}
                          <div>
                            <label className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest pl-1 mb-1">Check Remarks notes</label>
                            <input 
                              type="text"
                              value={checkoutNotes}
                              onChange={(e) => setCheckoutNotes(e.target.value)}
                              placeholder="Remarks to relay back to Staff connect..."
                              className="w-full bg-neutral-100 p-2 rounded-xl text-[10px] border border-neutral-200 focus:bg-white outline-none inline-block resize-none text-black"
                            />
                          </div>

                          <div className="p-2 text-center border-t border-neutral-100 mt-2">
                            <button 
                              type="submit"
                              disabled={isProcessingPayment}
                              className="w-full py-2.5 bg-black text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 leading-none hover:bg-neutral-800 disabled:opacity-50"
                            >
                              {isProcessingPayment ? <RefreshCw className="animate-spin" size={11} /> : 'TAP APPLE PAY / COMPLETE'}
                              {!isProcessingPayment && (currency === 'VND' ? `${Math.round((cartSubtotal + tipSelection)/1000)}k` : `$${(cartSubtotal + tipSelection).toFixed(2)}`)}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Native alert simulator popup */}
                <AnimatePresence>
                  {paymentDoneMessage && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-6 text-black"
                    >
                      <motion.div 
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-white/95 rounded-[24px] p-5 w-full max-w-xs text-center space-y-3.5 shadow-2xl backdrop-blur-md"
                      >
                        <span className="p-3 bg-emerald-100 text-emerald-600 rounded-full inline-block">
                          <CheckCircle2 size={24}/>
                        </span>
                        <div>
                          <h4 className="font-black text-sm">SwiftUI Transaction Approved</h4>
                          <p className="text-[10.5px] text-neutral-500 mt-1">{paymentDoneMessage}</p>
                        </div>
                        <button 
                          onClick={() => { playIOSSound('click'); setPaymentDoneMessage(null); setShowCheckoutSheet(false); }}
                          className="w-full py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl"
                        >
                          Dismiss Alert (OK)
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
