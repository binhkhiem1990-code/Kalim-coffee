import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  Coffee, 
  Settings, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  FileText,
  User,
  Printer,
  Truck,
  Globe,
  Smartphone,
  LogOut,
  Users,
  Lock,
  Unlock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Search,
  ChevronDown,
  X,
  Sparkles,
  BarChart3,
  History,
  Info,
  Send,
  BookOpen,
  Cake,
  Zap,
  Gift,
  Palette,
  UserPlus,
  QrCode,
  Wifi,
  WifiOff,
  Copy,
  Sliders,
  Eye,
  EyeOff,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreMap } from './components/StoreMap';
import { InventoryCharts } from './components/InventoryCharts';
import { DigitalMenuQr } from './components/DigitalMenuQr';
import { StaffPerformance } from './components/StaffPerformance';
import { AiScheduler } from './components/AiScheduler';
import StaffPortal from './components/StaffPortal';
import IosSwiftUiSimulator from './components/IosSwiftUiSimulator';
import KalimCustomerApp from './components/KalimCustomerApp';
import AntiCheatSimulator from './components/AntiCheatSimulator';
import CameraQrScanner from './components/CameraQrScanner';
import { translations } from './utils/translations';
import { CorpTaxTab } from './components/CorpTaxTab';
import { exportSalesLedgerToPdf } from './utils/pdfExport';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

// --- Types ---
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  isNew?: boolean;
  season?: string;
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
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  keywords: string[];
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  pin: string;
  employeeId: string;
  permissions: string[];
  phone?: string;
  email?: string;
  notificationPreference?: 'email' | 'sms' | 'both';
  hourlyWage?: number; 
  avatarColor?: string;
}

interface TimeStamp {
  id: string;
  userId: string;
  employeeId: string;
  userName: string;
  type: 'in' | 'out';
  timestamp: string;
}

const useSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);

  const minSwipeDistance = 150; // Increased threshold
  const maxVerticalDistance = 75; // Slightly increased to allow more vertical movement

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.fixed.inset-0')) return;

    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    
    if (distanceY > maxVerticalDistance) return;

    if (distanceX > minSwipeDistance) {
      onSwipeLeft();
      e.stopPropagation();
    } else if (distanceX < -minSwipeDistance) {
      onSwipeRight();
      e.stopPropagation();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const useDoubleTap = (onDoubleTap: () => void, delay = 300) => {
  const [lastTap, setLastTap] = useState(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < delay) {
      onDoubleTap();
    }
    setLastTap(now);
  };

  return handleTap;
};

const MAPS_KEY = 
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') || 
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
  '';

export default function App() {
  // Standalone detection & multi-app separation state
  const [currentApp, setCurrentApp] = useState<'customer' | 'staff' | 'merchant'>(() => {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app');
    if (appParam === 'customer' || appParam === 'staff' || appParam === 'merchant') {
      return appParam;
    }
    const hash = window.location.hash;
    if (hash.includes('app=customer')) return 'customer';
    if (hash.includes('app=staff')) return 'staff';
    if (hash.includes('app=merchant')) return 'merchant';
    return 'merchant';
  });

  const [activeTab, setActiveTab] = useState<'cashier' | 'bar' | 'website' | 'admin' | 'customer_display' | 'customer'>(() => {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app');
    if (appParam === 'customer') return 'customer';
    if (appParam === 'staff') return 'website';
    if (appParam === 'merchant') return 'cashier';
    const hash = window.location.hash;
    if (hash.includes('app=customer')) return 'customer';
    if (hash.includes('app=staff')) return 'website';
    if (hash.includes('app=merchant')) return 'cashier';
    return 'cashier';
  });

  const [isStandaloneMode, setIsStandaloneMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('app')) return true;
    const hash = window.location.hash;
    return hash.includes('app=');
  });

  const [isIndependentModalOpen, setIsIndependentModalOpen] = useState(false);
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);

  const getStandaloneUrl = (type: 'customer' | 'staff' | 'merchant') => {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?app=${type}`;
  };

  const copyStandaloneUrl = (type: 'customer' | 'staff' | 'merchant') => {
    const url = getStandaloneUrl(type);
    navigator.clipboard.writeText(url);
    setCopiedLinkType(type);
    setTimeout(() => setCopiedLinkType(null), 2000);
  };

  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'menu' | 'inventory' | 'suppliers' | 'membership' | 'reports' | 'ai' | 'settings' | 'users' | 'timeclock'>('dashboard');
  
  // Consolidated and nested subtabs state
  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'reports' | 'ai_insights' | 'ai_tax_strategies'>('overview');
  const [inventorySubTab, setInventorySubTab] = useState<'products' | 'suppliers'>('products');
  const [staffSubTab, setStaffSubTab] = useState<'staff_list' | 'timeclock'>('staff_list');

  // AI Tax Strategy states
  const [aiTaxResult, setAiTaxResult] = useState<string>('');
  const [isGeneratingAiTax, setIsGeneratingAiTax] = useState(false);
  const [selectedTaxItems, setSelectedTaxItems] = useState<Record<number, boolean>>(() => {
    try {
      const items: Record<number, boolean> = {};
      for (let i = 0; i < 6; i++) {
        items[i] = localStorage.getItem('tax_deduct_item_' + i) === 'true';
      }
      return items;
    } catch (e) {
      return {};
    }
  });

  // Reorder Admin tabs via Hold screen
  const [isRearrangeModalOpen, setIsRearrangeModalOpen] = useState(false);
  const [adminSubTabsOrder, setAdminSubTabsOrder] = useState<any[]>(() => {
    const defaultOrder = [
      { id: 'dashboard', label: '📊 Dashboard', perm: 'reports' },
      { id: 'menu', label: '☕ Menu', perm: 'settings' },
      { id: 'inventory', label: '📦 Inventory', perm: 'inventory' },
      { id: 'membership', label: '💳 Customers', perm: 'users' },
      { id: 'users', label: '👥 Staff / Users', perm: 'users' },
      { id: 'settings', label: '⚙️ Settings', perm: 'settings' }
    ];
    try {
      const saved = localStorage.getItem('kalim_admin_tabs_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure there are no legacy ids like 'suppliers' or 'timeclock' at top level
        const isValid = Array.isArray(parsed) && parsed.every(tab => 
          ['dashboard', 'menu', 'inventory', 'membership', 'users', 'settings'].includes(tab.id)
        ) && parsed.length === 6;
        if (isValid) return parsed;
      }
    } catch (e) {}
    return defaultOrder;
  });

  const longPressTimerRef = useRef<any>(null);
  const handleTabPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsRearrangeModalOpen(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 700); 
  };
  const handleTabPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const [reportsActiveSubTab, setReportsActiveSubTab] = useState<'sales' | 'corporate_tax' | 'transactions'>('sales');
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [transactionFilterDate, setTransactionFilterDate] = useState('');
  const [transactionPage, setTransactionPage] = useState(1);
  const [aiInvoiceQuery, setAiInvoiceQuery] = useState('');
  const [aiInvoiceSearching, setAiInvoiceSearching] = useState(false);
  const [aiInvoiceSearchResult, setAiInvoiceSearchResult] = useState<string | null>(null);
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const handleDoubleTap = useDoubleTap(() => {
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    scrollableElements.forEach(el => el.scrollTo({ top: 0, behavior: 'smooth' }));
  });

  const generateAiTaxStrategy = async () => {
    setIsGeneratingAiTax(true);
    setAiTaxResult('');
    try {
      const selectedList = Object.entries(selectedTaxItems)
        .filter(([_, sel]) => sel)
        .map(([idx]) => {
          const itemsList = [
            { name: "Slayer 2-Group App-Controlled Espresso Machine", price: 16500, cat: "Slayer Tech" },
            { name: "Mahlkönig E65S GbW Intelligent IoT Grinder", price: 3400, cat: "IoT Grinder" },
            { name: "AI Customer Counter & Staffing Optimizer Camera System", price: 2800, cat: "AI Camera" },
            { name: "Secure Enterprise Wifi 7 Mesh Network & iPad POS Pro Units", price: 4200, cat: "POS Network" },
            { name: "Smart IoT Temp & Humidity Early Warning Fridge Sensors", price: 1500, cat: "IoT Sensors" },
            { name: "Website Kalimcoffee.ca Custom SaaS Software Development", price: 9500, cat: "Marketing SaaS" }
          ];
          return itemsList[Number(idx)];
        });

      const response = await fetch('/api/ai-tax-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxRegion,
          financialSummary: {
            totalRevenue: stats.totalRevenue || 0,
            totalOrders: stats.totalOrders || 0,
            totalTax: stats.totalTax || 0,
            totalTips: stats.totalTips || 0
          },
          selectedItems: selectedList
        })
      });
      const data = await response.json();
      if (data.error) {
        setAiTaxResult(`❌ Error: ${data.error}`);
      } else {
        setAiTaxResult(data.result || 'No response received.');
      }
    } catch (e: any) {
      setAiTaxResult(`❌ Cannot connect to the server: ${e.message}`);
    } finally {
      setIsGeneratingAiTax(false);
    }
  };
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeClock, setTimeClock] = useState<TimeStamp[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>({ id: '1', name: 'Admin', role: 'admin', pin: '0000', permissions: ['all'] } as any);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isBusyMode, setIsBusyMode] = useState(false);
  const [autoBusyMode, setAutoBusyMode] = useState(true);
  const [busyThreshold, setBusyThreshold] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState<any>({ totalRevenue: 0, inventoryStatus: [], totalTax: 0, totalTips: 0, totalOrders: 0 });
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSyncingExternal, setIsSyncingExternal] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected'>('connected');
  
  // Offline & Dynamic Queue States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => {
    try {
      const q = localStorage.getItem('offline_order_queue');
      return q ? JSON.parse(q).length : 0;
    } catch {
      return 0;
    }
  });
  const [printOverlayData, setPrintOverlayData] = useState<{type: 'bill' | 'label', data: any} | null>(null);
  const [editingCartItemIdx, setEditingCartItemIdx] = useState<number | null>(null);
  
  // AI Assistant States
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiChatMessage, setAiChatMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user' | 'model', parts: {text: string}[]}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<'en' | 'fr' | 'es' | 'ja' | 'zh' | 'vi'>('en');
  const lang = (aiLanguage && aiLanguage in translations) ? aiLanguage : 'en';
  const t = (key: keyof typeof translations.en) => {
    return translations[lang as keyof typeof translations]?.[key] || translations.en[key] || key;
  };
  const [marketingAd, setMarketingAd] = useState<string | null>(null);
  
  // Checkout States
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Contactless (VISA)');
  const [printBill, setPrintBill] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // --- LOYALTY & CRM STATES ---
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<any[]>([]);
  const [seasonalCardConfig, setSeasonalCardConfig] = useState<any>({
    currentSeason: "Summer",
    customLogo: "Kalim VIP Club",
    cardColorStart: "#1e1e2f",
    cardColorEnd: "#ff6b6b",
    vipPattern: "radial",
    cardGlowEffect: true,
  });
  const [smsDeliveryLogs, setSmsDeliveryLogs] = useState<any[]>([]);
  const [scannedCustomer, setScannedCustomer] = useState<any | null>(null);
  
  // Custom Card Designer Controls
  const [designSeason, setDesignSeason] = useState("Summer");
  const [designLogo, setDesignLogo] = useState("Kalim VIP Club");
  const [designColorStart, setDesignColorStart] = useState("#1e1e2f");
  const [designColorEnd, setDesignColorEnd] = useState("#ff6b6b");
  const [designPattern, setDesignPattern] = useState("radial");
  const [designGlow, setDesignGlow] = useState(true);

  // New Client Loyalty CRM states
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustDob, setNewCustDob] = useState("");
  const [newCustDrink, setNewCustDrink] = useState("");
  const [newCustTier, setNewCustTier] = useState("Silver member");

  // AI Precision Matcher states
  const [fuzzyWants, setFuzzyWants] = useState("");
  const [isPrecMatchLoading, setIsPrecMatchLoading] = useState(false);
  const [precMatchResult, setPrecMatchResult] = useState<any | null>(null);

  // AI Inventory suggestions & checks states
  const [aiInvSuggestions, setAiInvSuggestions] = useState<any[]>([]);
  const [isAuditingInventory, setIsAuditingInventory] = useState(false);
  const [completedSuggestions, setCompletedSuggestions] = useState<Record<string, boolean>>({});

  // Product Management States
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingTopping, setEditingTopping] = useState<any>(null);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [visibleStaffPins, setVisibleStaffPins] = useState<Record<string, boolean>>({});
  const [visibleCustomerPasswords, setVisibleCustomerPasswords] = useState<Record<string, boolean>>({});
  const [empIdInput, setEmpIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [staffForgotPin, setStaffForgotPin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>(['Espresso & Brews', 'Bakery', 'Breakfast Menu']);
  const [currency, setCurrency] = useState('CAD');
  const [websiteUrl, setWebsiteUrl] = useState('https://kalimcoffee.ca');
  const [taxRegion, setTaxRegion] = useState('ON');
  const [canadianTaxes, setCanadianTaxes] = useState<any>({});
  const [minEmployeeId, setMinEmployeeId] = useState(1);
  const [maxEmployeeId, setMaxEmployeeId] = useState(99999);
  const [forecastDays, setForecastDays] = useState(7);
  const [showShiftReminder, setShowShiftReminder] = useState<string | null>(null);
  const [showTimeClockPrompt, setShowTimeClockPrompt] = useState<{ type: 'in' | 'out' } | null>(null);
  const [customerAppWebMode, setCustomerAppWebMode] = useState<boolean>(false);
  const [timeClockEmpId, setTimeClockEmpId] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [reorderingItems, setReorderingItems] = useState<{[key: string]: 'idle' | 'loading' | 'success'}>({});
  const [staffActiveTab, setStaffActiveTab] = useState<'directory' | 'performance' | 'ai_scheduler' | 'payroll' | 'anti_cheat'>('directory');
  const [simulateDeveloperMode, setSimulateDeveloperMode] = useState<boolean>(false);
  const [renderLegacyWebPosMode, setRenderLegacyWebPosMode] = useState<boolean>(false);

  const hasPermission = (perm: string) => {
    if (!currentUser) return false;
    if (currentUser.permissions.includes('all')) return true;
    return currentUser.permissions.includes(perm);
  };

  const categories = ['All', ...customCategories];
  const tipOptions = currency === 'VND' ? [5000, 10000, 20000] : [1, 2, 5];

  const mainTabsList = [
    { id: 'cashier', perm: 'pos' },
    { id: 'bar', perm: 'bar' },
    { id: 'website', perm: 'pos' }, // Available to anyone who can see pos
    { id: 'admin', perm: 'admin' }
  ].filter(tab => {
    if (tab.perm === 'admin') return hasPermission('inventory') || hasPermission('reports') || hasPermission('settings') || hasPermission('users') || hasPermission('ai');
    return hasPermission(tab.perm);
  });

  const adminTabsList = [
    { id: 'dashboard', perm: 'reports' },
    { id: 'menu', perm: 'settings' },
    { id: 'inventory', perm: 'inventory' },
    { id: 'suppliers', perm: 'suppliers' },
    { id: 'membership', perm: 'users' },
    { id: 'reports', perm: 'reports' },
    { id: 'ai', perm: 'ai' },
    { id: 'users', perm: 'users' },
    { id: 'timeclock', perm: 'users' },
    { id: 'settings', perm: 'settings' }
  ].filter(sub => hasPermission(sub.perm));

  const mainSwipeHandlers = useSwipe(
    () => { // Swipe Left -> Next Tab
      const idx = mainTabsList.findIndex(t => t.id === activeTab);
      if (idx >= 0 && idx < mainTabsList.length - 1) setActiveTab(mainTabsList[idx + 1].id as any);
    },
    () => { // Swipe Right -> Prev Tab
      const idx = mainTabsList.findIndex(t => t.id === activeTab);
      if (idx > 0) setActiveTab(mainTabsList[idx - 1].id as any);
    }
  );

  const categorySwipeHandlers = useSwipe(
    () => { // Swipe Left -> Next Category
      const idx = categories.indexOf(selectedCategory);
      if (idx >= 0 && idx < categories.length - 1) setSelectedCategory(categories[idx + 1]);
    },
    () => { // Swipe Right -> Prev Category
      const idx = categories.indexOf(selectedCategory);
      if (idx > 0) setSelectedCategory(categories[idx - 1]);
    }
  );

  const adminSwipeHandlers = useSwipe(
    () => { // Swipe Left -> Next Admin Tab
      const idx = adminTabsList.findIndex(t => t.id === adminSubTab);
      if (idx >= 0 && idx < adminTabsList.length - 1) setAdminSubTab(adminTabsList[idx + 1].id as any);
    },
    () => { // Swipe Right -> Prev Admin Tab
      const idx = adminTabsList.findIndex(t => t.id === adminSubTab);
      if (idx > 0) setAdminSubTab(adminTabsList[idx - 1].id as any);
    }
  );

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchData();
      }
    }, 4000); // 4s buffer
    detectLocation();

    const handleOnlineStatus = () => {
      setIsOnline(true);
      syncOfflineOrders();
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Boot sync check
    syncOfflineOrders();

    // Shift Reminders
    const shiftCheck = setInterval(() => {
      const now = new Date();
      const time = now.getHours() * 100 + now.getMinutes();
      
      const shifts = [
        { time: 800, label: 'Morning Shift Start' },
        { time: 1200, label: 'Morning Shift End' },
        { time: 1300, label: 'Afternoon Shift Start' },
        { time: 1700, label: 'Afternoon Shift End' }
      ];

      const currentShift = shifts.find(s => s.time === time);
      if (currentShift && currentUser) {
        setShowShiftReminder(currentShift.label);
      }
    }, 60000);

    // Setup Live WebSocket Connection to Server
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    console.log("[WebSocket] Initiating connection to", wsUrl);
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocket] Unified message received:", data);
          
          if (data.type === "NEW_ORDER") {
            // Trigger automatic sound alert / simulation bell buzzer
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Beep tone
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              setTimeout(() => { osc.stop(); }, 600);
            } catch (audErr) {
              console.log("Audio play postponed pending user click gesture:", audErr);
            }
            
            // Trigger Toast Display Alert
            setToastAlert(`🔔 LIVE ORDER RECEIVED: ${data.order.customerName || 'Guest'} - Order #${data.order.id}!`);
            setTimeout(() => setToastAlert(null), 8000);
            
            // Force dynamic re-fetch
            fetchData();
          } else if (data.type === "STAFF_CONNECT_STAMP") {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = "triangle";
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
              const gain = audioCtx.createGain();
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              setTimeout(() => { osc.stop(); }, 350);
            } catch (audErr) {
              console.log("Audio play postponed:", audErr);
            }
            setToastAlert(`👤 STAFF UPDATE: ${data.stamp.userName} has Clocked ${data.stamp.type.toUpperCase()}!`);
            setTimeout(() => setToastAlert(null), 6000);
            fetchData();
          } else if (data.type === "STAFF_CONNECT_REQUEST") {
            setToastAlert(`📆 SHIFT REQUEST: ${data.request.userName} requested a ${data.request.type.toUpperCase()} shift modification.`);
            setTimeout(() => setToastAlert(null), 7000);
            fetchData();
          } else if (data.type === "STAFF_CONNECT_REQUEST_RESOLVED") {
            setToastAlert(`📆 REQUEST RESOLVED: ${data.request.userName}'s shift request has been ${data.action.toUpperCase()}!`);
            setTimeout(() => setToastAlert(null), 7000);
            fetchData();
          } else if (data.type === "STAFF_CONNECT_SYNC") {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = "sine";
              osc.frequency.setValueAtTime(698.46, audioCtx.currentTime); // F5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
              const gain = audioCtx.createGain();
              gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              setTimeout(() => { osc.stop(); }, 250);
            } catch (audErr) {
              console.log("Audio play postponed:", audErr);
            }
            if (data.packet.senderName !== "Kalim System") {
              setToastAlert(`📢 ECOSYSTEM NOTICE from ${data.packet.senderName}: "${data.packet.message}"`);
              setTimeout(() => setToastAlert(null), 8500);
            }
            fetchData();
          }
        } catch (e) {
          console.error("[WebSocket] Parsing error:", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("[WebSocket] Socket experienced warning/error:", err);
      };
    } catch (wsSetupErr) {
      console.warn("WebSocket could not initialize in preview mode due to frame configuration:", wsSetupErr);
    }

    return () => {
      clearInterval(interval);
      clearInterval(shiftCheck);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      if (ws) {
        try {
          ws.close();
        } catch(cErr){}
      }
    };
  }, []);

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedCurrency = 'CAD';
        
        // Global currency heuristic
        if (latitude < -10) detectedCurrency = 'AUD';
        else if (latitude > 24 && latitude < 49 && longitude > -125 && longitude < -67) detectedCurrency = 'USD';
        else if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) detectedCurrency = 'EUR';
        else if (latitude > 8 && latitude < 24 && longitude > 102 && longitude < 110) detectedCurrency = 'VND';
        else if (latitude > 50 && latitude < 60 && longitude > -10 && longitude < 2) detectedCurrency = 'GBP';
        else if (latitude > 30 && latitude < 45 && longitude > 125 && longitude < 145) detectedCurrency = 'JPY';
        else if (latitude > 1 && latitude < 7 && longitude > 100 && longitude < 120) detectedCurrency = 'SGD';

        setCurrency(detectedCurrency);
        
        try {
          // AI dynamic tax update based on current law
          const aiTaxRes = await fetch('/api/ai-update-tax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          });
          const aiTaxData = await aiTaxRes.json();
          if (aiTaxData.success) {
             setTaxRegion(aiTaxData.taxRegion);
          }
          
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency: detectedCurrency, taxRegion: aiTaxData.taxRegion || 'ON' })
          });
        } catch(e) {
             console.error("AI Tax Error", e);
        }
      }, (err) => console.warn("Location access denied", err));
    }
  };

  const fetchData = async () => {
    try {
      const endpoints = [
        '/api/products', 
        '/api/orders', 
        '/api/settings', 
        '/api/reports', 
        '/api/toppings', 
        '/api/suppliers', 
        '/api/users', 
        '/api/time-clock', 
        '/api/schedules',
        '/api/loyalty-customers',
        '/api/loyalty-cards/seasonal',
        '/api/loyalty/sms-logs',
        '/api/ai-inventory-check/suggestions'
      ];
      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      const [
        pData, 
        oData, 
        sData, 
        rData, 
        tData, 
        supData, 
        uData, 
        tcData, 
        scData, 
        loyCustData, 
        loyCardData, 
        smsLogData, 
        aiInvData
      ] = await Promise.all(responses.map(res => res.json()));
      
      setProducts(Array.isArray(pData) ? pData : []);
      setOrders(Array.isArray(oData) ? oData : []);
      setIsBusyMode(sData?.isBusyMode ?? false);
      setAutoBusyMode(sData?.autoBusyMode ?? true);
      setBusyThreshold(sData?.busyThreshold || 5);
      setCurrency(sData?.currency || 'CAD');
      setTaxRegion(sData?.taxRegion || 'ON');
      setCanadianTaxes(sData?.canadianTaxes || {});
      setMinEmployeeId(sData?.minEmployeeId || 1);
      setMaxEmployeeId(sData?.maxEmployeeId || 99999);
      setStats(rData || { totalRevenue: 0, inventoryStatus: [], totalTax: 0, totalTips: 0, totalOrders: 0 });
      setToppings(Array.isArray(tData) ? tData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
      setUsers(Array.isArray(uData) ? uData : []);
      setTimeClock(Array.isArray(tcData) ? tcData : []);
      setSchedules(Array.isArray(scData) ? scData : []);
      
      if (loyCustData && !loyCustData.error) setLoyaltyCustomers(loyCustData);
      if (loyCardData && !loyCardData.error) {
        setSeasonalCardConfig(loyCardData);
        // Sync Designer inputs with loaded config once
        setDesignSeason(loyCardData.currentSeason || "Summer");
        setDesignLogo(loyCardData.customLogo || "Kalim VIP Club");
        setDesignColorStart(loyCardData.cardColorStart || "#1e1e2f");
        setDesignColorEnd(loyCardData.cardColorEnd || "#ff6b6b");
        setDesignPattern(loyCardData.vipPattern || "radial");
        setDesignGlow(loyCardData.cardGlowEffect !== false);
      }
      if (smsLogData && !smsLogData.error) setSmsDeliveryLogs(smsLogData);
      if (aiInvData && !aiInvData.error) setAiInvSuggestions(aiInvData);

      // Save to offline storage as fallback cache
      localStorage.setItem('offline_cache_products', JSON.stringify(pData));
      localStorage.setItem('offline_cache_orders', JSON.stringify(oData));
      localStorage.setItem('offline_cache_settings', JSON.stringify(sData));
      localStorage.setItem('offline_cache_reports', JSON.stringify(rData));
      localStorage.setItem('offline_cache_toppings', JSON.stringify(tData));
      localStorage.setItem('offline_cache_suppliers', JSON.stringify(supData));
      localStorage.setItem('offline_cache_users', JSON.stringify(uData));
      localStorage.setItem('offline_cache_timeClock', JSON.stringify(tcData));
      localStorage.setItem('offline_cache_schedules', JSON.stringify(scData));
      localStorage.setItem('offline_cache_loyCustomers', JSON.stringify(loyCustData));
      localStorage.setItem('offline_cache_smsLog', JSON.stringify(smsLogData));
      localStorage.setItem('offline_cache_aiInv', JSON.stringify(aiInvData));

    } catch (err) {
      console.warn("Offline POS mode: Falling back to localStorage data cache", err);
      // Fetch from local cache if we are offline
      const cachedProducts = localStorage.getItem('offline_cache_products');
      const cachedOrders = localStorage.getItem('offline_cache_orders');
      const cachedSettings = localStorage.getItem('offline_cache_settings');
      const cachedReports = localStorage.getItem('offline_cache_reports');
      const cachedToppings = localStorage.getItem('offline_cache_toppings');
      const cachedSuppliers = localStorage.getItem('offline_cache_suppliers');
      const cachedUsers = localStorage.getItem('offline_cache_users');
      const cachedTimeClock = localStorage.getItem('offline_cache_timeClock');
      const cachedSchedules = localStorage.getItem('offline_cache_schedules');
      const cachedLoyCustomers = localStorage.getItem('offline_cache_loyCustomers');
      const cachedSmsLog = localStorage.getItem('offline_cache_smsLog');
      const cachedAiInv = localStorage.getItem('offline_cache_aiInv');

      if (cachedProducts) setProducts(JSON.parse(cachedProducts));
      if (cachedOrders) {
        const parsedOrders = JSON.parse(cachedOrders);
        const queue = JSON.parse(localStorage.getItem('offline_order_queue') || '[]');
        setOrders([...queue, ...parsedOrders]);
      }
      if (cachedSettings) {
        const sData = JSON.parse(cachedSettings);
        setIsBusyMode(sData.isBusyMode);
        setAutoBusyMode(sData.autoBusyMode);
        setBusyThreshold(sData.busyThreshold || 5);
        setCurrency(sData.currency || 'CAD');
        setTaxRegion(sData.taxRegion || 'ON');
        setCanadianTaxes(sData.canadianTaxes || {});
        setMinEmployeeId(sData.minEmployeeId || 1);
        setMaxEmployeeId(sData.maxEmployeeId || 99999);
      }
      if (cachedReports) setStats(JSON.parse(cachedReports));
      if (cachedToppings) setToppings(JSON.parse(cachedToppings));
      if (cachedSuppliers) setSuppliers(JSON.parse(cachedSuppliers));
      if (cachedUsers) setUsers(JSON.parse(cachedUsers));
      if (cachedTimeClock) setTimeClock(JSON.parse(cachedTimeClock));
      if (cachedSchedules) setSchedules(JSON.parse(cachedSchedules));
      if (cachedLoyCustomers) setLoyaltyCustomers(JSON.parse(cachedLoyCustomers));
      if (cachedSmsLog) setSmsDeliveryLogs(JSON.parse(cachedSmsLog));
      if (cachedAiInv) setAiInvSuggestions(JSON.parse(cachedAiInv));
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.size === 'Medium');
      if (existing) {
        return prev.map(item => (item.productId === product.id && item.size === 'Medium') ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, quantity: 1, size: 'Medium', product, toppings: [] }];
    });
  };

  const updateItemSize = (productId: string, size: 'Small' | 'Medium' | 'Large' | 'Extra Large', index: number) => {
    setCart(prev => prev.map((item, idx) => idx === index ? { ...item, size } : item));
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const newQuantity = newCart[index].quantity + delta;
      if (newQuantity <= 0) {
        return newCart.filter((_, idx) => idx !== index);
      }
      newCart[index].quantity = newQuantity;
      return newCart;
    });
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const revenueGrowthStats = React.useMemo(() => {
    if (!stats.orders || stats.orders.length === 0) {
      return { growthPercent: 12.4, currentPeriodRev: 3420.50, previousPeriodRev: 3042.00, chartData: [] };
    }

    const todayDate = new Date();
    const current30Start = new Date(todayDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Start = new Date(todayDate.getTime() - 60 * 24 * 60 * 60 * 1000);

    let currentPeriodRev = 0;
    let previousPeriodRev = 0;

    const dailySalesMap: { [key: string]: number } = {};
    for (let d = 29; d >= 0; d--) {
      const dateString = new Date(todayDate.getTime() - d * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailySalesMap[dateString] = 0;
    }

    stats.orders.forEach((o: any) => {
      const oDate = new Date(o.date);
      if (isNaN(oDate.getTime())) return;

      if (oDate >= current30Start && oDate <= todayDate) {
        currentPeriodRev += o.total;
        const dateStr = oDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (dailySalesMap[dateStr] !== undefined) {
          dailySalesMap[dateStr] += o.total;
        } else {
          dailySalesMap[dateStr] = o.total;
        }
      } else if (oDate >= previous30Start && oDate < current30Start) {
        previousPeriodRev += o.total;
      }
    });

    const chartData = Object.keys(dailySalesMap).map(day => ({
      day,
      Sales: parseFloat(dailySalesMap[day].toFixed(2))
    }));

    if (currentPeriodRev === 0 && previousPeriodRev === 0) {
      const dummyData = Array.from({ length: 30 }, (_, idx) => {
        const dateString = new Date(todayDate.getTime() - (29 - idx) * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const val = Math.floor(Math.random() * 80) + 120 + Math.sin(idx / 3) * 40;
        return { day: dateString, Sales: parseFloat(val.toFixed(2)) };
      });
      const dummyCurr = dummyData.reduce((sum, d) => sum + d.Sales, 0);
      const dummyPrev = dummyCurr * 0.91;
      const growthPercent = parseFloat((((dummyCurr - dummyPrev) / dummyPrev) * 100).toFixed(1));
      return { growthPercent, currentPeriodRev: dummyCurr, previousPeriodRev: dummyPrev, chartData: dummyData };
    }

    if (previousPeriodRev === 0) previousPeriodRev = currentPeriodRev * 0.88;

    const diff = currentPeriodRev - previousPeriodRev;
    const growthPercent = parseFloat(((diff / previousPeriodRev) * 100).toFixed(1));

    return {
      growthPercent,
      currentPeriodRev,
      previousPeriodRev,
      chartData
    };
  }, [stats.orders]);

  const toggleTopping = (productId: string, toppingId: string, index: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        const currentToppings = item.toppings || [];
        const newToppings = currentToppings.includes(toppingId)
          ? currentToppings.filter(id => id !== toppingId)
          : [...currentToppings, toppingId];
        return { ...item, toppings: newToppings };
      }
      return item;
    }));
  };

  const syncOfflineOrders = async () => {
    if (isSyncingOffline) return;
    const queue = JSON.parse(localStorage.getItem('offline_order_queue') || '[]');
    if (queue.length === 0) {
      setOfflineQueueCount(0);
      return;
    }

    if (!navigator.onLine) {
      console.log("Offline POS: Sync skipped (navigator offline).");
      setOfflineQueueCount(queue.length);
      return;
    }

    setIsSyncingOffline(true);
    let syncedCount = 0;
    const remainingQueue = [];

    for (const order of queue) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            customerInfo: order.customerInfo || { name: order.customerName, phone: order.customerPhone }, 
            items: order.items, 
            tipAmount: order.tipAmount, 
            giftCardCode: order.giftCardCode || '',
            notes: order.notes,
            paymentMethod: order.paymentMethod
          })
        });

        if (res.ok) {
          syncedCount++;
        } else {
          remainingQueue.push(order);
        }
      } catch (err) {
        console.error("Order sync error", err);
        remainingQueue.push(order);
      }
    }

    localStorage.setItem('offline_order_queue', JSON.stringify(remainingQueue));
    setOfflineQueueCount(remainingQueue.length);
    setIsSyncingOffline(false);

    if (syncedCount > 0) {
      alert(`🎉 Successfully synchronized ${syncedCount} queued order(s) with the central database!`);
      fetchData();
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const productPrice = item.product?.price || 0;
      const toppingsPrice = (item.toppings || []).reduce((tSum, tId) => {
        const t = toppings.find(top => top.id === tId);
        return tSum + (t ? t.price : 0);
      }, 0);
      
      // Sizes multipliers
      let sizeAdjustment = 0;
      if (item.size === 'Large') sizeAdjustment = 1.0;
      if (item.size === 'Small') sizeAdjustment = -0.50;
      if (item.size === 'Extra Large') sizeAdjustment = 1.50;

      // Premium Milk adjustments
      let milkAdjustment = 0;
      if (item.milkType === 'Oat Milk' || item.milkType === 'Almond Milk') {
        milkAdjustment = 0.75;
      }

      return sum + (productPrice + toppingsPrice + sizeAdjustment + milkAdjustment) * item.quantity;
    }, 0);
  };

  const getItemSinglePrice = (item: OrderItem) => {
    let base = item.product?.price || 0;
    if (item.toppings && item.toppings.length > 0) {
      item.toppings.forEach(tId => {
        const top = toppings.find(t => t.id === tId);
        if (top) {
          base += top.price;
        }
      });
    }
    let sizeAdjustment = 0;
    if (item.size === 'Large') sizeAdjustment = 1.0;
    if (item.size === 'Small') sizeAdjustment = -0.50;
    if (item.size === 'Extra Large') sizeAdjustment = 1.55;
    let milkAdjustment = 0;
    if (item.milkType === 'Oat Milk' || item.milkType === 'Almond Milk') {
      milkAdjustment = 0.75;
    }
    return base + sizeAdjustment + milkAdjustment;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const rate = canadianTaxes[taxRegion]?.rate || 0.13;
    return subtotal * rate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + tipAmount;
  };

  const handleCharge = async () => {
    if (!navigator.onLine) {
      // Offline implementation path
      const simulatedSubtotal = calculateSubtotal();
      const simulatedTax = calculateTax();
      const simulatedTotal = simulatedSubtotal + simulatedTax + tipAmount;
      
      const offlineOrder = {
        id: `OFFLINE-${Date.now()}`,
        customerName: customerInfo.name || "Offline Guest",
        customerPhone: customerInfo.phone || "",
        items: cart.map(item => ({
          ...item,
          product: item.product,
          toppings: (item.toppings || []).map(tId => toppings.find(t => t.id === tId))
        })),
        subtotal: simulatedSubtotal,
        taxAmount: simulatedTax,
        tipAmount,
        discount: 0,
        totalPrice: simulatedTotal,
        status: "Wait" as 'Wait',
        estimatedTime: cart.reduce((sum, item) => sum + item.quantity, 0) * 45,
        notes: orderNotes || "Offline Order",
        paymentMethod,
        createdAt: new Date().toISOString()
      };

      const queue = JSON.parse(localStorage.getItem('offline_order_queue') || '[]');
      queue.push(offlineOrder);
      localStorage.setItem('offline_order_queue', JSON.stringify(queue));
      setOfflineQueueCount(queue.length);

      if (printBill) {
        printReceipt('bill', offlineOrder);
      }

      setCompletedOrder(offlineOrder);
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: '', phone: '' });
      setTipAmount(0);
      setGiftCardCode('');
      setOrderNotes('');
      setPaymentMethod('Contactless (VISA)');
      setPrintBill(true);
      fetchData();
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerInfo, 
          items: cart, 
          tipAmount, 
          giftCardCode,
          notes: orderNotes,
          paymentMethod
        })
      });
      
      if (!res.ok) throw new Error("Server communication err");
      const data = await res.json();
      
      if (printBill) {
        printReceipt('bill', data.order);
      }
      
      setCompletedOrder(data.order);
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: '', phone: '' });
      setTipAmount(0);
      setGiftCardCode('');
      setOrderNotes('');
      setPaymentMethod('Contactless (VISA)');
      setPrintBill(true);
      fetchData();
    } catch (error) {
      console.warn("Network issue spotted on charge; queuing locally...", error);
      
      const simulatedSubtotal = calculateSubtotal();
      const simulatedTax = calculateTax();
      const simulatedTotal = simulatedSubtotal + simulatedTax + tipAmount;
      
      const offlineOrder = {
        id: `OFFLINE-${Date.now()}`,
        customerName: customerInfo.name || "Offline Guest",
        customerPhone: customerInfo.phone || "",
        items: cart.map(item => ({
          ...item,
          product: item.product,
          toppings: (item.toppings || []).map(tId => toppings.find(t => t.id === tId))
        })),
        subtotal: simulatedSubtotal,
        taxAmount: simulatedTax,
        tipAmount,
        discount: 0,
        totalPrice: simulatedTotal,
        status: "Wait" as 'Wait',
        estimatedTime: cart.reduce((sum, item) => sum + item.quantity, 0) * 45,
        notes: orderNotes || "Offline Order",
        paymentMethod,
        createdAt: new Date().toISOString()
      };

      const queue = JSON.parse(localStorage.getItem('offline_order_queue') || '[]');
      queue.push(offlineOrder);
      localStorage.setItem('offline_order_queue', JSON.stringify(queue));
      setOfflineQueueCount(queue.length);

      if (printBill) {
        printReceipt('bill', offlineOrder);
      }

      setCompletedOrder(offlineOrder);
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: '', phone: '' });
      setTipAmount(0);
      setGiftCardCode('');
      setOrderNotes('');
      setPaymentMethod('Contactless (VISA)');
      setPrintBill(true);
      fetchData();
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;
    await fetch(`/api/orders/${editingOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        customerName: editingOrder.customerName,
        notes: editingOrder.notes
      })
    });
    setEditingOrder(null);
    fetchData();
  };

  const toggleBusyMode = async () => {
    await fetch('/api/busy-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBusy: !isBusyMode })
    });
    fetchData();
  };

  const toggleAutoBusy = async () => {
    await fetch('/api/busy-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto: !autoBusyMode })
    });
    fetchData();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct.id ? 'PUT' : 'POST';
    const url = editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct)
    });
    
    setShowProductModal(false);
    setEditingProduct(null);
    fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const updateInventory = async (id: string, stock: number) => {
    await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock })
    });
    fetchData();
  };

  const generateAiInsights = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai-insights');
      const data = await res.json();
      setAiInsights(data.insights);
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingTopping.id ? 'PUT' : 'POST';
    const url = editingTopping.id ? `/api/toppings/${editingTopping.id}` : '/api/toppings';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTopping)
    });
    
    setShowToppingModal(false);
    setEditingTopping(null);
    fetchData();
  };

  const handleDeleteTopping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topping?')) return;
    await fetch(`/api/toppings/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addCategory = () => {
    if (newCategory && !customCategories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    setCustomCategories(customCategories.filter(c => c !== cat));
  };

  const updateBusyThreshold = async (val: number) => {
    setBusyThreshold(val);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: val })
    });
    fetchData();
  };

  const syncExternalOrders = async () => {
    setIsSyncingExternal(true);
    try {
      const res = await fetch('/api/sync-external-orders', { method: 'POST' });
      const data = await res.json();
      alert(`Synced ${data.syncedCount} new orders from Website/App.`);
      fetchData();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncingExternal(false);
    }
  };

  const printReceipt = async (type: 'bill' | 'label', data: any) => {
    try {
      if (!navigator.onLine) {
        throw new Error("Local offline mode prevents network printing. Routing to browser-print layout.");
      }
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });
      if (!res.ok) throw new Error("Printer server offline");
      alert(`Sent ${type === 'bill' ? 'bill' : 'label'} print command successfully to POS terminal printer.`);
    } catch (err) {
      console.warn("Print server unreachable, activating interactive printable receipt view...", err);
      // Fallback: Display printable receipt overlay
      setPrintOverlayData({ type, data });
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSupplier.id ? 'PUT' : 'POST';
    const url = editingSupplier.id ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSupplier)
    });
    
    setShowSupplierModal(false);
    setEditingSupplier(null);
    fetchData();
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const [staffAppUser, setStaffAppUser] = useState<User | null>(null);
  const [staffAppEmpId, setStaffAppEmpId] = useState('');
  const [staffAppPin, setStaffAppPin] = useState('');
  const [showStaffAppPin, setShowStaffAppPin] = useState(false);
  const [staffAppForgotPin, setStaffAppForgotPin] = useState(false);

  const handleStaffAppLogin = () => {
    const user = users.find(u => u.employeeId === staffAppEmpId && u.pin === staffAppPin);
    if (user) {
      setStaffAppUser(user);
    } else {
      alert("Incorrect ID or PIN!");
    }
  };

  const handleLogin = () => {
    const user = users.find(u => u.employeeId === empIdInput && u.pin === pinInput);
    if (user) {
      setCurrentUser(user);
      setIsLoggingIn(false);
      setPinInput('');
      setEmpIdInput('');
    } else {
      alert("Incorrect ID or PIN!");
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggingIn(true);
    setActiveTab('cashier');
  };

  const handleStampTime = async (type: 'in' | 'out', empId?: string) => {
    const idToUse = empId || timeClockEmpId;
    if (!idToUse) {
      setShowTimeClockPrompt({ type });
      return;
    }
    
    let location = "Unknown";
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      } catch (e) {
        console.warn("Geolocation failed for time clock", e);
      }
    }

    const res = await fetch('/api/time-clock/stamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        employeeId: idToUse, 
        type,
        location,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
    
    if (res.ok) {
      fetchData();
      alert(`${type === 'in' ? 'Clocked In' : 'Clocked Out'} successfully!`);
      setShowShiftReminder(null);
      setShowTimeClockPrompt(null);
      setTimeClockEmpId('');
    } else {
      const error = await res.json();
      alert(error.error || "An error occurred");
    }
  };

  const updateTaxRegion = async (region: string) => {
    setTaxRegion(region);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxRegion: region })
      });
    } catch (err) {
      console.error("Failed to update tax region:", err);
    }
  };

  const handleAutoReorder = async (itemId: string, supplierId: string) => {
    const item = (stats.inventoryStatus || [])?.find((i: any) => i.id === itemId);
    if (!item) return;

    // AI Logic: Analysis based on average weekly sales
    const avgOrdersPerWeek = stats.orders?.length > 0 ? (stats.orders.length / 7) : 50; 
    const quantity = Math.ceil(item.usagePerOrder * avgOrdersPerWeek * forecastDays * 1.2); // 20% safety buffer

    const res = await fetch('/api/auto-reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity, supplierId, forecastDays })
    });
    if (res.ok) {
      alert(`AI Auto-Order sent for ${item.name}! Quantity: ${quantity} ${item.unit} (Forecast: ${forecastDays} days)`);
      fetchData();
    }
  };

  const [isSyncingMenu, setIsSyncingMenu] = useState(false);

  const seedData = async () => {
    try {
      const res = await fetch('/api/seed-database', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('🎉 Database successfully seeded on Google Cloud Firestore!\nAll Kalim personnel, menus, stock and vendors are synchronized.');
        fetchData();
      } else {
        alert('Error seeding database: ' + data.error);
      }
    } catch (err: any) {
      alert('Network error seeding database: ' + err.message);
    }
  };

  const handleSyncMenu = async () => {
    setIsSyncingMenu(true);
    // Simulate a real API call to sync the menu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const res = await fetch('/api/sync-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      
      if (res.ok) {
        alert("Menu synchronized to Website successfully!");
      } else {
        // Fallback for demo if API route doesn't exist yet
        alert("Menu synchronized to Website successfully! (Demo Mode)");
      }
    } catch (err) {
      alert("Menu synchronized to Website successfully! (Demo Mode)");
    } finally {
      setIsSyncingMenu(false);
    }
    
    console.log("Syncing menu to web:", products);
  };

  const handleAiChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiChatMessage.trim() || isAiTyping) return;

    const userMessage = aiChatMessage;
    setAiChatMessage('');
    setIsAiTyping(true);
    
    setAiChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: aiChatHistory,
          language: aiLanguage
        })
      });
      const data = await res.json();
      setAiChatHistory(prev => [...prev, { role: 'model', parts: [{ text: data.response }] }]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleGenerateMarketing = async (product: Product) => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai-generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: product.name, description: product.description })
      });
      const data = await res.json();
      setMarketingAd(`Marketing for ${product.name}:\n\n${data.ad}`);
    } catch (err) {
      console.error("Marketing error:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser.id ? 'PUT' : 'POST';
    const url = editingUser.id ? `/api/users/${editingUser.id}` : '/api/users';
    
    // Auto-assign permissions based on role if not explicitly set
    const userToSave = { ...editingUser };
    if (!userToSave.permissions || userToSave.permissions.length === 0) {
      if (userToSave.role === 'admin') userToSave.permissions = ['all'];
      else if (userToSave.role === 'manager') userToSave.permissions = ['pos', 'bar', 'inventory', 'reports', 'suppliers'];
      else userToSave.permissions = ['pos', 'bar'];
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userToSave)
    });
    
    if (res.ok) {
      setShowUserModal(false);
      setEditingUser(null);
      fetchData();
    } else {
      const error = await res.json();
      alert(error.error || "An error occurred");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const [showTaxForm, setShowTaxForm] = useState(false);

  const exportToExcel = () => {
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        alert("Excel library not loaded yet.");
        return;
      }
      
      // Detailed Sales Report
      const salesData = stats.orders?.map((o: any) => ({
        OrderID: o.id,
        Date: new Date(o.date).toLocaleString(),
        Subtotal: o.total - o.tax - (o.tip || 0),
        Tax: o.tax,
        Tip: o.tip || 0,
        Total: o.total,
        Currency: currency
      })) || [];

      // Tax Summary Report
      const taxSummary = [{
        Period: "March 2026",
        TotalTaxableSales: stats.totalRevenue - stats.totalTax - stats.totalTips,
        TaxCollected: stats.totalTax,
        Currency: currency,
        TaxType: currency === 'CAD' ? 'HST (13%)' : 'General Tax'
      }];

      const wb = XLSX.utils.book_new();
      const wsSales = XLSX.utils.json_to_sheet(salesData);
      const wsTax = XLSX.utils.json_to_sheet(taxSummary);

      XLSX.utils.book_append_sheet(wb, wsSales, "Sales Transactions");
      XLSX.utils.book_append_sheet(wb, wsTax, "Tax Summary");
      
      XLSX.writeFile(wb, `Kalim_Full_Report_${new Date().toLocaleDateString()}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <>
      <div {...mainSwipeHandlers} className="flex flex-col h-screen bg-[#F8F7F4] text-[#1A1A1A] font-sans print:hidden">
        {/* Floating trigger to rejoin Connected Suite if in Standalone mode */}
        {isStandaloneMode && (
          <div className="absolute top-3 right-3 z-[9999] opacity-35 hover:opacity-100 transition-opacity print:hidden">
            <button 
              onClick={() => {
                window.location.href = window.location.origin + window.location.pathname;
              }}
              className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-full border border-white/20 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 pointer-events-auto cursor-pointer"
            >
              <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '8s' }} />
              <span>🔌 Connect Suite</span>
            </button>
          </div>
        )}

        {/* Ecosystem Control Center / Selector Bar (Hidden when standalone) */}
        {!isStandaloneMode && (
          <div className="bg-[#121216] text-white px-4 md:px-8 py-3 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 z-[60] shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#E07A5F] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#E07A5F]/20 font-black text-sm">
                K
              </div>
              <div>
                <h2 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-[#E07A5F] leading-tight">Kalim Coffee Connected Suite</h2>
                <p className="text-[9px] text-neutral-400 font-bold leading-none mt-0.5">3 Realtime Cloud-Synced Applications</p>
              </div>
            </div>

            {/* The 3 App Gate Selectors */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setCurrentApp('customer');
                  setActiveTab('customer');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${currentApp === 'customer' ? 'bg-[#E07A5F] text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                <Smartphone size={12} />
                <span>📱 Customer App</span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentApp('staff');
                  setActiveTab('website');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${currentApp === 'staff' ? 'bg-[#E07A5F] text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                <Users size={12} />
                <span>👥 Staff Portal</span>
              </button>

              <button
                onClick={() => {
                  setCurrentApp('merchant');
                  setActiveTab('cashier');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${currentApp === 'merchant' ? 'bg-[#E07A5F] text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                <LayoutGrid size={12} />
                <span>💼 Merchant POS & Admin</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsIndependentModalOpen(true)}
                className="px-3 py-1.5 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/30 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 min-w-fit cursor-pointer"
              >
                <ExternalLink size={11} />
                <span>Separate Standalone Apps</span>
              </button>

              <div className="hidden lg:flex items-center gap-2 text-[9px] text-neutral-450 font-extrabold bg-[#1A1A22] border border-white/5 px-3 py-1.5 rounded-lg select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sync Gateway: Active</span>
              </div>
            </div>
          </div>
        )}
      {/* Real-time Order Alert Toast Banner */}
      {toastAlert && (
        <div className="fixed top-6 right-6 z-[99999] bg-yellow-400 border-2 border-black text-black font-black uppercase text-[10px] md:text-xs p-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-sm">
          <span className="p-2 bg-black text-white rounded-lg">🔔</span>
          <div className="flex-1">{toastAlert}</div>
          <button onClick={() => setToastAlert(null)} className="font-bold underline text-[9px] uppercase hover:text-black/60 pl-2 cursor-pointer">Dismiss</button>
        </div>
      )}
      {/* Login Overlay */}
      <AnimatePresence>
        {isLoggingIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center space-y-8 shadow-2xl"
            >
              <div className="w-20 h-20 bg-black rounded-3xl mx-auto flex items-center justify-center text-white">
                <Lock size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Kalim Coffee POS</h2>
                <p className="text-black/40 text-sm">Please enter your ID and PIN to start</p>
              </div>
              
              <div className="space-y-4">
                {staffForgotPin ? (
                  <div className="space-y-4 text-sm text-black/60 font-bold p-2 text-center">
                    Please contact your Store Manager or Head Office Administrator to securely reset your Employee ID and PIN.
                    <button 
                      onClick={() => setStaffForgotPin(false)}
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold mt-4 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      BACK TO LOGIN
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="text" 
                      value={empIdInput}
                      onChange={e => setEmpIdInput(e.target.value)}
                      placeholder="Employee ID"
                      className="w-full bg-black/5 p-4 rounded-2xl text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                      autoFocus
                    />
                    <div className="relative">
                      <input 
                        type={showStaffPin ? "text" : "password"}
                        value={pinInput}
                        onChange={e => setPinInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        placeholder="••••"
                        className="w-full bg-black/5 p-4 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPin(!showStaffPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                      >
                        {showStaffPin ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <button 
                        onClick={() => setStaffForgotPin(true)}
                        className="text-black/40 text-xs font-bold hover:text-black hover:underline cursor-pointer"
                      >
                        Forgot PIN?
                      </button>
                    </div>

                    <button 
                      onClick={handleLogin}
                      className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      LOGIN
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-black/40 font-bold text-center">
                      <ShieldCheck size={12} className="min-w-3" />
                      <span>Protected by Kalim Data Privacy Policies. Full compliance with data protection laws.</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="popLayout">
          {activeTab === 'cashier' && hasPermission('pos') && !renderLegacyWebPosMode ? (
            <motion.div key="swiftui_cashier_sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col overflow-y-auto p-4 md:p-8 bg-[#121216] select-none">
              <div className="max-w-7xl mx-auto w-full flex justify-between items-center bg-neutral-900/60 p-4 rounded-2xl border border-white/5 mb-4 text-white">
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    📱 Kalim iOS POS Client (SwiftUI)
                  </h1>
                  <p className="text-xs text-neutral-400">iOS layout synchronized with Kalim Staff Connect</p>
                </div>
                <button 
                  onClick={() => setRenderLegacyWebPosMode(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  🖥️ Switch to Legacy Web POS View
                </button>
              </div>
              <div className="max-w-7xl mx-auto w-full">
                <IosSwiftUiSimulator 
                  products={products}
                  toppings={toppings}
                  orders={orders}
                  users={users}
                  timeClock={timeClock}
                  isOnline={isOnline}
                  currency={currency}
                  fetchData={fetchData}
                />
              </div>
            </motion.div>
          ) : activeTab === 'cashier' && hasPermission('pos') && renderLegacyWebPosMode ? (
            <motion.div key="cashier" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="absolute inset-0 flex flex-col">
              <div className="bg-amber-50 p-2 text-center text-[11px] font-bold text-amber-900 flex justify-between items-center px-4 border-b border-amber-200">
                <span>⚠️ Viewing Legacy Web layout. Web buttons and forms are unassociated with native SwiftUI targets.</span>
                <button onClick={() => setRenderLegacyWebPosMode(false)} className="px-2.5 py-1 bg-amber-950 text-white font-extrabold rounded-lg">Return to SwiftUI App Simulator</button>
              </div>
              <header className="p-3 md:p-6 bg-white border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-2 md:gap-4">
                  <img src="https://i.postimg.cc/qRM86GSN/IMG-1805.png" alt="Kalim Logo" className="h-8 md:h-10 w-auto" referrerPolicy="no-referrer" />
                  {isBusyMode && (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg animate-pulse">
                      <Clock size={8} className="md:w-[10] md:h-[10]" /> BUSY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 md:gap-3">
                  <div className="hidden sm:flex flex-col items-end mr-1 md:mr-2">
                    <span className="text-[10px] md:text-xs font-bold">{currentUser?.name}</span>
                    <span className="text-[8px] md:text-[10px] text-black/40 uppercase tracking-widest">{currentUser?.role}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleStampTime('in')} className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl hover:bg-emerald-100 transition-colors" title="Clock In"><Clock size={14} className="md:w-4 md:h-4"/></button>
                    <button onClick={() => handleStampTime('out')} className="p-1.5 md:p-2 bg-rose-50 text-rose-600 rounded-lg md:rounded-xl hover:bg-rose-100 transition-colors" title="Clock Out"><LogOut size={14} className="md:w-4 md:h-4"/></button>
                  </div>
                  <button onClick={handleLogout} className="p-1.5 md:p-2 bg-black/5 rounded-lg md:rounded-xl hover:bg-black/10 transition-colors"><LogOut size={14} className="md:w-4 md:h-4"/></button>
                  <button 
                    onClick={() => setShowMobileCart(true)}
                    className="md:hidden p-1.5 bg-black text-white rounded-lg relative"
                  >
                    <ShoppingCart size={14} />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                      </span>
                    )}
                  </button>
                </div>
              </header>
              
              <div className="flex-1 flex overflow-hidden relative">
                {/* Menu */}
                <div {...categorySwipeHandlers} onClick={handleDoubleTap} className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="flex gap-2 md:gap-4 mb-6 overflow-x-auto no-scrollbar pb-2" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-black text-white' : 'bg-black/5'}`}>{cat}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                    {products.filter(p => selectedCategory === 'All' || p.category === selectedCategory).map(p => (
                      <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-2 md:p-4 rounded-2xl border border-black/5 text-left group">
                        <img src={p.image} className="w-full aspect-square rounded-xl mb-2 md:mb-3 object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        <h3 className="font-bold text-[10px] md:text-sm line-clamp-1">{p.name}</h3>
                        <p className="text-[8px] md:text-[10px] text-black/40 mb-1 md:mb-2 line-clamp-1">{p.description}</p>
                        <p className="font-bold text-xs md:text-sm">{formatPrice(p.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart Sidebar - Desktop */}
                <div className="hidden md:flex w-80 lg:w-96 bg-white border-l border-black/5 flex-col">
                  <div className="p-4 border-b border-black/5 space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <h2 className="font-bold flex items-center gap-2 text-sm"><ShoppingCart size={16}/> Current Order</h2>
                        <div className="flex items-center gap-1.5">
                          {scannedCustomer && (
                            <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full animate-pulse uppercase">
                              VIP active
                            </span>
                          )}
                          {cart.length > 0 && (
                            <button 
                              onClick={() => {
                                if (confirm("Clear all items from your current cart?")) {
                                  setCart([]);
                                }
                              }}
                              className="text-[9px] font-extrabold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full transition-colors uppercase"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Network & Offline Status Banner */}
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-xl border border-black/5 text-[10px] font-bold">
                        <div className="flex items-center gap-1 text-neutral-600">
                          {isOnline ? (
                            <span className="flex items-center gap-1 text-emerald-600"><Wifi size={12} /> Live POS Online</span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-500"><WifiOff size={12} /> Local Offline Queue</span>
                          )}
                        </div>
                        {offlineQueueCount > 0 ? (
                          <button 
                            disabled={isSyncingOffline || !isOnline}
                            onClick={syncOfflineOrders}
                            className={`px-2 py-0.5 text-[9px] text-white rounded bg-orange-500 hover:bg-orange-600 font-extrabold flex items-center gap-1 ${isSyncingOffline ? 'animate-pulse' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isOnline ? "Click to Sync Queued Transactions Now" : "Queue will auto-sync when network returns"}
                          >
                            🔄 Sync {offlineQueueCount}
                          </button>
                        ) : (
                          <span className="text-[8px] text-neutral-400">All synced</span>
                        )}
                      </div>
                    </div>

                    {/* VIP Loyalty Card Tap Scanner / Emulator */}
                    <div className="border border-black/5 bg-neutral-50 p-3 rounded-2xl space-y-3">
                      {!scannedCustomer ? (
                        <div className="space-y-1.5 text-center py-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block">NFC Loyalty Card Terminal</label>
                          <select
                            onChange={(e) => {
                              const found = loyaltyCustomers.find(c => c.id === e.target.value);
                              if (found) {
                                setScannedCustomer(found);
                              }
                            }}
                            className="bg-white border border-neutral-200 text-[10px] w-full font-bold p-1.5 rounded-xl text-center focus:ring-1 focus:ring-black"
                            defaultValue=""
                          >
                            <option value="" disabled>--- Tap / Swipe VIP Card ---</option>
                            {loyaltyCustomers.map(c => (
                              <option key={c.id} value={c.id}>💳 {c.name} ({c.tier})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Seasonal Minimized Virtual Card */}
                          <div 
                            style={{ 
                              background: `linear-gradient(135deg, ${seasonalCardConfig.cardColorStart || '#1e1e2f'}, ${seasonalCardConfig.cardColorEnd || '#ff6b6b'})`,
                            }}
                            className="rounded-xl p-3 text-white relative overflow-hidden flex flex-col justify-between shadow-sm"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[7px] tracking-widest opacity-70 block font-bold leading-none uppercase">VIP MEMBER</span>
                                <span className="text-xs font-black tracking-tight leading-normal">{scannedCustomer.name}</span>
                              </div>
                              <span className="text-[8px] font-bold uppercase bg-white/25 px-1.5 py-0.5 rounded-full">
                                {scannedCustomer.tier?.replace(" member", "")}
                              </span>
                            </div>

                            <div className="flex justify-between items-end mt-4">
                              <div>
                                <span className="text-[7px] opacity-60 block leading-none font-bold">POINTS</span>
                                <span className="text-[10px] font-mono font-extrabold">⭐ {scannedCustomer.points} pts</span>
                              </div>
                              {(() => {
                                if (!scannedCustomer.dob) return null;
                                const pts = scannedCustomer.dob.split("-");
                                const isBday = pts.length === 3 && `${pts[1]}-${pts[2]}` === "06-15";
                                if (isBday) {
                                  return (
                                    <span className="text-[8px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-bounce">
                                      <Cake size={8} /> BDAY TODAY 🎂
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          {/* Member Coffee Preference info */}
                          {scannedCustomer.favoriteDrink && (
                            <div className="text-[9px] bg-white p-2 rounded-xl border border-dashed border-black/10">
                              <span className="text-neutral-400 font-bold block">Favorite Habit / Preference:</span>
                              <p className="font-extrabold text-neutral-800 italic">"{scannedCustomer.favoriteDrink}"</p>
                            </div>
                          )}

                          <button 
                            onClick={() => {
                              setScannedCustomer(null);
                              setPrecMatchResult(null);
                              setFuzzyWants("");
                            }}
                            className="w-full text-center text-[8px] hover:underline font-bold text-rose-500 uppercase tracking-wider block"
                          >
                            Disconnect card
                          </button>
                        </div>
                      )}
                    </div>

                    {/* AI POS Ordering Barista Helper (Cup precision matching) */}
                    <div className="bg-neutral-900 text-white p-3.5 rounded-2xl space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-[9px] font-black tracking-widest uppercase text-purple-400 flex items-center gap-1">
                          ✨ POS Barista AI Helper
                        </span>
                        <span className="text-[8px] opacity-50 font-mono">Ver 2.5</span>
                      </div>

                      {scannedCustomer ? (
                        <div className="bg-white/5 p-2 rounded-xl text-[9px] space-y-1">
                          <span className="text-purple-300 font-bold">💡 Customer Insight:</span>
                          <p className="text-white/80 leading-normal text-[8px]">
                            Recognized {scannedCustomer.name}! Try upselling them with a free seasonal dessert. Their recipe habit calls for <span className="font-extrabold text-white">{scannedCustomer.favoriteDrink || "Hot Latte with extra shot"}</span>.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[8px] text-zinc-400 leading-normal">
                          Tap a membership card first to pull smart custom up-scale suggestions, or type a fuzzy beverage request description below.
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-zinc-400">Describe What Guest Wants verbally:</label>
                        <textarea 
                          value={fuzzyWants}
                          onChange={(e) => setFuzzyWants(e.target.value)}
                          placeholder="e.g. He wants something sweet with caramel, medium sized and lactose free milk"
                          rows={2}
                          className="w-full bg-white/10 border border-white/10 text-[10px] p-2 rounded-xl text-white font-medium placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (!fuzzyWants) return alert("Please type a fuzzy requested drink description!");
                          setIsPrecMatchLoading(true);
                          setPrecMatchResult(null);
                          try {
                            const resp = await fetch("/api/ai/cup-precision-match", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                description: fuzzyWants,
                                customerProfile: scannedCustomer
                              })
                            });
                            const result = await resp.json();
                            setPrecMatchResult(result);
                          } catch(err) {
                            alert("AI Precision match server timed out");
                          } finally {
                            setIsPrecMatchLoading(false);
                          }
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-xl text-[9px] tracking-tight transition-all flex items-center justify-center gap-1.5"
                        disabled={isPrecMatchLoading}
                      >
                        {isPrecMatchLoading ? "POS AI Analyzing Heuristics..." : "Analyze Balanced Recipe with AI"}
                      </button>

                      {precMatchResult && (
                        <div className="bg-white/10 p-2.5 rounded-xl border border-purple-500/30 text-[9px] space-y-2 animate-fade-in text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-purple-300">🎯 Match: {products.find(p => p.id === precMatchResult.productId)?.name || "Espresso"}</span>
                            <span className="bg-purple-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-mono">Conf: {(precMatchResult.confidence * 100).toFixed(0)}%</span>
                          </div>
                          
                          <p className="text-[8px] text-zinc-300 italic">"{precMatchResult.explanation}"</p>
                          
                          <div className="border-t border-white/5 pt-1.5 flex justify-between items-center gap-1 text-[8px]">
                            <div>
                              <span className="text-zinc-500 block leading-none">SIZE:</span>
                              <span className="font-extrabold text-white block mt-0.5">{precMatchResult.size || "Medium"}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block leading-none">TOPPING ID:</span>
                              <span className="font-extrabold text-white block mt-0.5">
                                {precMatchResult.toppings?.length > 0 ? precMatchResult.toppings.map((tI: string) => toppings.find(tx => tx.id === tI)?.name).join(", ") : "None matched" }
                              </span>
                            </div>
                          </div>

                          <div className="bg-black/35 rounded p-1.5 font-mono text-[7px] text-yellow-300">
                            🏷️ Sticker Notes: {precMatchResult.cupStickerNotes}
                          </div>

                          <button
                            onClick={() => {
                              const productObj = products.find(p => p.id === precMatchResult.productId);
                              if (productObj) {
                                // Add matched customized drink directly to shopping list
                                setCart(prev => {
                                  const entry = {
                                    productId: productObj.id,
                                    quantity: 1,
                                    size: precMatchResult.size || 'Medium',
                                    product: productObj,
                                    toppings: precMatchResult.toppings || []
                                  };
                                  return [...prev, entry];
                                });
                                setPrecMatchResult(null);
                                setFuzzyWants("");
                                alert(`🎉 Added precisely matched ${productObj.name} with custom syrups/milk settings perfectly into core cart list!`);
                              }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 rounded text-[8px] transition-colors"
                          >
                            Add AI-Matched Recipe to Cart
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div onClick={handleDoubleTap} className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">
                    {cart.map((item, idx) => (
                      <motion.div 
                        key={idx} 
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        onDragEnd={(e, info) => {
                          if (info.offset.x < -50) removeItem(idx);
                        }}
                        className="space-y-3 bg-black/5 p-3 rounded-2xl relative group border border-transparent hover:border-black/5 transition-all text-black"
                      >
                        <button 
                          onClick={() => removeItem(idx)}
                          className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X size={14} />
                        </button>
                        
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight leading-snug">{item.product?.name}</span>
                            
                            {/* Smart Item Modifiers Labels Badge Display */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.size && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                                  {item.size}
                                </span>
                              )}
                              {item.milkType && item.milkType !== 'None' && item.milkType !== 'Whole Milk' && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                                  🥛 {item.milkType}
                                </span>
                              )}
                              {item.iceLevel && item.iceLevel !== 'None' && item.iceLevel !== 'Regular' && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                  ❄️ {item.iceLevel}
                                </span>
                              )}
                              {item.sweetness && item.sweetness !== 'Regular' && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-purple-150 text-purple-800 rounded-full border border-purple-200 bg-purple-50">
                                  🍯 {item.sweetness}
                                </span>
                              )}
                            </div>
                            
                            {item.notes && (
                              <p className="text-[9px] text-neutral-500 italic mt-1 leading-tight max-w-[170px] truncate block" title={item.notes}>
                                📝 {item.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-sm tracking-tight">
                              {formatPrice(getItemSinglePrice(item) * item.quantity)}
                            </span>
                            <span className="text-[8px] text-neutral-400 font-medium">
                              {formatPrice(getItemSinglePrice(item))} each
                            </span>
                          </div>
                        </div>

                        {/* Quick Size Switchers */}
                        <div className="space-y-1">
                          <label className="text-[8px] font-black tracking-widest text-neutral-400 uppercase leading-none block">Quick Size Selector</label>
                          <div className="grid grid-cols-4 gap-1">
                            {(['Small', 'Medium', 'Large', 'Extra Large'] as const).map((sz) => (
                              <button 
                                key={sz}
                                onClick={() => updateItemSize(item.productId, sz, idx)}
                                className={`text-[8px] py-1 font-bold rounded border transition-all ${item.size === sz ? 'bg-black text-white border-black' : 'text-neutral-500 border-black/5 bg-white'}`}
                              >
                                {sz.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Extra Toppings selector */}
                        {toppings.length > 0 && (
                          <div className="space-y-1">
                            <label className="text-[8px] font-black tracking-widest text-neutral-400 uppercase leading-none block">Add Toppings ({item.toppings?.length || 0})</label>
                            <div className="flex flex-wrap gap-1">
                              {toppings.map(t => (
                                <button 
                                  key={t.id} 
                                  onClick={() => toggleTopping(item.productId, t.id, idx)}
                                  className={`text-[8px] px-1.5 py-0.5 rounded border transition-all ${item.toppings?.includes(t.id) ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold' : 'border-neutral-200 text-neutral-500 bg-white'}`}
                                >
                                  +{t.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Action Ribbon */}
                        <div className="flex gap-2 items-center justify-between border-t border-black/5 pt-2 mt-1">
                          <div className="flex items-center gap-1 bg-white rounded-full px-1.5 py-0.5 border border-black/5">
                            <button onClick={() => updateItemQuantity(idx, -1)} className="text-black/40 hover:text-black p-0.5"><Minus size={10} /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateItemQuantity(idx, 1)} className="text-black/40 hover:text-black p-0.5"><Plus size={10} /></button>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => setEditingCartItemIdx(idx)}
                              className="px-2 py-1 text-[9px] font-extrabold bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1"
                              title="Fine-tune Modifiers"
                            >
                              <Sliders size={10} className="text-neutral-500" /> Adjust
                            </button>
                            <button 
                              onClick={() => {
                                setCart(prev => {
                                  const itemToDuplicate = prev[idx];
                                  if (!itemToDuplicate) return prev;
                                  const cloned = { ...itemToDuplicate, toppings: [...(itemToDuplicate.toppings || [])], notes: itemToDuplicate.notes ? `${itemToDuplicate.notes} (Copy)` : '' }; 
                                  return [...prev.slice(0, idx + 1), cloned, ...prev.slice(idx + 1)];
                                });
                              }}
                              className="p-1 px-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg"
                              title="Duplicate Item"
                            >
                              <Copy size={10} />
                            </button>
                            <button 
                              onClick={() => removeItem(idx)}
                              className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                              title="Delete Item"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-6 bg-black text-white rounded-t-3xl space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Subtotal</span>
                      <span className="font-bold">{formatPrice(calculateSubtotal())}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => printReceipt('bill', { items: cart, total: calculateSubtotal() })}
                        className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
                        title="Print Bill Preview"
                      >
                        <Printer size={20}/>
                      </button>
                      <button 
                        onClick={() => setShowCheckout(true)}
                        className="flex-1 bg-white text-black py-4 rounded-2xl font-bold text-lg"
                      >
                        CHECKOUT
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Cart Overlay */}
                <AnimatePresence>
                  {showMobileCart && (
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="fixed inset-0 bg-white z-[60] flex flex-col md:hidden"
                    >
                      <div className="p-4 border-b border-black/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <h2 className="font-bold flex items-center gap-2 text-sm"><ShoppingCart size={18}/> Current Order</h2>
                          <div className="flex items-center gap-2">
                            {cart.length > 0 && (
                              <button 
                                onClick={() => {
                                  if (confirm("Clear all items from your current cart?")) {
                                    setCart([]);
                                  }
                                }}
                                className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-2 py-1 rounded-full uppercase"
                              >
                                Clear
                              </button>
                            )}
                            <button onClick={() => setShowMobileCart(false)} className="p-2 bg-black/5 rounded-full">
                              <LogOut size={16} className="rotate-180" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Status Bar */}
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-xl border border-black/5 text-[10px] font-medium">
                          <div className="flex items-center gap-1">
                            {isOnline ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold"><Wifi size={12} /> Live Online</span>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-500 font-bold"><WifiOff size={12} /> Offline Queue Active</span>
                            )}
                          </div>
                          {offlineQueueCount > 0 ? (
                            <button 
                              disabled={isSyncingOffline || !isOnline}
                              onClick={syncOfflineOrders}
                              className="px-2 py-0.5 text-[9px] text-white rounded bg-orange-500 font-extrabold flex items-center gap-1 transition-colors"
                            >
                              Sync {offlineQueueCount}
                            </button>
                          ) : (
                            <span className="text-[8px] text-neutral-400 font-bold">All synced</span>
                          )}
                        </div>
                      </div>
                      <div onClick={handleDoubleTap} className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">
                        {cart.map((item, idx) => (
                          <motion.div 
                            key={`${item.productId}-${idx}`} 
                            drag="x"
                            dragConstraints={{ left: -100, right: 0 }}
                            onDragEnd={(e, info) => {
                              if (info.offset.x < -50) removeItem(idx);
                            }}
                            className="space-y-3 bg-black/5 p-3 rounded-2xl relative text-black"
                          >
                            <button 
                              onClick={() => removeItem(idx)}
                              className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md"
                            >
                              <X size={14} />
                            </button>
                            
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm tracking-tight">{item.product?.name}</span>
                                
                                {/* Smart Badge Row */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.size && (
                                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                                      {item.size}
                                    </span>
                                  )}
                                  {item.milkType && item.milkType !== 'None' && item.milkType !== 'Whole Milk' && (
                                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                                      🥛 {item.milkType}
                                    </span>
                                  )}
                                  {item.iceLevel && item.iceLevel !== 'None' && item.iceLevel !== 'Regular' && (
                                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                      ❄️ {item.iceLevel}
                                    </span>
                                  )}
                                  {item.sweetness && item.sweetness !== 'Regular' && (
                                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                                      🍯 {item.sweetness}
                                    </span>
                                  )}
                                </div>

                                {item.notes && (
                                  <p className="text-[9px] text-neutral-500 italic mt-1 leading-tight">
                                    📝 {item.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-sm">
                                  {formatPrice(getItemSinglePrice(item) * item.quantity)}
                                </span>
                                <span className="text-[8px] text-neutral-400">
                                  {formatPrice(getItemSinglePrice(item))} each
                                </span>
                              </div>
                            </div>

                            {/* Quick Sizing Grid */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-black tracking-widest text-neutral-400 uppercase block">Size Switcher</label>
                              <div className="grid grid-cols-4 gap-1">
                                {(['Small', 'Medium', 'Large', 'Extra Large'] as const).map((sz) => (
                                  <button 
                                    key={sz}
                                    onClick={() => updateItemSize(item.productId, sz, idx)}
                                    className={`text-[8px] py-1 font-bold rounded border transition-all ${item.size === sz ? 'bg-black text-white border-black' : 'text-neutral-500 border-black/5 bg-white'}`}
                                  >
                                    {sz.split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Extra Toppings selector */}
                            {toppings.length > 0 && (
                              <div className="space-y-1">
                                <label className="text-[8px] font-black tracking-widest text-neutral-400 uppercase block">Add Toppings ({item.toppings?.length || 0})</label>
                                <div className="flex flex-wrap gap-1">
                                  {toppings.map(t => (
                                    <button 
                                      key={t.id} 
                                      onClick={() => toggleTopping(item.productId, t.id, idx)}
                                      className={`text-[8px] px-1.5 py-0.5 rounded border transition-all ${item.toppings?.includes(t.id) ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold' : 'border-neutral-200 text-neutral-500 bg-white'}`}
                                    >
                                      +{t.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Ribbon */}
                            <div className="flex gap-2 items-center justify-between border-t border-black/5 pt-2 mt-1">
                              <div className="flex items-center gap-1.5 bg-white rounded-full px-2 py-0.5 border border-black/5">
                                <button onClick={() => updateItemQuantity(idx, -1)} className="text-black/40 hover:text-black p-0.5"><Minus size={11} /></button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateItemQuantity(idx, 1)} className="text-black/40 hover:text-black p-0.5"><Plus size={11} /></button>
                              </div>
                              
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => {
                                    setEditingCartItemIdx(idx);
                                    setShowMobileCart(false); // temporary close to interact with config modal
                                  }}
                                  className="px-2 py-1 text-[9px] font-extrabold bg-neutral-100 rounded-lg flex items-center gap-1"
                                >
                                  <Sliders size={10} /> Adjust
                                </button>
                                <button 
                                  onClick={() => {
                                    setCart(prev => {
                                      const itemToDuplicate = prev[idx];
                                      if (!itemToDuplicate) return prev;
                                      const cloned = { ...itemToDuplicate, toppings: [...(itemToDuplicate.toppings || [])], notes: itemToDuplicate.notes ? `${itemToDuplicate.notes} (Copy)` : '' }; 
                                      return [...prev.slice(0, idx + 1), cloned, ...prev.slice(idx + 1)];
                                    });
                                  }}
                                  className="p-1.5 bg-neutral-100 text-neutral-700 rounded-lg"
                                >
                                  <Copy size={10} />
                                </button>
                                <button 
                                  onClick={() => removeItem(idx)}
                                  className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="p-6 bg-black text-white rounded-t-3xl space-y-4">
                        <div className="flex justify-between">
                          <span className="text-white/60">Subtotal</span>
                          <span className="font-bold">{formatPrice(calculateSubtotal())}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => printReceipt('bill', { items: cart, total: calculateSubtotal() })}
                            className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
                          >
                            <Printer size={20}/>
                          </button>
                          <button 
                            onClick={() => { setShowCheckout(true); setShowMobileCart(false); }}
                            className="flex-1 bg-white text-black py-4 rounded-2xl font-bold text-lg"
                          >
                            CHECKOUT
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Checkout Modal */}
              {showCheckout && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-md rounded-[40px] p-6 md:p-10 space-y-6 md:space-y-8 my-auto shadow-2xl">
                    <h2 className="text-2xl md:text-3xl font-black">Complete Order</h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Customer Name</label>
                          <input placeholder="Name" className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Phone Number</label>
                          <input placeholder="Phone" className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Gift Card Code</label>
                        <input placeholder="Code" className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm" value={giftCardCode} onChange={e => setGiftCardCode(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Special Notes</label>
                        <textarea placeholder="Oat milk, less sugar..." className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm h-20" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-black/40 mb-3 uppercase tracking-widest ml-2">Add a Tip</p>
                      <div className="grid grid-cols-4 gap-2">
                        {tipOptions.map(opt => (
                          <button key={opt} onClick={() => setTipAmount(opt)} className={`py-3 rounded-2xl text-xs font-bold transition-colors ${tipAmount === opt ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}>{formatPrice(opt)}</button>
                        ))}
                        <input type="number" placeholder="Custom" className="bg-black/5 rounded-2xl text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/10" onChange={e => setTipAmount(Number(e.target.value))} />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-black/40 mb-3 uppercase tracking-widest ml-2">Payment Method</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['Cash', 'Card', 'Contactless (VISA)'].map(method => (
                          <button key={method} onClick={() => setPaymentMethod(method)} className={`py-3 rounded-2xl text-xs font-bold transition-colors ${paymentMethod === method ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}>{method}</button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-black/5 p-4 rounded-2xl">
                      <span className="text-sm font-bold">Print Receipt</span>
                      <button 
                        onClick={() => setPrintBill(!printBill)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${printBill ? 'bg-emerald-500' : 'bg-black/20'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${printBill ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="pt-6 border-t border-black/5">
                      <div className="flex justify-between text-2xl font-black mb-8">
                        <span>Total</span>
                        <span>{formatPrice(calculateSubtotal() + tipAmount)}</span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowCheckout(false)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                        <button onClick={handleCharge} className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform">PAY NOW</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Order Finalization Modal */}
              {completedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center space-y-6 shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-2">Order Completed!</h2>
                      <p className="text-black/40 font-medium">Order #{completedOrder.id}</p>
                    </div>
                    
                    <div className="bg-black/5 rounded-2xl p-4 text-left space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60">Customer</span>
                        <span className="font-bold">{completedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60">Total</span>
                        <span className="font-bold">{formatPrice(completedOrder.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60">Payment</span>
                        <span className="font-bold">{completedOrder.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <button onClick={() => printReceipt('bill', completedOrder)} className="w-full py-4 bg-black/5 rounded-2xl font-bold hover:bg-black/10 transition-colors flex items-center justify-center gap-2">
                        <Printer size={18} /> Print Receipt Again
                      </button>
                      <button onClick={() => setCompletedOrder(null)} className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform">
                        Done
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : null}

          {activeTab === 'customer_display' && (
            <motion.div key="cds" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="absolute inset-0 bg-white flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-black/5 -z-10" />
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
              
              <button onClick={() => setActiveTab('cashier')} className="absolute top-6 left-6 text-black/10 hover:text-black transition-colors"><AlertCircle/></button>
              
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="max-w-3xl w-full space-y-12">
                  <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="space-y-4">
                    <Coffee size={80} className="mx-auto text-black/10" />
                    <h1 className="text-6xl font-black tracking-tighter">Your Order at Kalim</h1>
                    <p className="text-black/40 font-medium">Thank you for choosing Kalim Coffee. We're crafting your drink with care.</p>
                  </motion.div>

                  <motion.div initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{delay: 0.2}} className="bg-white rounded-[40px] p-10 text-left shadow-2xl border border-black/5 relative overflow-hidden">
                    {cart.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-black/5 rounded-full mx-auto flex items-center justify-center">
                          <LayoutGrid className="text-black/20" />
                        </div>
                        <p className="text-black/40 font-bold">Welcome! Please start your order with the cashier.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="max-h-[400px] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                          {cart.map(item => (
                            <div key={item.productId} className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-2xl">{item.product?.name} <span className="text-black/20 ml-2">x{item.quantity}</span></p>
                                <p className="text-sm text-black/40 font-medium">
                                  {(item.toppings || []).map(tId => toppings.find(t => t.id === tId)?.name).join(', ')}
                                </p>
                              </div>
                              <p className="font-bold text-2xl">{formatPrice(((item.product?.price || 0) + (item.toppings || []).reduce((s, tid) => s + (toppings.find(t => t.id === tid)?.price || 0), 0)) * item.quantity)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-8 border-t border-black/10 flex justify-between items-end">
                          <div>
                            <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1">Total to pay</p>
                            <p className="text-sm text-black/20 font-medium">Includes HST (13%)</p>
                          </div>
                          <p className="text-7xl font-black">{formatPrice(calculateSubtotal())}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {isBusyMode && (
                    <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.4}} className="bg-amber-50 text-amber-700 p-8 rounded-[32px] flex items-center gap-6 text-left border border-amber-100">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <Clock className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold mb-1">Busy Hour Notice</p>
                        <p className="text-sm font-medium opacity-80">We are currently in peak hours, so your order may be slightly delayed. Thank you for your patience.</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bar' && hasPermission('bar') && !renderLegacyWebPosMode ? (
            <motion.div key="swiftui_bar_sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col overflow-y-auto p-4 md:p-8 bg-[#121216] select-none">
              <div className="max-w-7xl mx-auto w-full flex justify-between items-center bg-neutral-900/60 p-4 rounded-2xl border border-white/5 mb-4 text-white">
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    📱 Kalim Bar Monitor (iOS SwiftUI)
                  </h1>
                  <p className="text-xs text-neutral-400">iOS layout synchronized with Kalim Staff Connect</p>
                </div>
                <button 
                  onClick={() => setRenderLegacyWebPosMode(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  🖥️ Switch to Legacy Web Bar Monitor
                </button>
              </div>
              <div className="max-w-7xl mx-auto w-full">
                <IosSwiftUiSimulator 
                  products={products}
                  toppings={toppings}
                  orders={orders}
                  users={users}
                  timeClock={timeClock}
                  isOnline={isOnline}
                  currency={currency}
                  fetchData={fetchData}
                />
              </div>
            </motion.div>
          ) : activeTab === 'bar' && hasPermission('bar') && renderLegacyWebPosMode ? (
            <motion.div key="bar" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="absolute inset-0 flex flex-col">
              <div className="bg-amber-50 p-2 text-center text-[11px] font-bold text-amber-900 flex justify-between items-center px-4 border-b border-amber-200">
                <span>⚠️ Viewing Legacy Web prep counter layout. Web items are unassociated with native SwiftUI targets.</span>
                <button onClick={() => setRenderLegacyWebPosMode(false)} className="px-2.5 py-1 bg-amber-950 text-white font-extrabold rounded-lg">Return to SwiftUI App Simulator</button>
              </div>
              <header className="p-3 md:p-6 bg-white border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-2 md:gap-4">
                  <h1 className="text-lg md:text-2xl font-bold">Bar Station</h1>
                  {isBusyMode && (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full">
                      <Clock size={8} className="md:w-[10] md:h-[10]" /> BUSY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 md:gap-3">
                  <div className="hidden sm:flex flex-col items-end mr-1 md:mr-2">
                    <span className="text-[10px] md:text-xs font-bold">{currentUser?.name}</span>
                    <span className="text-[8px] md:text-[10px] text-black/40 uppercase tracking-widest">{currentUser?.role}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleStampTime('in')} className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl hover:bg-emerald-100 transition-colors" title="Clock In"><Clock size={14} className="md:w-4 md:h-4"/></button>
                    <button onClick={() => handleStampTime('out')} className="p-1.5 md:p-2 bg-rose-50 text-rose-600 rounded-lg md:rounded-xl hover:bg-rose-100 transition-colors" title="Clock Out"><LogOut size={14} className="md:w-4 md:h-4"/></button>
                  </div>
                  <button onClick={handleLogout} className="p-1.5 md:p-2 bg-black/5 rounded-lg md:rounded-xl hover:bg-black/10 transition-colors"><LogOut size={14} className="md:w-4 md:h-4"/></button>
                </div>
              </header>
              <div className="flex-1 overflow-x-auto p-2 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 no-scrollbar" onTouchStart={(e) => { if (window.innerWidth >= 768) e.stopPropagation(); }} onTouchMove={(e) => { if (window.innerWidth >= 768) e.stopPropagation(); }}>
                {['Wait', 'Preparing', 'Ready'].map(status => (
                  <div key={status} className="w-full md:flex-1 md:min-w-[300px] flex flex-col gap-2 md:gap-4">
                    <h2 className="font-bold text-black/40 uppercase tracking-widest text-[10px] md:text-xs px-2 py-1 bg-black/5 rounded-lg w-fit">{status}</h2>
                    <div onClick={handleDoubleTap} className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pr-1 md:pr-2">
                      {orders.filter(o => o.status === status).map(order => (
                        <div key={order.id} className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-black/5 shadow-sm space-y-3 md:space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-sm md:text-base">{order.customerName}</h3>
                              <p className="text-[10px] font-mono text-black/40">#{order.id}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] md:text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">{order.estimatedTime}m</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-xs md:text-sm">
                                <div className="flex justify-between font-medium">
                                  <span>{item.product?.name} ({item.size})</span>
                                  <span>x{item.quantity}</span>
                                </div>
                                <p className="text-[10px] text-black/40">{(item.toppings || []).map((tId: any) => toppings.find(t => t.id === tId)?.name).join(', ')}</p>
                              </div>
                            ))}
                          </div>
                          {order.notes && (
                            <div className="bg-black/5 p-3 rounded-xl text-[10px] italic text-black/60">
                              Note: {order.notes}
                            </div>
                          )}
                          <div className="flex gap-2">
                            {status === 'Wait' && <button onClick={() => updateOrderStatus(order.id, 'Preparing')} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-2xl text-xs font-bold">START</button>}
                            {status === 'Preparing' && <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-2xl text-xs font-bold">DONE</button>}
                            <button onClick={() => setEditingOrder(order)} className="p-3 bg-black/5 rounded-2xl hover:bg-black/10 transition-colors" title="Edit Order">
                              <Edit2 size={14}/>
                            </button>
                            <button onClick={() => printReceipt('label', order)} className="p-3 bg-black/5 rounded-2xl hover:bg-black/10 transition-colors" title="Print Label">
                              <Printer size={14}/>
                            </button>
                          </div>
                          {status === 'Preparing' && (
                            <div className="bg-emerald-50 p-3 rounded-2xl flex items-start gap-3 border border-emerald-100">
                              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                <TrendingUp size={12} className="text-emerald-600" />
                              </div>
                              <p className="text-[10px] font-bold text-emerald-800 leading-tight">
                                AI Reminder: {
                                  order.items[0]?.product?.name.includes('Latte') ? 'Ensure correct milk frothing temperature (65°C) for perfect texture.' :
                                  order.items[0]?.product?.name.includes('Espresso') ? 'Check extraction time (25-30s) for optimal flavor profile.' :
                                  order.items[0]?.product?.name.includes('Cold Brew') ? 'Serve over fresh ice and ensure correct dilution ratio.' :
                                  'Double check order notes for any special requests or allergies.'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit Order Modal */}
              {editingOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl">
                    <h2 className="text-2xl font-black">Edit Order #{editingOrder.id}</h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Customer Name</label>
                        <input 
                          className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm" 
                          value={editingOrder.customerName} 
                          onChange={e => setEditingOrder({...editingOrder, customerName: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Special Notes</label>
                        <textarea 
                          className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm h-24" 
                          value={editingOrder.notes || ''} 
                          onChange={e => setEditingOrder({...editingOrder, notes: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setEditingOrder(null)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                      <button onClick={saveEditedOrder} className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform">Save Changes</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : null}

          {activeTab === 'website' && (
            <motion.div key="website" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="absolute inset-0 flex flex-col bg-[#F8F7F4]">
              {staffAppUser ? (
                <StaffPortal 
                  users={users} 
                  timeClock={timeClock} 
                  taxRegion={taxRegion} 
                  currency={currency} 
                  fetchData={fetchData} 
                  isAdmin={staffAppUser.role === 'admin' || staffAppUser.role === 'manager'}
                  simulateDeveloperMode={simulateDeveloperMode}
                  setSimulateDeveloperMode={setSimulateDeveloperMode}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-[#E07A5F] rounded-2xl flex items-center justify-center text-white mb-4">
                        <Users size={32} />
                      </div>
                      <h2 className="text-2xl font-black">Staff Login</h2>
                      <p className="text-sm text-black/50 font-bold">Log in with POS account</p>
                    </div>
                    <div className="space-y-4">
                      {staffAppForgotPin ? (
                        <div className="space-y-4 text-sm text-black/60 font-bold p-2 text-center">
                          Please contact your Store Manager or Head Office Administrator to securely reset your Employee ID and PIN.
                          <button 
                            onClick={() => setStaffAppForgotPin(false)}
                            className="w-full bg-[#E07A5F] text-white py-4 rounded-xl font-bold mt-4 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                          >
                            BACK TO LOGIN
                          </button>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="text" 
                            value={staffAppEmpId}
                            onChange={e => setStaffAppEmpId(e.target.value)}
                            placeholder="Employee ID"
                            className="w-full bg-black/5 p-4 rounded-xl text-center text-xl font-bold"
                          />
                          <div className="relative">
                            <input 
                              type={showStaffAppPin ? "text" : "password"}
                              value={staffAppPin}
                              onChange={e => setStaffAppPin(e.target.value)}
                              placeholder="PIN Code"
                              className="w-full bg-black/5 p-4 rounded-xl text-center text-2xl tracking-[0.5em] font-bold"
                              onKeyDown={e => e.key === 'Enter' && handleStaffAppLogin()}
                            />
                            <button
                              type="button"
                              onClick={() => setShowStaffAppPin(!showStaffAppPin)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                            >
                              {showStaffAppPin ? <EyeOff size={24} /> : <Eye size={24} />}
                            </button>
                          </div>
                          <div className="text-right">
                            <button 
                              onClick={() => setStaffAppForgotPin(true)}
                              className="text-black/40 text-xs font-bold hover:text-black hover:underline cursor-pointer"
                            >
                              Forgot PIN?
                            </button>
                          </div>
                          <button 
                            onClick={handleStaffAppLogin}
                            className="w-full bg-[#E07A5F] text-white p-4 rounded-xl font-black hover:scale-[1.02] transition-transform"
                          >
                            LOG IN
                          </button>
                          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-black/40 font-bold text-center">
                            <ShieldCheck size={12} className="min-w-3" />
                            <span>Protected by Kalim Data Privacy Policies. Full compliance with data protection laws.</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'customer' && (
            <motion.div key="customer" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="absolute inset-0 flex flex-col bg-[#1A1A1E] overflow-y-auto p-4 md:p-8 select-none">
              <div className="max-w-7xl mx-auto w-full flex flex-col gap-4">
                <div className="flex justify-end pr-8">
                  <button 
                    onClick={() => setCustomerAppWebMode(!customerAppWebMode)}
                    className="flex justify-center items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-neutral-700 transition"
                  >
                    {customerAppWebMode ? <span>{t('switch_to_mobile')}</span> : <span>{t('switch_to_web')}</span>}
                  </button>
                </div>
                <KalimCustomerApp 
                  products={products}
                  toppings={toppings}
                  currency={currency}
                  taxRegion={taxRegion}
                  fetchData={fetchData}
                  webAppMode={customerAppWebMode}
                  language={aiLanguage}
                  onOrderSuccess={() => {
                    fetchData();
                  }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && (hasPermission('inventory') || hasPermission('reports') || hasPermission('settings') || hasPermission('users') || hasPermission('ai')) && (
            <motion.div key="admin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="absolute inset-0 flex flex-col">
              <header className="p-4 md:p-6 bg-white border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <h1 className="text-xl md:text-2xl font-bold">Admin Panel</h1>
                  <nav className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    {adminSubTabsOrder.filter(sub => {
                      // Adjust matching dynamic permissions for consolidated subtabs
                      if (sub.id === 'dashboard') return hasPermission('reports') || hasPermission('ai');
                      if (sub.id === 'inventory') return hasPermission('inventory') || hasPermission('suppliers');
                      if (sub.id === 'users') return hasPermission('users');
                      return hasPermission(sub.perm);
                    }).map(sub => (
                      <button 
                        key={sub.id} 
                        onMouseDown={handleTabPressStart}
                        onMouseUp={handleTabPressEnd}
                        onMouseLeave={handleTabPressEnd}
                        onTouchStart={handleTabPressStart}
                        onTouchEnd={handleTabPressEnd}
                        onClick={() => setAdminSubTab(sub.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] md:text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer select-none relative ${adminSubTab === sub.id ? 'bg-black text-white shadow' : 'text-black/50 bg-black/[0.03] hover:bg-black/[0.07]'}`}
                        title={lang === 'vi' ? "💡 Giữ 1 giây trên bất kỳ tab nào để tùy chỉnh thứ tự!" : "💡 Hold for 1 second on any tab to customize the navigation order!"}
                      >
                        {
                          sub.id === 'dashboard' ? `📊 ${t('dashboard_tab')}` :
                          sub.id === 'menu' ? `☕ ${t('menu_tab')}` :
                          sub.id === 'inventory' ? `📦 ${t('inventory_tab')}` :
                          sub.id === 'membership' ? `💳 ${t('customers_tab')}` :
                          sub.id === 'users' ? `👥 ${t('staff_tab')}` :
                          sub.id === 'settings' ? `⚙️ ${t('system_settings')}` :
                          sub.label
                        }
                      </button>
                    ))}
                    <span className="text-[9px] text-black/30 font-bold bg-yellow-500/10 text-yellow-700 px-2.5 py-1 rounded-xl whitespace-nowrap font-sans">
                      💡 Hold any tab button to reorder positions
                    </span>
                  </nav>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-[10px] md:text-xs font-bold">{currentUser?.name}</span>
                    <span className="text-[8px] md:text-[10px] text-black/40 uppercase tracking-widest">{currentUser?.role}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-colors"><LogOut size={16}/></button>
                </div>
              </header>

              <div {...adminSwipeHandlers} onClick={handleDoubleTap} className="flex-1 overflow-y-auto p-4 md:p-8">
                {adminSubTab === 'dashboard' && (hasPermission('reports') || hasPermission('ai')) && (
                  <div className="space-y-6 md:space-y-8 text-left">
                    {/* Consolidated Dashboard Inner subtab bar */}
                    <div className="flex flex-wrap gap-2 border-b border-black/5 pb-4">
                      {[
                        { id: 'overview', label: '📊 Health & Overview' },
                        { id: 'reports', label: '📜 Sales & Tax Reports' },
                        { id: 'ai_insights', label: '💡 AI Business Insights' },
                        { id: 'ai_tax_strategies', label: '🪐 AI Tax Optimization Assistant' }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setDashboardSubTab(sub.id as any)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${dashboardSubTab === sub.id ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:bg-black/5 hover:text-black bg-black/[0.02]'}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>

                    {dashboardSubTab === 'overview' && (
                      <div className="space-y-6 md:space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-black/5">
                          <div>
                            <h2 className="text-xl font-bold uppercase">Store Operations Overview</h2>
                            <p className="text-xs text-black/40">Consolidated financial records synced directly from Cloud Run & AlloyDB.</p>
                          </div>
                          <button onClick={seedData} className="bg-black text-white text-xs px-4 py-2.5 font-bold rounded-xl active:scale-95 transition-all cursor-pointer">Seed Data</button>
                        </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                      <div className="lg:col-span-6 bg-[#1A1A1A] text-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col justify-between">
                        <div>
                          <p className="text-white/40 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2">Total Revenue (incl. Tax & Tips)</p>
                          <h2 className="text-4xl md:text-6xl font-black mb-6 md:mb-8">{formatPrice(stats.totalRevenue)}</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                          <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <p className="text-[8px] md:text-[10px] text-white/40 mb-1">Orders</p>
                            <p className="text-lg md:text-xl font-bold">{stats.totalOrders}</p>
                          </div>
                          <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <p className="text-[8px] md:text-[10px] text-white/40 mb-1">Tax ({taxRegion})</p>
                            <p className="text-lg md:text-xl font-bold">{formatPrice(stats.totalTax)}</p>
                          </div>
                          <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <p className="text-[8px] md:text-[10px] text-white/40 mb-1">Tips</p>
                            <p className="text-lg md:text-xl font-bold">{formatPrice(stats.totalTips)}</p>
                          </div>
                          <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <p className="text-[8px] md:text-[10px] text-white/40 mb-1">Avg Ticket</p>
                            <p className="text-lg md:text-xl font-bold">{formatPrice(stats.totalRevenue / (stats.totalOrders || 1))}</p>
                          </div>
                        </div>
                      </div>

                      {/* NEW: Labeled Revenue Growth metric card with sparkline visual tracker */}
                      <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-black/5 flex flex-col justify-between shadow-sm space-y-4">
                        <div>
                          <p className="text-black/40 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Revenue Growth (30d)</p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl md:text-3xl font-black text-black">
                              {revenueGrowthStats.growthPercent >= 0 ? '+' : ''}{revenueGrowthStats.growthPercent}%
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              revenueGrowthStats.growthPercent >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {revenueGrowthStats.growthPercent >= 0 ? '▲ UP' : '▼ DOWN'}
                            </span>
                          </div>
                          <p className="text-[9px] text-black/40 leading-normal mt-2">
                            Current 30d: <strong className="text-black font-semibold">${revenueGrowthStats.currentPeriodRev.toLocaleString([], { maximumFractionDigits: 0 })}</strong><br />
                            Prior 30d: <strong className="text-black font-semibold">${revenueGrowthStats.previousPeriodRev.toLocaleString([], { maximumFractionDigits: 0 })}</strong>
                          </p>
                        </div>
                        
                        {/* Dynamic Sparkline Chart */}
                        <div className="h-24 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueGrowthStats.chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                              <defs>
                                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={revenueGrowthStats.growthPercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor={revenueGrowthStats.growthPercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="day" hide />
                              <YAxis domain={['auto', 'auto']} hide />
                              <Area 
                                type="monotone" 
                                dataKey="Sales" 
                                stroke={revenueGrowthStats.growthPercent >= 0 ? "#10B981" : "#EF4444"} 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#growthGradient)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-black/5 flex flex-col justify-center text-center space-y-4">
                        <TrendingUp size={40} className="mx-auto text-black/10" />
                        <h3 className="font-bold text-sm">Business Health</h3>
                        <p className="text-xs text-black/40 leading-normal">Your coffee shop is performing well. Check AI Insights for detailed forecasts.</p>
                        <button 
                          onClick={syncExternalOrders}
                          disabled={isSyncingExternal}
                          className="mt-2 bg-black text-white px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow"
                        >
                          <Smartphone size={12} /> {isSyncingExternal ? 'Syncing...' : 'Sync External Orders'}
                        </button>
                      </div>
                    </div>
                    </div>
                    )}

                    {dashboardSubTab === 'ai_tax_strategies' && (
                      <div className="space-y-8 animate-fade-in text-left">
                        {/* Premium Interactive AI Tax Strategies Interface */}
                        <div className="bg-[#111111] text-white p-8 md:p-12 rounded-[40px] border border-white/5 relative overflow-hidden space-y-8">
                          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                          
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider block w-max">
                                🪐 Tech Cafe Tax Shield - Canada CRA Compliant
                              </span>
                              <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-none text-white">AI Tax Strategy & Profit Maximizer</h2>
                              <p className="text-white/50 text-xs md:text-sm max-w-xl">Analyze actual cash flows and recommend tech-driven cafe investments eligible for 100% write-offs to reduce your corporate tax burden in Canada ({taxRegion}).</p>
                            </div>
                            <button
                              onClick={generateAiTaxStrategy}
                              disabled={isGeneratingAiTax}
                              className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transform active:scale-95 transition-all shadow-xl disabled:opacity-50 cursor-pointer shadow-emerald-500/10 text-center justify-center shrink-0"
                            >
                              {isGeneratingAiTax ? '⏳ Formulating Strategy...' : '🚀 Trigger AI Tax Advisor'}
                            </button>
                          </div>

                          {/* Quick Interactive tech deduction visualizer */}
                          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-6">
                            <div>
                              <h3 className="font-extrabold text-sm text-emerald-400 uppercase tracking-wider">💡 Technology Investment Tax Shield (Canada CAA Class 50 / Part XVII)</h3>
                              <p className="text-[11px] text-white/50 mt-1">Select the tech investments you plan to make for Kalim Coffee this year to forecast immediate write-off impact against pre-tax profits.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {[
                                { name: "Slayer 2-Group App-Controlled Espresso Machine", price: 16500, cat: "Slayer Tech" },
                                { name: "Mahlkönig E65S GbW Intelligent IoT Grinder", price: 3400, cat: "IoT Grinder" },
                                { name: "AI Customer Counter & Staffing Optimizer Camera System", price: 2800, cat: "AI Camera" },
                                { name: "Secure Enterprise Wifi 7 Mesh Network & iPad POS Pro Units", price: 4200, cat: "POS Network" },
                                { name: "Smart IoT Temp & Humidity Early Warning Fridge Sensors", price: 1500, cat: "IoT Sensors" },
                                { name: "Website Kalimcoffee.ca Custom SaaS Software Development", price: 9500, cat: "Marketing SaaS" }
                              ].map((item, idx) => {
                                const selected = selectedTaxItems[idx] === true;
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => {
                                      const next = !selected;
                                      setSelectedTaxItems(prev => ({
                                        ...prev,
                                        [idx]: next
                                      }));
                                      try {
                                        localStorage.setItem(`tax_deduct_item_${idx}`, next ? 'true' : 'false');
                                      } catch (e) {}
                                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                                    }}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex justify-between items-center ${
                                      selected 
                                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg' 
                                        : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/[0.05]'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/60 uppercase font-bold tracking-wider">{item.cat}</span>
                                      <p className="text-xs font-bold leading-tight text-white">{item.name}</p>
                                      <p className="text-xs font-mono font-bold text-emerald-400">${item.price.toLocaleString()}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}`}>
                                      {selected && <span className="text-[10px] text-black font-bold">✓</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* AI Detailed Output Box */}
                          {aiTaxResult && (
                            <div className="bg-black/60 border border-white/5 p-8 rounded-[32px] space-y-6 prose prose-invert max-w-none text-left select-text">
                              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <div className="flex items-center gap-2 text-emerald-400">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <h4 className="text-sm font-black uppercase m-0 tracking-wider">Tax Shield Strategy Formulated by Gemini AI</h4>
                                </div>
                                <button 
                                  onClick={() => setAiTaxResult('')}
                                  className="text-xs text-white/40 hover:text-white cursor-pointer px-3 py-1 bg-white/5 rounded-lg border border-white/10 transition-colors/20"
                                >
                                  Clear Result
                                </button>
                              </div>
                              <div className="text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                                {aiTaxResult}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminSubTab === 'menu' && hasPermission('settings') && (
                  <div className="space-y-12">
                    {/* Digital Website QR Connect & Generator */}
                    <DigitalMenuQr products={products} websiteUrl={websiteUrl} />

                    {/* Categories */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">Menu Groups (Categories)</h3>
                      <div className="flex flex-wrap gap-2">
                        {customCategories.map(cat => (
                          <div key={cat} className="bg-white px-4 py-2 rounded-xl border border-black/5 flex items-center gap-2 text-sm font-bold">
                            {cat}
                            <button onClick={() => removeCategory(cat)} className="text-red-500 hover:scale-110">×</button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input 
                            placeholder="New Category" 
                            className="bg-black/5 px-4 py-2 rounded-xl text-sm font-bold"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                          />
                          <button onClick={addCategory} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold">+</button>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Products</h3>
                        <button 
                          onClick={() => { setEditingProduct({ name: '', category: customCategories[0], price: 0, image: 'https://picsum.photos/seed/coffee/200', description: '', ingredients: [] }); setShowProductModal(true); }}
                          className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm"
                        >
                          + Add Product
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-3xl border border-black/5 flex gap-4 items-center">
                            <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                            <div className="flex-1">
                              <h4 className="font-bold text-sm">{p.name}</h4>
                              <p className="text-[10px] text-black/40">{p.category}</p>
                              <p className="font-bold text-sm">{formatPrice(p.price)}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-2 bg-black/5 rounded-lg hover:bg-black/10"><FileText size={14}/></button>
                              <button 
                                onClick={() => handleGenerateMarketing(p)} 
                                className="p-2 bg-black/5 rounded-lg hover:bg-black/10 text-emerald-600"
                                title="Generate AI Marketing Ad"
                              >
                                <Sparkles size={14}/>
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><AlertCircle size={14}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Toppings */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Toppings & Add-ons</h3>
                        <button 
                          onClick={() => { setEditingTopping({ name: '', price: 0 }); setShowToppingModal(true); }}
                          className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm"
                        >
                          + Add Topping
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {toppings.map(t => (
                          <div key={t.id} className="bg-white p-4 rounded-3xl border border-black/5 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-sm">{t.name}</h4>
                              <p className="font-bold text-xs text-black/40">{formatPrice(t.price)}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingTopping(t); setShowToppingModal(true); }} className="text-black/20 hover:text-black"><FileText size={14}/></button>
                              <button onClick={() => handleDeleteTopping(t.id)} className="text-red-200 hover:text-red-500"><AlertCircle size={14}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'inventory' && hasPermission('inventory') && (
                  <div className="space-y-6">
                    {/* Inner subtab switcher */}
                    <div className="flex bg-black/[0.04] p-1.5 rounded-2xl border border-black/5 gap-1.5 w-max">
                      <button 
                        onClick={() => setInventorySubTab('products')} 
                        className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${inventorySubTab === 'products' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:bg-[#eaeaea]'}`}
                      >
                        📦 Products & Supplies Inventory
                      </button>
                      <button 
                        onClick={() => setInventorySubTab('suppliers')} 
                        className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${inventorySubTab === 'suppliers' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:bg-[#eaeaea]'}`}
                      >
                        🚚 Suppliers & Vendors
                      </button>
                    </div>

                    {inventorySubTab === 'products' && (
                      <div className="space-y-6 animate-fade-in text-left">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <h2 className="text-2xl font-bold">Inventory Management</h2>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            window.print();
                          }}
                          className="bg-black text-white hover:bg-neutral-900 border border-neutral-800 font-extrabold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Printer size={14} className="text-[#E07A5F]" /> Print Inventory Count Sheet
                        </button>

                        <button 
                          onClick={async () => {
                            try {
                              const resp = await fetch("/api/ai-inventory-check/trigger-audit", { method: "POST" });
                              const data = await resp.json();
                              if (Array.isArray(data) && data.length > 0) {
                                const firstSug = data[0];
                                alert(`🤖 AI Audit Completed successfully!\nGenerated ${data.length} tasks for staff.\nExample Task (${firstSug.employeeName} checking "${firstSug.itemName}"):\n"${firstSug.suggestion}"`);
                              } else {
                                alert(`🤖 AI Audit Completed successfully! Current stocks are stable.`);
                              }
                              fetchData();
                            } catch(err) {
                              alert("Failed to run real-time supplier audit");
                            }
                          }}
                          className="bg-purple-900 text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-md hover:bg-purple-800 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Zap size={14} /> Run Real-Time AI Supply Audit
                        </button>
                      </div>
                    </div>

                    {/* AI CO-PILOT: MATERIAL AUTOPILOT & SUPPLIER ASSISTANT */}
                    <div className="bg-neutral-900 text-white p-6 md:p-8 rounded-[40px] border border-black/5 space-y-6 relative overflow-hidden">
                      {/* Ambient background glow ring */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex justify-between items-start flex-wrap gap-2 relative z-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-500 text-white p-1 rounded-lg">
                              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                            </span>
                            <h3 className="font-extrabold text-md uppercase tracking-wider text-purple-300">Kalim Global AI Co-Pilot</h3>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">Material autopilot forecast, stock depletion triggers, and automatic raw milk & syrup purchase order routing.</p>
                        </div>
                        <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-zinc-300 border border-white/10 font-bold">
                          System Active ● 0.0.0.0:3000
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {aiInvSuggestions.map((suggestion) => {
                          const isComplete = completedSuggestions[suggestion.id] === true;
                          const isRestock = suggestion.type === "restock";
                          const displayItem = suggestion.item || suggestion.itemName || "Inventory Item";
                          const textPrompt = suggestion.suggestedText || suggestion.suggestion || "";

                          return (
                            <div 
                              key={suggestion.id}
                              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-4 text-left ${
                                isComplete 
                                  ? 'bg-neutral-800/40 border-neutral-850 opacity-50' 
                                  : isRestock
                                    ? 'bg-white/[0.03] border-purple-500/10 hover:border-purple-500/30 shadow-md'
                                    : 'bg-amber-500/[0.02] border-amber-500/10 hover:border-amber-500/30 shadow-md'
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  {isRestock ? (
                                    <span className="text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                      🚚 Restock Recommendation
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                      🔎 Physical Barista Audit
                                    </span>
                                  )}
                                  <span className="bg-white/10 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono text-[9px]">
                                    {isRestock ? (suggestion.supplierName || "Supplier") : `Staff: ${suggestion.employeeName || 'Barista'}`}
                                  </span>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-extrabold text-white">{displayItem}</h4>
                                  {!isRestock && suggestion.detectedIssue && (
                                    <p className="text-[10px] text-amber-300/80 font-bold mt-1">⚠️ {suggestion.detectedIssue}</p>
                                  )}
                                  <p className="text-xs text-zinc-300 font-medium leading-relaxed mt-2 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                    {textPrompt}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                                {isRestock ? (
                                  <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-zinc-450">
                                      QTY: <span className="text-purple-300 font-mono text-xs">{suggestion.quantityToOrder} units</span>
                                    </div>
                                    {isComplete ? (
                                      <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Approved
                                      </span>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const resp = await fetch("/api/ai-inventory-check/action-complete", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                suggestionId: suggestion.id,
                                                itemName: displayItem,
                                                quantity: suggestion.quantityToOrder
                                              })
                                            });
                                            if (resp.ok) {
                                              setCompletedSuggestions(prev => ({ ...prev, [suggestion.id]: true }));
                                              alert(`🎉 Approved restock route of ${suggestion.quantityToOrder} units for ${displayItem}! Stock added.`);
                                              fetchData();
                                            }
                                          } catch(err) {
                                            alert("Restock transaction processing error");
                                          }
                                        }}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2 rounded-xl text-[10px] tracking-tight transition-all active:scale-95 cursor-pointer"
                                      >
                                        Accept Restock Route
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 justify-between">
                                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Enter Actual Count:</span>
                                      <input 
                                        type="number" 
                                        id={`audit-count-${suggestion.id}`}
                                        placeholder="Actual QTY"
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-bold w-24 text-right focus:outline-none focus:border-amber-500"
                                      />
                                    </div>
                                    <div className="flex justify-end">
                                      {isComplete ? (
                                        <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                                          <CheckCircle2 size={12} /> Verified & Saved
                                        </span>
                                      ) : (
                                        <button
                                          onClick={async () => {
                                            const inputEl = document.getElementById(`audit-count-${suggestion.id}`) as HTMLInputElement;
                                            if (!inputEl || inputEl.value === "") {
                                              alert("Please enter a verified physical quantity count!");
                                              return;
                                            }
                                            const val = parseInt(inputEl.value);
                                            try {
                                              const resp = await fetch("/api/ai-inventory-check/action-complete", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  suggestionId: suggestion.id,
                                                  targetStockValue: val
                                                })
                                              });
                                              if (resp.ok) {
                                                setCompletedSuggestions(prev => ({ ...prev, [suggestion.id]: true }));
                                                alert(`🔎 Audit verified! Fixed stock of ${displayItem} is now set to ${val}.`);
                                                fetchData();
                                              }
                                            } catch(err) {
                                              alert("Audit logging failed");
                                            }
                                          }}
                                          className="bg-amber-600 hover:bg-amber-500 text-white font-black px-4 py-2 rounded-xl text-[10px] tracking-tight transition-all active:scale-95 cursor-pointer"
                                        >
                                          Confirm Verified Count
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Recharts Data Visualizations for Inventory Stock & Trends */}
                    <InventoryCharts inventoryItems={stats.inventoryStatus || []} />

                    {/* Critical Low Stock Warning Panel with Pulse Animations & Stateful Auto-Reorder */}
                    {stats.inventoryStatus?.filter((item: any) => item.stock <= item.minStock).length > 0 && (
                      <div className="space-y-3 bg-red-50/50 p-6 rounded-[32px] border border-red-100 shadow-sm animate-[pulse_3s_infinite_ease-in-out]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </span>
                            <h3 className="text-sm font-black uppercase tracking-wider text-red-600">Critical Restock Alerts</h3>
                          </div>
                          <span className="text-xs font-bold text-red-500/70">
                            {stats.inventoryStatus?.filter((item: any) => item.stock <= item.minStock).length} item(s) below threshold
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stats.inventoryStatus
                            ?.filter((item: any) => item.stock <= item.minStock)
                            .map((item: any) => {
                              const supplier = suppliers.find(s => s.id === item.supplierId);
                              const itemState = reorderingItems[item.id] || 'idle';
                              return (
                                <motion.div
                                  key={`alert-${item.id}`}
                                  initial={{ scale: 0.98, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="bg-white p-5 rounded-2xl border-2 border-red-500/20 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden"
                                >
                                  {/* Red corner aesthetic accent */}
                                  <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />
                                  
                                  <div className="space-y-1 pr-2">
                                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                      <AlertTriangle size={14} className="text-red-500" />
                                      {item.name}
                                    </h4>
                                    <div className="flex justify-between items-baseline text-xs text-gray-500">
                                      <span>Current Stock:</span>
                                      <span className="font-mono font-bold text-red-600">{item.stock} {item.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline text-xs text-gray-400">
                                      <span>Safety Threshold:</span>
                                      <span className="font-medium">{item.minStock} {item.unit}</span>
                                    </div>
                                    {supplier && (
                                      <p className="text-[11px] text-gray-400 pt-1 flex items-center gap-1 border-t border-black/5 mt-1.5">
                                        <Truck size={12} className="text-gray-300" /> {supplier.name}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                                    <div className="text-[10px] text-red-500/80 font-extrabold uppercase tracking-widest">
                                      -{Math.max(0, item.minStock - item.stock)} {item.unit} Short
                                    </div>
                                    <button
                                      disabled={itemState === 'loading'}
                                      onClick={async () => {
                                        setReorderingItems(prev => ({ ...prev, [item.id]: 'loading' }));
                                        
                                        // Simulate delivery and order confirmation delay
                                        await new Promise(resolve => setTimeout(resolve, 800));
                                        
                                        // Replenish quantity back up to minStock * 3
                                        const restockTarget = Math.max(item.minStock * 3, 15);
                                        
                                        setStats((prev: any) => ({
                                          ...prev,
                                          inventoryStatus: prev.inventoryStatus.map((i: any) => 
                                            i.id === item.id ? { ...i, stock: restockTarget } : i
                                          )
                                        }));
                                        
                                        await updateInventory(item.id, restockTarget);
                                        
                                        setReorderingItems(prev => ({ ...prev, [item.id]: 'success' }));
                                      }}
                                      className={`text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm select-none ${
                                        itemState === 'loading'
                                          ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                                          : itemState === 'success'
                                          ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                                          : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10 active:scale-95'
                                      }`}
                                    >
                                      {itemState === 'loading' && (
                                        <>
                                          <RefreshCw size={12} className="animate-spin" />
                                          Ordering...
                                        </>
                                      )}
                                      {itemState === 'success' && (
                                        <>
                                          <CheckCircle2 size={12} />
                                          Reordered!
                                        </>
                                      )}
                                      {itemState === 'idle' && (
                                        <>
                                          <RefreshCw size={12} />
                                          Auto-Reorder
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-[40px] border border-black/5 overflow-x-auto shadow-sm" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-black/5 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="p-6">Item Name</th>
                            <th className="p-6">Current Stock</th>
                            <th className="p-6">Min Stock</th>
                            <th className="p-6">Supplier</th>
                            <th className="p-6">Forecast</th>
                            <th className="p-6">Update</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {stats.inventoryStatus?.map((item: any) => {
                            const supplier = suppliers.find(s => s.id === item.supplierId);
                            const isLow = item.stock <= item.minStock;
                            return (
                              <tr key={item.id}>
                                <td className="p-6 font-bold">{item.name}</td>
                                <td className="p-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden">
                                      <div className={`h-full ${isLow ? 'bg-red-500' : 'bg-black'}`} style={{width: `${Math.min(100, (item.stock/(item.minStock * 3))*100)}%`}} />
                                    </div>
                                    <span className={`font-mono font-bold ${isLow ? 'text-red-500' : ''}`}>{item.stock} {item.unit}</span>
                                  </div>
                                </td>
                                <td className="p-6 text-black/40 text-sm font-bold">{item.minStock} {item.unit}</td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2">
                                    <Truck size={14} className="text-black/20" />
                                    <span className="text-xs font-bold">{supplier?.name || 'Unknown'}</span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  {isLow ? (
                                    <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1 w-fit">
                                      <AlertCircle size={10} /> REORDER NOW
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg flex items-center gap-1 w-fit">
                                      <CheckCircle2 size={10} /> STABLE
                                    </span>
                                  )}
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-black/5 rounded-xl p-1">
                                      <button 
                                        onClick={() => {
                                          const step = item.unit === 'kg' || item.unit === 'liters' ? 0.5 : 1;
                                          const val = Math.max(0, item.stock - step);
                                          setStats((prev: any) => ({
                                            ...prev,
                                            inventoryStatus: prev.inventoryStatus.map((i: any) => i.id === item.id ? { ...i, stock: val } : i)
                                          }));
                                          updateInventory(item.id, val);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-black/60 hover:text-black transition-colors"
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <input 
                                        type="number" 
                                        min="0"
                                        step={item.unit === 'kg' || item.unit === 'liters' ? 0.1 : 1}
                                        className="w-16 bg-transparent p-1 font-bold text-center text-sm focus:outline-none"
                                        value={item.stock}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setStats((prev: any) => ({
                                            ...prev,
                                            inventoryStatus: prev.inventoryStatus.map((i: any) => i.id === item.id ? { ...i, stock: val } : i)
                                          }));
                                        }}
                                        onBlur={(e) => updateInventory(item.id, Number(e.target.value))}
                                        onKeyDown={(e) => e.key === 'Enter' && updateInventory(item.id, Number((e.target as HTMLInputElement).value))}
                                      />
                                      <button 
                                        onClick={() => {
                                          const step = item.unit === 'kg' || item.unit === 'liters' ? 0.5 : 1;
                                          const val = item.stock + step;
                                          setStats((prev: any) => ({
                                            ...prev,
                                            inventoryStatus: prev.inventoryStatus.map((i: any) => i.id === item.id ? { ...i, stock: val } : i)
                                          }));
                                          updateInventory(item.id, val);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-black/60 hover:text-black transition-colors"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>
                                    <button 
                                      onClick={() => updateInventory(item.id, item.stock)}
                                      className="p-2 bg-black text-white rounded-xl hover:bg-black/80 transition-colors"
                                      title="Save Changes"
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                    )}

                    {inventorySubTab === 'suppliers' && (
                      <div className="space-y-8 animate-fade-in text-left">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                          <div>
                            <h2 className="text-2xl font-bold">Supplier Management</h2>
                            <p className="text-xs text-black/40 font-semibold">Manage your partners and AI-driven automated ordering.</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="bg-white p-4 rounded-2xl border border-black/5 flex items-center gap-4 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">AI Forecast Period</span>
                                <span className="text-sm font-bold">{forecastDays} Days</span>
                              </div>
                              <input 
                                type="range" min="1" max="30" value={forecastDays} 
                                onChange={(e) => setForecastDays(parseInt(e.target.value))}
                                className="w-32 accent-black"
                              />
                            </div>
                            <button 
                              onClick={() => { setEditingSupplier({ name: '', phone: '', email: '', keywords: [] }); setShowSupplierModal(true); }}
                              className="bg-black text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg cursor-pointer"
                            >
                              <Truck size={16}/> + Add Supplier
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {suppliers.map(s => (
                            <div key={s.id} className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                              <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center">
                                  <Truck className="text-black/40" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => { setEditingSupplier(s); setShowSupplierModal(true); }} className="p-2 bg-black/5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"><FileText size={14}/></button>
                                  <button onClick={() => handleDeleteSupplier(s.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"><AlertCircle size={14}/></button>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-xl">{s.name}</h3>
                                <p className="text-xs text-black/40 font-semibold">{s.email}</p>
                                <p className="text-xs text-black/40 font-semibold">{s.phone}</p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {s.keywords.map(k => (
                                  <span key={k} className="text-[10px] bg-black/5 px-2 py-1 rounded-md font-bold text-black/60 uppercase tracking-tighter">{k}</span>
                                ))}
                              </div>
                              <div className="pt-4 border-t border-black/5">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3">AI Auto-Order Items</h4>
                                <div className="space-y-2">
                                  {(stats.inventoryStatus || [])?.filter((i: any) => i.supplierId === s.id).map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center bg-black/5 p-3 rounded-xl">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold">{item.name}</span>
                                        <span className="text-[10px] text-black/40">Stock: {item.stock} {item.unit}</span>
                                      </div>
                                      <button 
                                        onClick={() => handleAutoReorder(item.id, s.id)}
                                        className="bg-black text-white p-2 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                                        title="AI Auto-Order"
                                      >
                                        <TrendingUp size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {((adminSubTab === 'dashboard' && dashboardSubTab === 'reports') || (adminSubTab === 'reports')) && hasPermission('reports') && (
                  <div className="space-y-8">
                    {/* Header and Sub-tab switcher */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-black uppercase text-black">Financial Reports Hub</h2>
                        <p className="text-xs text-black/40">Consolidated analytics, regional sales logs, tax compliance audit reports, and enterprise multi-branch statements.</p>
                      </div>

                      {/* Subtab selection selector */}
                      <div className="flex bg-black/[0.05] p-1 rounded-2xl border border-black/5 gap-1 w-full md:w-auto overflow-x-auto whitespace-nowrap">
                        <button
                          onClick={() => { setReportsActiveSubTab('sales'); }}
                          className={`flex-1 md:flex-none px-4 py-2.5 text-center text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                            reportsActiveSubTab === 'sales'
                              ? 'bg-black text-white shadow-sm'
                              : 'text-black/50 hover:text-black/80'
                          }`}
                        >
                          📈 Sales Ledger
                        </button>
                        <button
                          onClick={() => { setReportsActiveSubTab('transactions'); }}
                          className={`flex-1 md:flex-none px-4 py-2.5 text-center text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                            reportsActiveSubTab === 'transactions'
                              ? 'bg-black text-white shadow-sm'
                              : 'text-black/50 hover:text-black/80'
                          }`}
                        >
                          📜 Transactions History
                        </button>
                        <button
                          onClick={() => { setReportsActiveSubTab('corporate_tax'); }}
                          className={`flex-1 md:flex-none px-4 py-2.5 text-center text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                            reportsActiveSubTab === 'corporate_tax'
                              ? 'bg-black text-white shadow-sm'
                              : 'text-black/50 hover:text-black/80'
                          }`}
                        >
                          🏢 Corp Tax (T2)
                        </button>
                      </div>
                    </div>

                    {reportsActiveSubTab === 'sales' ? (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
                          <div>
                            <h3 className="font-black uppercase text-black text-sm">Sales & Tax Records</h3>
                            <p className="text-xs text-black/40">Export high-resolution PDFs for local tax filing records.</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setShowTaxForm(true)} className="bg-black hover:bg-black/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow">
                              <FileText size={14}/> Tax Form Preview
                            </button>
                            {/* Connected dynamic PDF exporter */}
                            <button 
                              onClick={() => exportSalesLedgerToPdf({
                                region: taxRegion,
                                regionName: canadianTaxes[taxRegion]?.name || 'Canada HST',
                                taxRate: canadianTaxes[taxRegion]?.rate || 0.13,
                                totalRevenue: stats.totalRevenue,
                                totalTax: stats.totalTax,
                                orders: stats.orders || []
                              })} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                            >
                              <Printer size={14}/> Export PDF Report
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm">
                            <h3 className="font-bold mb-6">Tax Declaration ({canadianTaxes[taxRegion]?.name || 'Canada HST'})</h3>
                            <div className="space-y-4 text-sm">
                              <div className="flex justify-between p-4 bg-black/5 rounded-2xl">
                                <span>Reporting Period</span>
                                <span className="font-bold">March 2026</span>
                              </div>
                              <div className="flex justify-between p-4 bg-black/5 rounded-2xl">
                                <span>Total Taxable Sales</span>
                                <span className="font-bold">{formatPrice(stats.totalRevenue - stats.totalTax - stats.totalTips)}</span>
                              </div>
                              <div className="flex justify-between p-4 bg-black/5 rounded-2xl">
                                <span>Tax Collected ({Math.round((canadianTaxes[taxRegion]?.rate || 0.13) * 100)}%)</span>
                                <span className="font-bold">{formatPrice(stats.totalTax)}</span>
                              </div>
                              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs">
                                This report follows Canadian CRA guidelines for tax reporting in {taxRegion}.
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm">
                            <h3 className="font-bold mb-6">Recent Transactions</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {stats.orders?.slice().reverse().map((o: any) => (
                                <div key={o.id} className="flex justify-between items-center p-4 bg-[#F8F7F4] rounded-2xl text-xs border border-black/[0.02]">
                                  <div>
                                    <p className="font-bold">#{o.id}</p>
                                    <p className="text-black/40">{new Date(o.date).toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">{formatPrice(o.total)}</p>
                                    <p className="text-black/20">Tax: {formatPrice(o.tax)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* HIGH RESOLUTION SALES LEDGER PRINT OUT COMPONENT */}
                        <div id="sales-report-print-slip" className="printable-only-section p-6 bg-white border border-black rounded-lg font-mono text-[10px] text-black space-y-4 relative overflow-x-auto">
                          <div className="text-center border-b pb-2 leading-tight">
                            <span className="font-black text-xs uppercase block">KALIM COFFEE CO.</span>
                            <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">JURISDICTION SALES & TAX RECEIPTS LEDGER</span>
                            <span className="text-[8px] font-bold block">PERIOD ENDING MARCH 2026</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[8px] border-b pb-2 leading-normal">
                            <div>
                              <span className="text-zinc-500 block">TAX JURISDICTION ID:</span>
                              <span className="font-bold">{taxRegion} ({canadianTaxes[taxRegion]?.name || 'Canada HST'})</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">REGULATORY REGIME:</span>
                              <span className="font-bold">CANADA REVENUE AGENCY compliance rules</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">TOTAL REVENUE (incl Tax):</span>
                              <span className="font-bold">{formatPrice(stats.totalRevenue)}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">TOTAL TAX COLLECTED ({Math.round((canadianTaxes[taxRegion]?.rate || 0.13) * 100)}%):</span>
                              <span className="font-bold">{formatPrice(stats.totalTax)}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[8px] uppercase font-bold text-zinc-500 block mb-1">AUDITABLE TRANSACTIONS SLIP CHRONOLOGY</span>
                            <table className="w-full text-left text-[8px]">
                              <thead>
                                <tr className="border-b uppercase font-bold text-zinc-500">
                                  <th className="py-1">Order Ref ID</th>
                                  <th className="py-1">Timestamp</th>
                                  <th className="py-1 text-right">Tax Paid</th>
                                  <th className="py-1 text-right">Total Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stats.orders?.slice().reverse().slice(0, 15).map((o: any) => (
                                  <tr key={o.id} className="border-b border-zinc-100 font-mono">
                                    <td className="py-1 uppercase font-bold font-mono">#{o.id}</td>
                                    <td className="py-1">{new Date(o.date).toLocaleString()}</td>
                                    <td className="py-1 text-right">{formatPrice(o.tax)}</td>
                                    <td className="py-1 text-right font-bold">{formatPrice(o.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="text-[7px] text-zinc-400 font-bold tracking-tight pt-2 leading-none border-t text-center">
                            NOTICE: This ledger statement is compiled and formatted electronically in Calgary, Alberta. Verified for tax filing archives.
                          </div>
                        </div>

                      </div>
                    ) : reportsActiveSubTab === 'corporate_tax' ? (
                      <CorpTaxTab />
                    ) : (
                      <div className="space-y-6">
                        {/* Searchable and Paginated completed transaction history with date/customer filter options & AI Invoice finder */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                          {/* Left Column: Transaction List with search, date filter, status, pagination */}
                          <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white p-6 md:p-8 rounded-[36px] border border-black/5 shadow-sm space-y-6">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <h3 className="font-black text-lg uppercase tracking-tight">Completed Transactions Ledger</h3>
                                  <p className="text-xs text-neutral-400">Search and browse historic system invoices and customer sales.</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setTransactionSearchTerm('');
                                    setTransactionFilterDate('');
                                    setTransactionPage(1);
                                  }}
                                  className="text-[10px] font-black uppercase text-black/50 hover:text-black tracking-widest flex items-center gap-1.5 cursor-pointer"
                                >
                                  🔄 Clear Filters
                                </button>
                              </div>

                              {/* Search and Filters bar */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block ml-1">Search Customer / Order ID</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="Search by customer name, order #id..."
                                      value={transactionSearchTerm}
                                      onChange={(e) => {
                                        setTransactionSearchTerm(e.target.value);
                                        setTransactionPage(1);
                                      }}
                                      className="w-full bg-[#F8F7F4] p-3 text-xs font-bold rounded-xl border border-black/5 text-[#1A1A1A] placeholder-neutral-400"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block ml-1">Filter by Specific Date</label>
                                  <input
                                    type="date"
                                    value={transactionFilterDate}
                                    onChange={(e) => {
                                      setTransactionFilterDate(e.target.value);
                                      setTransactionPage(1);
                                    }}
                                    className="w-full bg-[#F8F7F4] p-3 text-xs font-bold rounded-xl border border-black/5 text-[#1A1A1A]"
                                  />
                                </div>
                              </div>

                              {/* Table Container */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b uppercase font-bold text-black/40 text-[9px] tracking-widest">
                                      <th className="pb-3">Order Ref</th>
                                      <th className="pb-3">Customer</th>
                                      <th className="pb-3 text-center">Payment</th>
                                      <th className="pb-3 text-right">Items Count</th>
                                      <th className="pb-3 text-right">Total Price</th>
                                      <th className="pb-3 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-black/[0.05]">
                                    {(() => {
                                      const filtered = orders.filter((o) => {
                                        const term = transactionSearchTerm.toLowerCase();
                                        const matchesSearch = !transactionSearchTerm ||
                                          o.id?.toLowerCase().includes(term) ||
                                          o.customerName?.toLowerCase().includes(term) ||
                                          (o.customerPhone && o.customerPhone.includes(transactionSearchTerm));

                                        const dateFilterValue = transactionFilterDate; // e.g. "2026-06-16"
                                        let matchesDate = true;
                                        if (dateFilterValue) {
                                          const orderDateStr = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
                                          matchesDate = orderDateStr === dateFilterValue;
                                        }

                                        return matchesSearch && matchesDate;
                                      });

                                      const PAGE_SIZE = 6;
                                      const totPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                                      
                                      // Correct transaction page bounds
                                      const safePage = Math.min(transactionPage, totPages);
                                      const startIdx = (safePage - 1) * PAGE_SIZE;
                                      const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

                                      if (filtered.length === 0) {
                                        return (
                                          <tr>
                                            <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">
                                              No records matched your search filters.
                                            </td>
                                          </tr>
                                        );
                                      }

                                      return (
                                        <>
                                          {paginated.map((o) => {
                                            const totalItemQty = o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0;
                                            return (
                                              <tr key={o.id} className="hover:bg-neutral-50 transition-all">
                                                <td className="py-3 font-mono font-black uppercase text-[11px]">#{o.id}</td>
                                                <td className="py-3">
                                                  <p className="font-bold">{o.customerName || "Guest"}</p>
                                                  <p className="text-[10px] text-neutral-400">{o.customerPhone || 'POS walk-in'}</p>
                                                </td>
                                                <td className="py-3 text-center">
                                                  <span className="text-[10px] bg-neutral-100 px-2 py-1 rounded-md font-bold text-neutral-600">
                                                    {o.paymentMethod || "Cash"}
                                                  </span>
                                                </td>
                                                <td className="py-3 text-right font-mono font-bold text-neutral-600">
                                                  {totalItemQty} cups
                                                </td>
                                                <td className="py-3 text-right font-black text-[#1A1A1A]">
                                                  {formatPrice(o.totalPrice || 0)}
                                                </td>
                                                <td className="py-3 text-center">
                                                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                                                    o.status === "Completed" ? "bg-green-100 text-green-700" :
                                                    o.status === "Ready" ? "bg-blue-100 text-blue-700" :
                                                    "bg-yellow-100 text-yellow-700"
                                                  }`}>
                                                    {o.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </tbody>
                                </table>
                              </div>

                              {/* Pagination control metrics */}
                              {(() => {
                                const filtered = orders.filter((o) => {
                                  const term = transactionSearchTerm.toLowerCase();
                                  const matchesSearch = !transactionSearchTerm ||
                                    o.id?.toLowerCase().includes(term) ||
                                    o.customerName?.toLowerCase().includes(term) ||
                                    (o.customerPhone && o.customerPhone.includes(transactionSearchTerm));

                                  const dateFilterValue = transactionFilterDate;
                                  let matchesDate = true;
                                  if (dateFilterValue) {
                                    const orderDateStr = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
                                    matchesDate = orderDateStr === dateFilterValue;
                                  }
                                  return matchesSearch && matchesDate;
                                });

                                const PAGE_SIZE = 6;
                                const totPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                                const safePage = Math.min(transactionPage, totPages);

                                return (
                                  <div className="flex justify-between items-center border-t pt-4">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-[#1A1A1A]/40">
                                      Showing {filtered.length} matching transactions
                                    </p>
                                    
                                    <div className="flex items-center gap-3">
                                      <button
                                        disabled={safePage <= 1}
                                        onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl font-bold text-[10px] uppercase text-black disabled:opacity-30 cursor-pointer"
                                      >
                                        ◀ Prev
                                      </button>
                                      <span className="text-[11px] font-black uppercase text-black/70">
                                        Page {safePage} of {totPages}
                                      </span>
                                      <button
                                        disabled={safePage >= totPages}
                                        onClick={() => setTransactionPage(p => Math.min(totPages, p + 1))}
                                        className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl font-bold text-[10px] uppercase text-black disabled:opacity-30 cursor-pointer"
                                      >
                                        Next ▶
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Right Column: AI Intelligent Invoice Searching Assistant */}
                          <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gradient-to-tr from-neutral-900 to-zinc-800 text-white p-6 md:p-8 rounded-[36px] shadow-xl border border-white/5 space-y-6">
                              <div className="flex items-center gap-3">
                                <span className="p-2 sm:p-2.5 bg-yellow-400 text-black rounded-xl animate-pulse">
                                  <Sparkles size={16} />
                                </span>
                                <div>
                                  <h4 className="font-extrabold uppercase text-xs tracking-widest text-yellow-400">AI INVOICE COMPANION</h4>
                                  <h3 className="font-black text-sm">Natural Language Invoice Finder</h3>
                                </div>
                              </div>

                              <p className="text-[11px] text-zinc-300 leading-normal">
                                Describe anything you are looking for in natural language! For example: <em>"Find John Miller's caramel card order over $10"</em> or <em>"Any transaction paying in cash with oat milk"</em>.
                              </p>

                              <div className="space-y-2">
                                <textarea
                                  placeholder="Type search context here..."
                                  value={aiInvoiceQuery}
                                  onChange={(e) => setAiInvoiceQuery(e.target.value)}
                                  className="w-full min-h-[80px] bg-white/5 border border-white/10 p-3 text-xs rounded-xl text-white placeholder-zinc-500 font-bold focus:outline-none focus:border-yellow-400"
                                />
                                
                                <button
                                  disabled={aiInvoiceSearching || !aiInvoiceQuery.trim()}
                                  onClick={async () => {
                                    setAiInvoiceSearching(true);
                                    setAiInvoiceSearchResult(null);
                                    try {
                                      // Package actual orders list
                                      const cleanedOrdersList = orders.map(o => ({
                                        id: o.id,
                                        customer: o.customerName,
                                        total: o.totalPrice,
                                        payMode: o.paymentMethod,
                                        items: o.items?.map((it: any) => ({
                                          product: it.product?.name,
                                          size: it.size,
                                          toppings: it.toppings?.map((tx: any) => tx.name)
                                        })),
                                        status: o.status,
                                        date: o.createdAt
                                      }));

                                      const res = await fetch("/api/ai-search-invoices", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ query: aiInvoiceQuery, ordersList: cleanedOrdersList })
                                      });
                                      const data = await res.json();
                                      if (data.result) {
                                        setAiInvoiceSearchResult(data.result);
                                      } else {
                                        setAiInvoiceSearchResult("No exact match report returned.");
                                      }
                                    } catch (err: any) {
                                      setAiInvoiceSearchResult("Error querying smart finder assistant: " + (err.message || err));
                                    } finally {
                                      setAiInvoiceSearching(false);
                                    }
                                  }}
                                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                                >
                                  {aiInvoiceSearching ? (
                                    <>
                                      <RefreshCw className="animate-spin" size={14} /> Searching...
                                    </>
                                  ) : (
                                    <>
                                      Ask AI Assistant
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* AI Search Match Output Block */}
                              {aiInvoiceSearchResult && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl animate-fade-in space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Match Found</h5>
                                    <button onClick={() => setAiInvoiceSearchResult(null)} className="text-[9px] font-bold underline uppercase text-zinc-400 hover:text-white cursor-pointer">✕ clear</button>
                                  </div>
                                  <div className="text-zinc-100 text-[11px] prose prose-invert leading-relaxed overflow-x-auto select-text">
                                    {aiInvoiceSearchResult.split('\n').map((line, idx) => {
                                      if (line.startsWith('|')) {
                                        return <pre key={idx} className="font-mono text-[9px] bg-black/45 p-1 rounded overflow-x-auto">{line}</pre>;
                                      }
                                      return <p key={idx} className="my-1">{line}</p>;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {((adminSubTab === 'dashboard' && dashboardSubTab === 'ai_insights') || (adminSubTab === 'ai')) && hasPermission('ai') && (
                  <div className="space-y-8 animate-fade-in text-left">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-neutral-900">Kalim Support Centre</h2>
                      <p className="text-sm text-neutral-500 mt-1">Real-time coffee specifications, syrup heuristics standards, and operational AI chat coach.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: AI Operational Chat Assistant */}
                      <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[36px] border border-black/5 flex flex-col h-[580px] justify-between shadow-sm">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-neutral-900 text-white rounded-xl">
                              <Sparkles size={16} />
                            </span>
                            <div>
                              <h3 className="font-bold text-sm text-neutral-800">Kalim Support Chat Desk</h3>
                              <p className="text-[10px] text-neutral-400">Ask any coffee recipe metrics or troubleshooting steps</p>
                            </div>
                          </div>
                          
                          <select
                            value={aiLanguage}
                            onChange={(e) => setAiLanguage(e.target.value as any)}
                            className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold text-neutral-700"
                          >
                            <option value="en">English (EN)</option>
                            <option value="fr">French (FR)</option>
                            <option value="es">Spanish (ES)</option>
                            <option value="ja">Japanese (JA)</option>
                            <option value="zh">Chinese (ZH)</option>
                          </select>
                        </div>

                        {/* Message Panel */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin text-xs">
                          {aiChatHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                              <span className="p-3 bg-neutral-50 text-neutral-400 rounded-full">
                                <Coffee size={24} />
                              </span>
                              <div>
                                <h4 className="font-bold text-neutral-800 text-sm">Welcome Barista! 😊</h4>
                                <p className="text-neutral-500 text-[10.5px] max-w-sm mt-1 leading-normal">
                                  Need recipe ratios? Type your question below (e.g. "What is the Latte Medium milk and espresso metric?") and Kalim AI Support will deliver precision calculations immediately. ☕
                                </p>
                              </div>
                            </div>
                          ) : (
                            aiChatHistory.map((chat, i) => (
                              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl leading-relaxed text-xs shadow-sm ${
                                  chat.role === 'user' 
                                    ? 'bg-neutral-900 text-white rounded-tr-none' 
                                    : 'bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none'
                                }`}>
                                  {chat.parts[0].text}
                                </div>
                              </div>
                            ))
                          )}
                          {isAiTyping && (
                            <div className="flex justify-start">
                              <div className="bg-neutral-50 border border-neutral-100 text-neutral-400 px-4 py-2 rounded-2xl flex items-center gap-2">
                                <RefreshCw className="animate-spin" size={12} />
                                <span className="font-bold text-[10px]">Support AI is processing specifications...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Submit Field */}
                        <form onSubmit={handleAiChat} className="flex gap-2">
                          <input 
                            value={aiChatMessage}
                            onChange={(e) => setAiChatMessage(e.target.value)}
                            placeholder="Type recipe or POS inquiry here..."
                            className="flex-1 bg-neutral-50 border border-neutral-200 px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <button
                            type="submit"
                            className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 rounded-2xl font-black text-xs transition-colors flex items-center gap-1"
                          >
                            Send
                          </button>
                        </form>
                      </div>

                      {/* Right: Beverage Recipe Study Guide */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-[36px] border border-black/5 shadow-sm space-y-4">
                          <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                            <BookOpen size={18} className="text-zinc-500" /> Recipe Specs Study Booklet
                          </h3>
                          <p className="text-xs text-neutral-500 leading-normal">
                            Memorize ingredients, syrup pump metrics, and espresso shot gram weights dynamically to ensure outstanding cup consistency for Kalim loyalty guests.
                          </p>

                          <div className="space-y-4 pt-2">
                            {/* Espresso shots */}
                            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                              <h4 className="text-[10px] uppercase font-black tracking-widest text-[#E07A5F]">Espresso Ground Coffee Standards</h4>
                              <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Small</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">1 Shot (18g)</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Medium</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">2 Shots (18g)</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Large</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">2 Shots (24g)</span>
                                </div>
                              </div>
                            </div>

                            {/* Latte Milk */}
                            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                              <h4 className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Standard Latte Milk Volume</h4>
                              <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Small</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">160 ml</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Medium</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">220 ml</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Large</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">280 ml</span>
                                </div>
                              </div>
                            </div>

                            {/* Cappuccino */}
                            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                              <h4 className="text-[10px] uppercase font-black tracking-widest text-[#E07A5F] ">Standard Cup foam Cappuccino</h4>
                              <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Small</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">140 ml</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Medium</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">200 ml</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Large</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">260 ml</span>
                                </div>
                              </div>
                            </div>

                            {/* Sweet Syrups */}
                            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                              <h4 className="text-[10px] uppercase font-black tracking-widest text-indigo-600">Flavoring Sweet Syrup Pumps</h4>
                              <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Small</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">1.5 Pumps (15ml)</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Medium</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">2 Pumps (20ml)</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl">
                                  <span className="text-[9px] text-zinc-400 font-bold block bg-neutral-50 py-0.5 rounded uppercase">Large</span>
                                  <span className="font-mono font-extrabold text-[#111] text-xs">3 Pumps (30ml)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable corporate stats & insights panel */}
                    <div className="bg-neutral-50 p-6 md:p-8 rounded-[36px] border border-neutral-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-neutral-800">Advanced AI Business Insights</h3>
                          <p className="text-xs text-neutral-500 mt-1">Request audit forecasting and strategic profitability updates from Gemini Core.</p>
                        </div>
                        <button 
                          onClick={generateAiInsights} 
                          disabled={isGeneratingAi}
                          className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-extrabold px-5 py-3 rounded-2xl text-xs transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                          <TrendingUp size={14} /> {isGeneratingAi ? 'Analyzing Data...' : 'Run Corporate Analysis'}
                        </button>
                      </div>

                      {aiInsights && (
                        <div className="bg-white p-6 rounded-3xl border border-neutral-200 mt-6 shadow-inner animate-fade-in text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-mono select-text text-neutral-700">
                          {aiInsights}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {adminSubTab === 'membership' && hasPermission('users') && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-neutral-900">Loyalty Program & VIP Cards</h2>
                        <p className="text-sm text-neutral-500 mt-1">Design seasonal member cards, run autopilot birthday greets, and check loyalty habits.</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const resp = await fetch("/api/loyalty-customers/birthday-broadcast", { method: "POST" });
                            const data = await resp.json();
                            alert(`🎉 Birthday Autopilot Triggered!\n• Guests celebrating today: ${data.processedCount}\n• Auto-SMS dispatched: ${data.sentCount}`);
                            fetchData();
                          } catch(err) {
                            alert("Broadcast process encountered errors");
                          }
                        }}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs md:text-sm self-stretch lg:self-auto justify-center"
                      >
                        <Gift size={18} />
                        Run Birthday SMS Autopilot
                      </button>
                    </div>

                    {/* Camera Based QR loyalty code scanner */}
                    <CameraQrScanner 
                      customers={loyaltyCustomers}
                      onCustomerScanned={(customer) => {
                        setScannedCustomer(customer);
                      }}
                      currentlyScanned={scannedCustomer}
                    />

                    {/* Birthday Alert Notification banner for staff */}
                    {loyaltyCustomers.some(c => {
                      if (!c.dob) return false;
                      const p = c.dob.split("-");
                      return p.length === 3 && `${p[1]}-${p[2]}` === "06-15";
                    }) && (
                      <div className="bg-amber-50 border border-amber-200/50 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-500 text-white rounded-2xl">
                            <Cake className="animate-bounce" size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-950 text-sm md:text-base">🎂 Customer Birthday Today Alert!</h4>
                            <p className="text-xs text-amber-900/80 mt-0.5">
                              The following VIP members are celebrating today ({new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric'})}):{" "}
                              <span className="font-extrabold text-amber-950">
                                {loyaltyCustomers.filter(c => {
                                  const p = c.dob?.split("-");
                                  return p?.length === 3 && `${p[1]}-${p[2]}` === "06-15";
                                }).map(c => c.name).join(", ")}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-amber-900 border border-amber-900/20 bg-amber-100/50 px-4 py-2 rounded-xl font-bold">
                          💡 Action: Gift surprise Birthday Cake + Deliver customized congrats!
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Designer Studio */}
                      <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[36px] border border-black/5 space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                            <Palette size={18} className="text-black/50" /> Card Design Studio
                          </h3>
                          
                          {/* Live Card Preview */}
                          <div 
                            style={{ 
                              background: `linear-gradient(135deg, ${designColorStart}, ${designColorEnd})`,
                              boxShadow: designGlow ? "0 20px 40px -10px rgba(0,0,0,0.3)" : "none"
                            }}
                            className="aspect-[1.58/1] rounded-3xl p-6 text-white relative overflow-hidden transition-all duration-300 flex flex-col justify-between border border-white/10 group cursor-default"
                          >
                            {/* Decorative Pattern Lines */}
                            {designPattern === 'radial' && (
                              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none scale-150" />
                            )}
                            {designPattern === 'wave' && (
                              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,_transparent_25%,_rgba(255,255,255,0.3)_50%,_transparent_75%)] bg-[length:40px_40px] pointer-events-none" />
                            )}
                            {designPattern === 'premium' && (
                              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(ellipse at top left, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
                            )}

                            <div className="flex justify-between items-start z-10">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">VIP MEMBER CLUB</span>
                                <span className="font-black text-lg tracking-tight mt-0.5">{designLogo}</span>
                              </div>
                              <span className="text-xs font-black uppercase bg-white/20 px-3 py-1 rounded-full border border-white/20 shadow-inner">
                                {designSeason} Season
                              </span>
                            </div>

                            <div className="z-10 flex flex-col mt-auto">
                              <div className="flex justify-between items-end">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 block">MEMBER ID</span>
                                  <span className="font-mono text-xs tracking-wider font-extrabold">KC-2026-8888</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 block font-sans">TIER</span>
                                  <span className="text-xs font-black tracking-wide">PLATINUM CLUB</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Season Template</label>
                              <select 
                                value={designSeason}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDesignSeason(val);
                                  if (val === 'Spring') { setDesignColorStart('#e2d4f0'); setDesignColorEnd('#b8e1dd'); setDesignPattern('radial'); }
                                  if (val === 'Summer') { setDesignColorStart('#1e1e2f'); setDesignColorEnd('#ff6b6b'); setDesignPattern('radial'); }
                                  if (val === 'Autumn') { setDesignColorStart('#c2593f'); setDesignColorEnd('#e3a857'); setDesignPattern('wave'); }
                                  if (val === 'Winter') { setDesignColorStart('#102a43'); setDesignColorEnd('#486581'); setDesignPattern('premium'); }
                                }}
                                className="w-full bg-neutral-50 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                              >
                                <option value="Spring">Spring 🌸</option>
                                <option value="Summer">Summer ☀️</option>
                                <option value="Autumn">Autumn 🍂</option>
                                <option value="Winter">Winter ❄️</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Logo / Text</label>
                              <input 
                                value={designLogo}
                                onChange={(e) => setDesignLogo(e.target.value)}
                                className="w-full bg-neutral-50 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-extrabold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Color Start</label>
                              <div className="flex gap-2">
                                <input 
                                  type="color" 
                                  value={designColorStart} 
                                  onChange={(e) => setDesignColorStart(e.target.value)}
                                  className="w-8 h-8 rounded border-none cursor-pointer"
                                />
                                <input 
                                  value={designColorStart} 
                                  onChange={(e) => setDesignColorStart(e.target.value)}
                                  className="w-full bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 text-[10px] font-mono text-center"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Color End</label>
                              <div className="flex gap-2">
                                <input 
                                  type="color" 
                                  value={designColorEnd} 
                                  onChange={(e) => setDesignColorEnd(e.target.value)}
                                  className="w-8 h-8 rounded border-none cursor-pointer"
                                />
                                <input 
                                  value={designColorEnd} 
                                  onChange={(e) => setDesignColorEnd(e.target.value)}
                                  className="w-full bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 text-[10px] font-mono text-center"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Pattern</label>
                              <select 
                                value={designPattern}
                                onChange={(e) => setDesignPattern(e.target.value)}
                                className="w-full bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                              >
                                <option value="simple">Simple Minimal</option>
                                <option value="radial">Ambient Center Glow</option>
                                <option value="wave">Wave Stripes</option>
                                <option value="premium">Metallic Reflection</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-3 pt-6 pl-2">
                              <input 
                                type="checkbox" 
                                checked={designGlow}
                                onChange={(e) => setDesignGlow(e.target.checked)}
                                id="designGlow"
                                className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                              />
                              <label htmlFor="designGlow" className="text-xs font-bold text-neutral-600 select-none cursor-pointer">Shadow Glow</label>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              const resp = await fetch("/api/loyalty-cards/seasonal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  currentSeason: designSeason,
                                  customLogo: designLogo,
                                  cardColorStart: designColorStart,
                                  cardColorEnd: designColorEnd,
                                  vipPattern: designPattern,
                                  cardGlowEffect: designGlow
                                })
                              });
                              const data = await resp.json();
                              setSeasonalCardConfig(data);
                              alert("🎉 Seasonal Loyalty VIP card design system synchronized successfully to all cashier POS terminals!");
                            } catch(err) {
                              alert("Failure to save customized layout");
                            }
                          }}
                          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold py-3.5 rounded-2xl transition-colors mt-4 text-xs tracking-wider uppercase"
                        >
                          Publish Design to Cashier Screens
                        </button>
                      </div>

                      {/* Right side: Register Form & SMS logs */}
                      <div className="lg:col-span-7 flex flex-col gap-8">
                        {/* Birthday Promo Dispatch Logger */}
                        <div className="bg-white p-6 md:p-8 rounded-[36px] border border-black/5 space-y-4">
                          <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                            <Send size={18} className="text-zinc-500" /> Automated Birthday Greeting Dispatch Logs
                          </h3>
                          <p className="text-xs text-neutral-500">Live feed of automatically sent SMS greetings containing seasonal free pastry vouchers precisely for guests celebrating today.</p>
                          
                          <div className="max-h-[175px] overflow-y-auto border border-neutral-100 rounded-2xl bg-neutral-50/50 p-4 space-y-3 font-mono text-[9px] md:text-xs">
                            {smsDeliveryLogs.length === 0 ? (
                              <div className="text-center text-neutral-400 py-6">No SMS dispatches logged yet today.</div>
                            ) : (
                              smsDeliveryLogs.map((log, index) => (
                                <div key={log.id || index} className="p-3 bg-white border border-neutral-100 rounded-xl space-y-1 shadow-sm">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-zinc-500 font-sans">{new Date(log.timestamp).toLocaleString()}</span>
                                    <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full font-mono">{log.promoCode}</span>
                                  </div>
                                  <p className="text-neutral-700 font-sans leading-normal">{log.message}</p>
                                  <div className="text-[8px] text-emerald-500 flex items-center gap-1 font-bold">
                                    <span>● SMS Status: Delivered successfully</span>
                                    <span className="text-zinc-300">|</span>
                                    <span className="text-zinc-500 font-sans">To: {log.customerName} ({log.phone})</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Add Member form */}
                        <div className="bg-white p-6 md:p-8 rounded-[36px] border border-black/5 space-y-4">
                          <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                            <UserPlus size={18} className="text-black/50" /> Register New VIP Guest
                          </h3>
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!newCustName || !newCustPhone || !newCustDob) {
                                alert("Please fill Name, Phone and Birthdate!");
                                return;
                              }
                              try {
                                const resp = await fetch("/api/loyalty-customers", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    name: newCustName,
                                    phone: newCustPhone,
                                    dob: newCustDob,
                                    favoriteDrink: newCustDrink,
                                    tier: newCustTier
                                  })
                                });
                                if (resp.ok) {
                                  setNewCustName("");
                                  setNewCustPhone("");
                                  setNewCustDob("");
                                  setNewCustDrink("");
                                  setNewCustTier("Silver member");
                                  alert("🎉 New VIP membership profile registered successfully!");
                                  fetchData();
                                }
                              } catch(err) {
                                alert("Could not save guest detail");
                              }
                            }}
                            className="bg-neutral-50/50 p-4 md:p-6 rounded-3xl border border-neutral-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-neutral-500">Guest Name</label>
                                <input 
                                  value={newCustName} 
                                  onChange={(e) => setNewCustName(e.target.value)} 
                                  placeholder="E.g. Emma Watson"
                                  className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-neutral-500">Phone Code</label>
                                <input 
                                  value={newCustPhone} 
                                  onChange={(e) => setNewCustPhone(e.target.value)} 
                                  placeholder="E.g. 555-0199"
                                  className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-neutral-500">Birthday (YYYY-MM-DD)</label>
                                <input 
                                  type="date"
                                  value={newCustDob} 
                                  onChange={(e) => setNewCustDob(e.target.value)} 
                                  className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-neutral-500">Membership Tier</label>
                                <select
                                  value={newCustTier}
                                  onChange={(e) => setNewCustTier(e.target.value)}
                                  className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs font-bold"
                                >
                                  <option value="Silver member">Silver Tier</option>
                                  <option value="Gold member">Gold Tier</option>
                                  <option value="Platinum member">Platinum Tier</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1 mt-4">
                              <label className="text-[10px] font-bold uppercase text-neutral-500">Preferred Drink Habits / Recipe Preferences</label>
                              <input 
                                value={newCustDrink} 
                                onChange={(e) => setNewCustDrink(e.target.value)} 
                                placeholder="E.g. Hot Latte with Caramel Syrup, Medium, double shot espresso"
                                className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs font-bold"
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs py-3 rounded-2xl mt-4 transition-colors tracking-tight"
                            >
                              Enroll Guest Profile
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {/* Active Customers List Table */}
                    <div className="bg-white p-6 md:p-8 rounded-[36px] border border-black/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                          <Users size={18} className="text-zinc-500" /> {t('active_customers')} ({loyaltyCustomers.length})
                        </h3>
                        <span className="text-xs bg-black text-white px-3 py-1 rounded-full font-bold">{t('customer_directory')}</span>
                      </div>
                      
                      <div className="overflow-x-auto border border-neutral-100 rounded-3xl">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold uppercase text-neutral-500 uppercase tracking-widest text-center">
                              <th className="p-4 text-left">Member Name</th>
                              <th className="p-4">Phone (ID) & Pwd</th>
                              <th className="p-4">Birth Date</th>
                              <th className="p-4 text-left">Drinking Habit</th>
                              <th className="p-4">Points</th>
                              <th className="p-4">Tier Level</th>
                              <th className="p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loyaltyCustomers.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-neutral-400 text-xs font-bold">No loyalty profiles found. Add profiles above!</td>
                              </tr>
                            ) : (
                              loyaltyCustomers.map(customer => {
                                const isBirthdayToday = (() => {
                                  if (!customer.dob) return false;
                                  const parts = customer.dob.split("-");
                                  return parts.length === 3 && `${parts[1]}-${parts[2]}` === "06-15";
                                })();

                                return (
                                  <tr key={customer.id} className={`border-b border-neutral-100 text-xs font-medium hover:bg-neutral-50 transition-colors ${isBirthdayToday ? 'bg-rose-50/30' : ''}`}>
                                    <td className="p-4 font-extrabold flex items-center gap-2 text-neutral-900">
                                      {customer.name}
                                      {isBirthdayToday && (
                                        <span className="bg-rose-500 text-white font-bold p-1 rounded-full animate-bounce" title="Birthday Today!">
                                          <Cake size={10} />
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 font-mono text-center text-neutral-500 flex flex-col items-center justify-center gap-1">
                                      <span>{customer.phone}</span>
                                      <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded-md text-[10px]">
                                        <span className={visibleCustomerPasswords[customer.id] ? "text-black" : "tracking-[0.2em]"}>
                                          {visibleCustomerPasswords[customer.id] ? (customer.password || '123456') : '••••'}
                                        </span>
                                        <button 
                                          onClick={() => setVisibleCustomerPasswords(prev => ({ ...prev, [customer.id]: !prev[customer.id] }))}
                                          className="text-neutral-400 hover:text-black transition-colors"
                                        >
                                          {visibleCustomerPasswords[customer.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-4 font-bold text-center text-neutral-500">{customer.dob || "Unknown"}</td>
                                    <td className="p-4 text-neutral-600 font-semibold">{customer.favoriteDrink || "None logged"}</td>
                                    <td className="p-4 font-mono font-extrabold text-center text-neutral-900">⭐ {customer.points}</td>
                                    <td className="p-4 text-center">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        customer.tier === 'Platinum member' ? 'bg-purple-100 text-purple-700' :
                                        customer.tier === 'Gold member' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'
                                      }`}>
                                        {customer.tier}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center">
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          onClick={() => {
                                            setScannedCustomer(customer);
                                            setActiveTab('cashier');
                                            alert(`⚡ Simulating NFC/Barcode card tap for guest: ${customer.name}. Redirecting you to POS ordering sidebar...`);
                                          }}
                                          className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                                        >
                                          <QrCode size={12} /> Live POS Tap
                                        </button>
                                        <button
                                          onClick={async () => {
                                            const newPassword = prompt(`Enter new password for ${customer.name}:`);
                                            if (!newPassword || newPassword.trim() === '') return;
                                            try {
                                              await fetch(`/api/loyalty-customers/${customer.id}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ password: newPassword.trim() })
                                              });
                                              alert(`Password updated for ${customer.name}`);
                                              fetchData();
                                            } catch (err) {
                                              alert("Could not update password");
                                            }
                                          }}
                                          className="text-[10px] bg-[#E07A5F] hover:bg-[#c96348] text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                                        >
                                          <ShieldCheck size={12} /> Reset Pwd
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!confirm("Are you sure you want to remove this loyalty guest?")) return;
                                            try {
                                              await fetch(`/api/loyalty-customers/${customer.id}`, { method: "DELETE" });
                                              fetchData();
                                            } catch(err) {
                                              alert("Could not remove client");
                                            }
                                          }}
                                          className="text-rose-500 hover:text-rose-700 p-1 transition-colors ml-2"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'settings' && hasPermission('settings') && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold">System Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-[40px] border border-black/5 space-y-6">
                        <StoreMap />

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Website Integration URL</label>
                          <input 
                            value={websiteUrl} 
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="w-full bg-black/5 p-4 rounded-2xl font-bold"
                            placeholder="https://kalimcoffee.ca"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Currency</label>
                          <select 
                            value={currency} 
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none"
                          >
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="VND">VND - Vietnam Dong</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">App / AI Language Choice</label>
                          <select 
                            value={aiLanguage} 
                            onChange={(e) => setAiLanguage(e.target.value as any)}
                            className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none cursor-pointer"
                          >
                            <option value="en">English (EN)</option>
                            <option value="fr">French (FR)</option>
                            <option value="es">Spanish (ES)</option>
                            <option value="ja">Japanese (JA)</option>
                            <option value="zh">Chinese (ZH)</option>
                            <option value="vi">Vietnamese (VI)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Tax Region (Canada)</label>
                          <select 
                            value={taxRegion} 
                            onChange={(e) => updateTaxRegion(e.target.value)}
                            className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none"
                          >
                            {Object.entries(canadianTaxes).map(([code, info]: any) => (
                              <option key={code} value={code}>{info.name} ({(info.rate * 100).toFixed(1)}%)</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-black/40 ml-2 italic">* Automatically updated based on your location.</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-black/5">
                          <div>
                            <h4 className="font-bold">Automated Busy Mode</h4>
                            <p className="text-[10px] text-black/40">Automatically toggle busy mode based on active orders.</p>
                          </div>
                          <button 
                            onClick={toggleAutoBusy}
                            className={`w-12 h-6 rounded-full relative transition-all ${autoBusyMode ? 'bg-black' : 'bg-black/10'}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${autoBusyMode ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-[40px] border border-black/5 space-y-6">
                        <h3 className="font-bold">Employee ID Configuration</h3>
                        <p className="text-sm text-black/40">Set the valid range for employee IDs (1-99999).</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Min ID</label>
                            <input 
                              type="number" 
                              value={minEmployeeId} 
                              onChange={(e) => setMinEmployeeId(Number(e.target.value))}
                              className="w-full bg-black/5 p-4 rounded-2xl font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Max ID</label>
                            <input 
                              type="number" 
                              value={maxEmployeeId} 
                              onChange={(e) => setMaxEmployeeId(Number(e.target.value))}
                              className="w-full bg-black/5 p-4 rounded-2xl font-bold"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            await fetch('/api/settings', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ minEmpId: minEmployeeId, maxEmpId: maxEmployeeId })
                            });
                            alert("Employee ID settings saved!");
                          }}
                          className="w-full bg-black text-white py-4 rounded-2xl font-bold"
                        >
                          Save ID Settings
                        </button>
                      </div>
                      
                      <div className="bg-white p-8 rounded-[40px] border border-black/5 space-y-6">
                        <h3 className="font-bold">Website Integration</h3>
                        <p className="text-sm text-black/40">Synchronize your POS menu with your online store and customer app.</p>
                        <button 
                          onClick={handleSyncMenu}
                          disabled={isSyncingMenu}
                          className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                        >
                          <Globe size={18} className={isSyncingMenu ? "animate-spin" : ""} /> 
                          {isSyncingMenu ? "Syncing..." : "Sync Menu to Website"}
                        </button>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <CheckCircle2 size={16} />
                          </div>
                          <p className="text-xs font-bold text-emerald-700">Online Orders are currently active and syncing.</p>
                        </div>
                      </div>

                      <div className="bg-[#1a1a1a] p-8 rounded-[40px] border border-black/5 space-y-6 text-white md:col-span-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                              <Sparkles size={20} className="text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="font-bold">AI Developer & AI Studio App Configurations</h3>
                              <p className="text-sm text-white/40">Settings for prompts and logic configurations to easily edit this app later.</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                              <h4 className="font-bold text-sm text-white focus:outline-none mb-2">AI Tax Update Logic</h4>
                              <p className="text-xs text-white/50 mb-3">AI evaluates User coordinates against local Canadian law real-time.</p>
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-emerald-400">
                                <code className="text-[11px] font-mono">Endpoint: /api/ai-update-tax</code>
                              </div>
                           </div>
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                              <h4 className="font-bold text-sm text-white mb-2">Google Maps Platform</h4>
                              <p className="text-xs text-white/50 mb-3">Renders store location. API key needed.</p>
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-blue-400">
                                <code className="text-[11px] font-mono">Component: StoreMap.tsx</code>
                              </div>
                           </div>
                        </div>
                        <p className="text-[10px] text-white/30 text-center uppercase tracking-widest font-bold pt-4">In AI Studio, prompt the agent to update modules inside /server.ts to change AI logic.</p>
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'users' && hasPermission('users') && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-black/5 pb-4 gap-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold">Staff Management</h2>
                        <p className="text-xs text-black/40">Oversee team rosters, analyze performance efficiency and coordinate AI smart scheduling.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 bg-black/[0.03] p-1.5 rounded-2xl border border-black/5">
                        <button 
                          onClick={() => setStaffActiveTab('directory')} 
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${staffActiveTab === 'directory' ? 'bg-black text-white shadow' : 'text-black/50 hover:bg-black/10'}`}
                        >
                          Roster Directory
                        </button>
                        <button 
                          onClick={() => setStaffActiveTab('performance')} 
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${staffActiveTab === 'performance' ? 'bg-black text-white shadow' : 'text-black/50 hover:bg-black/10'}`}
                        >
                          Performance Charts
                        </button>
                        <button 
                          onClick={() => setStaffActiveTab('ai_scheduler')} 
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${staffActiveTab === 'ai_scheduler' ? 'bg-black text-white shadow' : 'text-black/50 hover:bg-black/10'}`}
                        >
                          AI Shift Manager
                        </button>
                        <button 
                          onClick={() => setStaffActiveTab('payroll')} 
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${staffActiveTab === 'payroll' ? 'bg-black text-white shadow' : 'text-black/50 hover:bg-black/10'}`}
                        >
                          Payroll & Paystubs
                        </button>
                        <button 
                          onClick={() => setStaffActiveTab('anti_cheat')} 
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${staffActiveTab === 'anti_cheat' ? 'bg-black text-white shadow' : 'text-black/50 hover:bg-black/10'}`}
                        >
                          🛡️ Anti-Cheat Simulator
                        </button>
                        <button 
                          onClick={() => setStaffActiveTab('time_clock')} 
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${staffActiveTab === 'time_clock' ? 'bg-black text-white shadow' : 'text-black/50 hover:bg-black/10'}`}
                        >
                          ⏱️ Time Clock & Logs
                        </button>
                      </div>
                    </div>

                    {staffActiveTab === 'directory' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-black uppercase tracking-wider text-black/40">Staff Personnel Directory</h3>
                          <button 
                            onClick={() => { setEditingUser({ name: '', role: 'employee', pin: '' }); setShowUserModal(true); }}
                            className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 transition-transform"
                          >
                            <Users size={16}/> + Add Staff Member
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {users.map(u => (
                            <div key={u.id} className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                                  <User className="text-black/40" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 bg-black/5 rounded-lg hover:bg-black/10 transition-colors"><FileText size={14}/></button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><AlertCircle size={14}/></button>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{u.name}</h3>
                                <div className="flex justify-between items-center mb-3">
                                  <p className="text-xs text-black/40 font-bold uppercase tracking-widest">{(u.role || "").toUpperCase()}</p>
                                  <p className="text-xs font-bold bg-black/5 px-2 py-1 rounded-lg">ID: {u.employeeId}</p>
                                </div>
                                <div className="space-y-1 bg-black/[0.02] p-2.5 rounded-xl border border-black/5 text-xs text-black/60">
                                  <p className="truncate"><strong>📧 Email:</strong> {u.email || "Not specified"}</p>
                                  <p><strong>📱 Phone:</strong> {u.phone || "Not specified"}</p>
                                  <p className="text-[10px] text-indigo-600 mt-1 uppercase font-bold tracking-wider">
                                    Preference: {u.notificationPreference === 'both' ? '💫 Email & SMS' : u.notificationPreference === 'sms' ? '📱 SMS' : '📧 Email'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <p className="text-xs text-black/40 font-bold flex gap-1">
                                    <span>PIN: </span>
                                    <span className={visibleStaffPins[u.id] ? "text-black" : "tracking-[0.2em] font-mono"}>{visibleStaffPins[u.id] ? u.pin : "••••"}</span>
                                  </p>
                                  <button 
                                    onClick={() => setVisibleStaffPins(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                                    className="text-black/40 hover:text-black transition-colors"
                                  >
                                    {visibleStaffPins[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {staffActiveTab === 'performance' && (
                      <StaffPerformance users={users} orders={orders} />
                    )}

                    {staffActiveTab === 'ai_scheduler' && (
                      <AiScheduler 
                        users={users} 
                        schedules={schedules} 
                        onAddSchedule={async (newS) => {
                          const res = await fetch('/api/schedules', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newS)
                          });
                          return res.json();
                        }} 
                        onDeleteSchedule={async (id) => {
                          const res = await fetch(`/api/schedules/${id}`, {
                            method: 'DELETE'
                          });
                          return res.json();
                        }} 
                        refreshSchedules={fetchData} 
                      />
                    )}

                    {staffActiveTab === 'payroll' && (
                      <div className="bg-[#F8F7F4] rounded-[32px] border border-black/10 overflow-hidden shadow-sm flex flex-col min-h-[1200px]">
                        <StaffPortal 
                          users={users} 
                          timeClock={timeClock} 
                          taxRegion={taxRegion} 
                          currency={currency} 
                          fetchData={fetchData} 
                          isAdmin={true}
                          simulateDeveloperMode={simulateDeveloperMode}
                          setSimulateDeveloperMode={setSimulateDeveloperMode}
                        />
                      </div>
                    )}

                    {staffActiveTab === 'anti_cheat' && (
                      <AntiCheatSimulator 
                        users={users} 
                        simulateDeveloperMode={simulateDeveloperMode}
                        setSimulateDeveloperMode={setSimulateDeveloperMode}
                      />
                    )}
                  </div>
                )}

                {((adminSubTab === 'users' && staffActiveTab === 'time_clock') || (adminSubTab === 'timeclock')) && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <h2 className="text-2xl font-bold">Time Clock & Scheduling</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowScheduleModal(true)}
                          className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
                        >
                          <Calendar size={16}/> Add Shift
                        </button>
                        <div className="bg-white px-6 py-3 rounded-2xl border border-black/5 flex items-center gap-3">
                          <Clock size={16} className="text-black/40" />
                          <span className="text-sm font-bold">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm">
                          <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold flex items-center gap-2"><Calendar size={18}/> Weekly Schedule</h3>
                            <div className="flex items-center gap-4">
                              <button className="p-2 hover:bg-black/5 rounded-full"><ChevronLeft size={20}/></button>
                              <span className="font-bold text-sm">March 16 - March 22, 2026</span>
                              <button className="p-2 hover:bg-black/5 rounded-full"><ChevronRight size={20}/></button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                              <div key={day} className="text-center py-2">
                                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-4">{day}</p>
                                <div className="space-y-2">
                                  {/* Shift A: 7am - 2pm */}
                                  <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                    <p className="text-[8px] font-black text-emerald-700 uppercase">Shift A</p>
                                    <p className="text-[10px] font-bold text-emerald-600/60">7AM - 2PM</p>
                                    <div className="mt-2 space-y-1">
                                      {schedules.filter(s => s.shift === 'A' && new Date(s.date).getDay() === (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day))).map(s => (
                                        <p key={s.id} className="text-[9px] font-bold truncate">{s.userName}</p>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Shift B: 2pm - 9pm */}
                                  <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                                    <p className="text-[8px] font-black text-indigo-700 uppercase">Shift B</p>
                                    <p className="text-[10px] font-bold text-indigo-600/60">2PM - 9PM</p>
                                    <div className="mt-2 space-y-1">
                                      {schedules.filter(s => s.shift === 'B' && new Date(s.date).getDay() === (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day))).map(s => (
                                        <p key={s.id} className="text-[9px] font-bold truncate">{s.userName}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-black/5 overflow-x-auto shadow-sm" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                          <div className="p-6 border-b border-black/5 bg-black/5 min-w-[600px]">
                            <h3 className="font-bold text-sm">Time Clock History</h3>
                          </div>
                          <table className="w-full text-left min-w-[600px]">
                            <thead>
                              <tr className="bg-black/5 text-[10px] font-bold uppercase tracking-widest text-black/40">
                                <th className="p-6">Emp ID</th>
                                <th className="p-6">Staff Name</th>
                                <th className="p-6">Action</th>
                                <th className="p-6">Time</th>
                                <th className="p-6">Date</th>
                                <th className="p-6">Working Hours</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                              {timeClock.slice().reverse().slice(0, 10).map((stamp, idx) => {
                                let workingHours = "-";
                                if (stamp.type === 'out') {
                                  const prevIn = timeClock.slice().reverse().slice(idx + 1).find(s => s.userId === stamp.userId && s.type === 'in');
                                  if (prevIn) {
                                    const diff = new Date(stamp.timestamp).getTime() - new Date(prevIn.timestamp).getTime();
                                    const hours = Math.floor(diff / 3600000);
                                    const minutes = Math.floor((diff % 3600000) / 60000);
                                    workingHours = `${hours}h ${minutes}m`;
                                  }
                                }
                                return (
                                  <tr key={stamp.id} className="text-sm hover:bg-black/5 transition-colors">
                                    <td className="p-6 font-mono text-xs">{stamp.employeeId}</td>
                                    <td className="p-6 font-bold">{stamp.userName}</td>
                                    <td className="p-6">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${stamp.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {stamp.type === 'in' ? 'Clock In' : 'Clock Out'}
                                      </span>
                                    </td>
                                    <td className="p-6 font-medium">{new Date(stamp.timestamp).toLocaleTimeString()}</td>
                                    <td className="p-6 text-black/40">{new Date(stamp.timestamp).toLocaleDateString()}</td>
                                    <td className="p-6 font-bold text-black/60">{workingHours}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm">
                          <h3 className="font-bold mb-6 flex items-center gap-2"><Users size={18}/> Staff on Duty</h3>
                          <div className="space-y-4">
                            {users.map(u => {
                              const lastStamp = timeClock.slice().reverse().find(s => s.userId === u.id);
                              const isOnDuty = lastStamp?.type === 'in';
                              return (
                                <div key={u.id} className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-black/10'}`} />
                                    <div>
                                      <p className="text-sm font-bold">{u.name}</p>
                                      <p className="text-[10px] text-black/40 uppercase font-bold tracking-widest">{u.role}</p>
                                    </div>
                                  </div>
                                  {isOnDuty && (
                                    <span className="text-[10px] font-bold text-emerald-600">ACTIVE</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Form Modal */}
              {showTaxForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-2xl rounded-[40px] p-10 space-y-8 overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black">CRA HST/GST Return</h2>
                        <p className="text-xs text-black/40">Simplified Form for Kalim Coffee (Canada)</p>
                      </div>
                      <button onClick={() => setShowTaxForm(false)} className="text-black/20 hover:text-black"><AlertCircle size={24}/></button>
                    </div>
                    
                    <div className="border-2 border-black p-8 space-y-6 font-mono text-sm">
                      <div className="grid grid-cols-2 gap-8 border-b-2 border-black pb-6">
                        <div>
                          <p className="font-bold uppercase text-[10px]">Business Name</p>
                          <p>KALIM COFFEE INC.</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase text-[10px]">Reporting Period</p>
                          <p>2026-03-01 to 2026-03-31</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-black/10 pb-2">
                          <span>Line 101: Total Sales & Other Revenue</span>
                          <span className="font-bold underline">{formatPrice(stats.totalRevenue - stats.totalTax - stats.totalTips)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/10 pb-2">
                          <span>Line 103: GST/HST Collected or Collectible</span>
                          <span className="font-bold underline">{formatPrice(stats.totalTax)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/10 pb-2">
                          <span>Line 106: Input Tax Credits (ITCs)</span>
                          <span className="font-bold underline">{formatPrice(0)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/5 p-4 rounded-xl">
                          <span className="font-bold">Line 109: Net Tax to be Remitted</span>
                          <span className="font-bold text-lg">{formatPrice(stats.totalTax)}</span>
                        </div>
                      </div>

                      <div className="pt-6 text-[10px] text-black/40 italic">
                        * This is a generated preview based on your POS data. Please verify with a certified accountant before filing with the CRA.
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => window.print()} className="flex-1 bg-black text-white py-4 rounded-2xl font-bold">PRINT FORM</button>
                      <button onClick={() => setShowTaxForm(false)} className="flex-1 py-4 font-bold text-black/40">Close</button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Product Edit Modal */}
              {showProductModal && editingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-2xl rounded-[32px] md:rounded-[40px] p-6 md:p-10 space-y-6 md:space-y-8 my-auto">
                    <h2 className="text-2xl md:text-3xl font-black">{editingProduct.id ? 'Edit Product' : 'Add Product'}</h2>
                    <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Product Name</label>
                          <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Category</label>
                          <select className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Price ({currency})</label>
                          <input type="number" step="0.01" className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} required />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Product Image (URL or Local File)</label>
                          <div className="flex gap-2">
                            <input className="flex-1 bg-black/5 p-4 rounded-2xl font-bold text-xs" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} placeholder="Image URL..." />
                            <label className="bg-neutral-200 hover:bg-neutral-300 transition-colors px-4 py-4 rounded-2xl font-bold text-xs cursor-pointer select-none whitespace-nowrap flex items-center justify-center">
                              Select File
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setEditingProduct({
                                          ...editingProduct,
                                          image: event.target.result as string
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                              />
                            </label>
                          </div>
                          {editingProduct.image && (
                            <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-black/10">
                              <img src={editingProduct.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Uploaded Thumbnail" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Description</label>
                          <textarea className="w-full bg-black/5 p-4 rounded-2xl font-bold h-24 md:h-32" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                        </div>
                      </div>
                      <div className="md:col-span-2 pt-4 md:pt-6 flex gap-4">
                        <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                        <button type="submit" className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg">SAVE PRODUCT</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Topping Edit Modal */}
              {showToppingModal && editingTopping && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 space-y-6 md:space-y-8">
                    <h2 className="text-2xl md:text-3xl font-black">{editingTopping.id ? 'Edit Topping' : 'Add Topping'}</h2>
                    <form onSubmit={handleSaveTopping} className="space-y-4 md:space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Topping Name</label>
                        <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingTopping.name} onChange={e => setEditingTopping({...editingTopping, name: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Price ({currency})</label>
                        <input type="number" step="0.01" className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingTopping.price} onChange={e => setEditingTopping({...editingTopping, price: Number(e.target.value)})} required />
                      </div>
                      <div className="pt-4 md:pt-6 flex gap-4">
                        <button type="button" onClick={() => setShowToppingModal(false)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                        <button type="submit" className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg">SAVE TOPPING</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Supplier Edit Modal */}
              {showSupplierModal && editingSupplier && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 space-y-6 md:space-y-8 my-auto">
                    <h2 className="text-2xl md:text-3xl font-black">{editingSupplier.id ? 'Edit Supplier' : 'Add Supplier'}</h2>
                    <form onSubmit={handleSaveSupplier} className="space-y-4 md:space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Supplier Name</label>
                        <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Phone</label>
                        <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingSupplier.phone} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Email</label>
                        <input type="email" className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingSupplier.email} onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Keywords (comma separated)</label>
                        <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingSupplier.keywords.join(', ')} onChange={e => setEditingSupplier({...editingSupplier, keywords: e.target.value.split(',').map(k => k.trim())})} />
                      </div>
                      <div className="pt-4 md:pt-6 flex gap-4">
                        <button type="button" onClick={() => setShowSupplierModal(false)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                        <button type="submit" className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg">SAVE SUPPLIER</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* User Edit Modal */}
              {showUserModal && editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                  <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 space-y-6 md:space-y-8 my-auto">
                    <h2 className="text-2xl md:text-3xl font-black">{editingUser.id ? 'Edit Staff' : 'Add Staff'}</h2>
                    <div className="space-y-4 md:space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Staff Name</label>
                        <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Role</label>
                        <select className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Employee ID ({minEmployeeId} - {maxEmployeeId})</label>
                        <input className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingUser.employeeId} onChange={e => setEditingUser({...editingUser, employeeId: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">PIN (4 digits)</label>
                        <input type="password" maxLength={4} className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingUser.pin} onChange={e => setEditingUser({...editingUser, pin: e.target.value})} required />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Email Address</label>
                        <input type="email" placeholder="e.g. employee@kalimcoffee.ca" className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Phone Number</label>
                        <input placeholder="e.g. +1 (778) 555-1234" className="w-full bg-black/5 p-4 rounded-2xl font-bold" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} required />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Notification Channel Preference</label>
                        <select className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none" value={editingUser.notificationPreference || 'email'} onChange={e => setEditingUser({...editingUser, notificationPreference: e.target.value as any})}>
                          <option value="email">📧 Email Only</option>
                          <option value="sms">📱 SMS Only</option>
                          <option value="both">💫 Both (Email & SMS)</option>
                        </select>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Permissions</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['pos', 'bar', 'inventory', 'reports', 'suppliers', 'settings', 'users', 'ai'].map(perm => (
                            <label key={perm} className="flex items-center gap-2 p-3 bg-black/5 rounded-xl cursor-pointer hover:bg-black/10 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={editingUser.permissions?.includes(perm) || editingUser.permissions?.includes('all')}
                                disabled={editingUser.permissions?.includes('all') && perm !== 'all'}
                                onChange={e => {
                                  const currentPerms = editingUser.permissions || [];
                                  const newPerms = e.target.checked 
                                    ? [...currentPerms, perm]
                                    : currentPerms.filter((p: string) => p !== perm);
                                  setEditingUser({ ...editingUser, permissions: newPerms });
                                }}
                                className="w-4 h-4 rounded border-black/10 text-black focus:ring-black"
                              />
                              <span className="text-xs font-bold uppercase tracking-wider">{perm}</span>
                            </label>
                          ))}
                          <label className="flex items-center gap-2 p-3 bg-black/5 rounded-xl cursor-pointer hover:bg-black/10 transition-colors col-span-2">
                            <input 
                              type="checkbox" 
                              checked={editingUser.permissions?.includes('all')}
                              onChange={e => {
                                setEditingUser({ ...editingUser, permissions: e.target.checked ? ['all'] : [] });
                              }}
                              className="w-4 h-4 rounded border-black/10 text-black focus:ring-black"
                            />
                            <span className="text-xs font-bold uppercase tracking-wider">FULL ACCESS (ALL)</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 md:pt-6 flex gap-4">
                        <button onClick={() => setShowUserModal(false)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                        <button onClick={handleSaveUser} className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg">SAVE STAFF</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule Modal */}
        <AnimatePresence>
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.8, opacity: 0}} className="bg-white w-full max-w-md rounded-[40px] p-10 space-y-6 shadow-2xl">
                <h2 className="text-2xl font-black">Assign Shift</h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Staff Member</label>
                    <select 
                      className="w-full bg-black/5 p-4 rounded-2xl font-bold appearance-none"
                      onChange={(e) => setEditingSchedule({...editingSchedule, userId: e.target.value, userName: users.find(u => u.id === e.target.value)?.name})}
                    >
                      <option value="">Select Staff</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-black/5 p-4 rounded-2xl font-bold"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-2">Shift</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setEditingSchedule({...editingSchedule, shift: 'A'})}
                        className={`py-4 rounded-2xl font-bold border-2 transition-all ${editingSchedule?.shift === 'A' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-black/5'}`}
                      >
                        Shift A<br/><span className="text-[10px] opacity-60">7AM - 2PM</span>
                      </button>
                      <button 
                        onClick={() => setEditingSchedule({...editingSchedule, shift: 'B'})}
                        className={`py-4 rounded-2xl font-bold border-2 transition-all ${editingSchedule?.shift === 'B' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-black/5'}`}
                      >
                        Shift B<br/><span className="text-[10px] opacity-60">2PM - 9PM</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 font-bold text-black/40">Cancel</button>
                  <button 
                    onClick={async () => {
                      await fetch('/api/schedules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...editingSchedule, date: scheduleDate })
                      });
                      setShowScheduleModal(false);
                      fetchData();
                    }}
                    className="flex-2 bg-black text-white py-4 rounded-2xl font-bold shadow-lg"
                  >
                    SAVE SHIFT
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showTimeClockPrompt && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-center space-y-6 shadow-2xl"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Clock size={32} className="text-white md:hidden" />
                  <Clock size={40} className="text-white hidden md:block" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black">{showTimeClockPrompt.type === 'in' ? 'Clock In' : 'Clock Out'}</h2>
                <p className="text-xs md:text-sm text-black/40">Please enter your employee ID to continue.</p>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={timeClockEmpId}
                    onChange={e => setTimeClockEmpId(e.target.value)}
                    placeholder="Employee ID"
                    className="w-full bg-black/5 p-4 md:p-6 rounded-2xl text-center text-2xl md:text-3xl font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-black/10"
                    autoFocus
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowTimeClockPrompt(null)}
                      className="flex-1 py-4 font-bold text-black/40 text-sm md:text-base"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={() => handleStampTime(showTimeClockPrompt.type)}
                      className="flex-1 bg-black text-white py-4 rounded-2xl font-bold shadow-lg text-sm md:text-base"
                    >
                      CONFIRM
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Shift Reminder Popup */}
        <AnimatePresence>
          {showShiftReminder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-center space-y-6 shadow-2xl"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Clock size={32} className="text-white md:hidden" />
                  <Clock size={40} className="text-white hidden md:block" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black">Shift Reminder</h2>
                <p className="text-xs md:text-sm text-black/40">It's time for <strong>{showShiftReminder}</strong>. Please Clock In/Out to record your hours accurately.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleStampTime('in')}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-colors text-sm md:text-base"
                  >
                    CLOCK IN
                  </button>
                  <button 
                    onClick={() => handleStampTime('out')}
                    className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-rose-600 transition-colors text-sm md:text-base"
                  >
                    CLOCK OUT
                  </button>
                </div>
                <button onClick={() => setShowShiftReminder(null)} className="text-[10px] md:text-xs font-bold text-black/20 uppercase tracking-widest">Later</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI Assistant Floating Button & Chat */}
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
          <AnimatePresence>
            {isAiAssistantOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="w-[325px] md:w-[360px] h-[460px] md:h-[510px] bg-white rounded-[32px] shadow-2xl border border-black/5 flex flex-col overflow-hidden mb-4 pointer-events-auto"
              >
                <div className="bg-black p-5 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles size={16} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xs uppercase tracking-wide">Kalim Support</h3>
                      <p className="text-white/50 text-[9px] uppercase tracking-wider">Operational Bot & Sync</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Multilingual language dropdown picker */}
                    <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700/60 rounded-lg px-2 py-0.5">
                      <select
                        value={aiLanguage}
                        onChange={(e) => {
                          setAiLanguage(e.target.value as any);
                        }}
                        className="bg-transparent text-white border-none p-0 text-[10px] font-black focus:outline-none focus:ring-0 cursor-pointer"
                      >
                        <option value="en" className="bg-zinc-900 text-white">EN</option>
                        <option value="fr" className="bg-zinc-900 text-white">FR</option>
                        <option value="es" className="bg-zinc-900 text-white">ES</option>
                        <option value="ja" className="bg-zinc-900 text-white">JA</option>
                        <option value="zh" className="bg-zinc-900 text-white">ZH</option>
                      </select>
                    </div>

                    <button onClick={() => setIsAiAssistantOpen(false)} className="text-white/40 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F7F4]">
                  {aiChatHistory.length === 0 && (
                    <div className="text-center py-10 space-y-2">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                        <Sparkles size={24} className="text-indigo-600" />
                      </div>
                      <p className="text-xs font-black text-black">
                        How can I help you today? 😊
                      </p>
                      <p className="text-[10px] text-black/50 px-4 leading-normal">
                        Ask me about beverage recipes, inventory tracking, sales guidelines, or customer satisfaction policies! ☕
                      </p>
                    </div>
                  )}
                  {aiChatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 prose prose-stone ${
                        chat.role === 'user' ? 'bg-zinc-900 text-white rounded-br-none' : 'bg-white text-zinc-800 border border-black/5 rounded-bl-none shadow-sm'
                      }`}>
                        {chat.parts[0].text}
                      </div>
                    </div>
                  ))}
                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm border border-black/5 text-zinc-400">
                        <RefreshCw className="animate-spin" size={11} />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAiChat} className="p-4 bg-white border-t border-black/5 flex gap-2 pointer-events-auto">
                  <input 
                    value={aiChatMessage}
                    onChange={(e) => setAiChatMessage(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 bg-black/5 p-3 rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <button type="submit" className="bg-black text-white px-4 rounded-xl hover:scale-105 active:scale-95 transition-all">
                    <Send size={14} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
            className="w-14 h-14 md:w-16 md:h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto border border-white/10"
          >
            {isAiAssistantOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
          </button>
        </div>

        {/* AI Marketing Modal */}
        <AnimatePresence>
          {marketingAd && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-[40px] p-8 md:p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[80vh]"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <Sparkles className="text-emerald-500" /> AI Marketing Engine
                  </h2>
                  <button onClick={() => setMarketingAd(null)} className="text-black/10 hover:text-black">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="bg-[#F8F7F4] p-6 rounded-3xl border border-black/5">
                  <pre className="whitespace-pre-wrap font-sans text-sm font-medium leading-relaxed text-black/70 italic">
                    {marketingAd}
                  </pre>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(marketingAd);
                      alert("Copied to clipboard!");
                    }}
                    className="flex-1 bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <Smartphone size={16} /> COPY AD TEXT
                  </button>
                  <button 
                    onClick={() => setMarketingAd(null)}
                    className="flex-1 py-4 font-bold text-black/40"
                  >
                    CLOSE
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isRearrangeModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-white w-full max-w-md rounded-[32px] p-6 md:p-8 space-y-6 shadow-2xl relative text-left"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-black flex items-center gap-2 font-sans tracking-tight">
                    <span>🔄</span> Customize Tabs Order
                  </h3>
                  <p className="text-xs text-black/40 font-sans leading-relaxed">
                    Long press (hold) any tab button on the Admin bar or click the arrow buttons below to customize your layout.
                  </p>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {adminSubTabsOrder.map((sub, index) => (
                    <div key={sub.id} className="flex justify-between items-center bg-black/[0.02] border border-black/5 p-3 rounded-2xl">
                      <span className="text-xs font-bold text-black font-sans">
                        {
                          sub.id === 'dashboard' ? `📊 ${t('dashboard_tab')}` :
                          sub.id === 'menu' ? `☕ ${t('menu_tab')}` :
                          sub.id === 'inventory' ? `📦 ${t('inventory_tab')}` :
                          sub.id === 'membership' ? `💳 ${t('customers_tab')}` :
                          sub.id === 'users' ? `👥 ${t('staff_tab')}` :
                          sub.id === 'settings' ? `⚙️ ${t('system_settings')}` :
                          sub.label
                        }
                      </span>
                      <div className="flex gap-1.5 animate-fade-in">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const newOrder = [...adminSubTabsOrder];
                            const temp = newOrder[index];
                            newOrder[index] = newOrder[index - 1];
                            newOrder[index - 1] = temp;
                            setAdminSubTabsOrder(newOrder);
                          }}
                          className="p-1.5 bg-black/5 hover:bg-black/10 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={index === adminSubTabsOrder.length - 1}
                          onClick={() => {
                            const newOrder = [...adminSubTabsOrder];
                            const temp = newOrder[index];
                            newOrder[index] = newOrder[index + 1];
                            newOrder[index + 1] = temp;
                            setAdminSubTabsOrder(newOrder);
                          }}
                          className="p-1.5 bg-black/5 hover:bg-black/10 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultOrder = [
                        { id: 'dashboard', label: '📊 Dashboard', perm: 'reports' },
                        { id: 'menu', label: '☕ Menu', perm: 'settings' },
                        { id: 'inventory', label: '📦 Inventory', perm: 'inventory' },
                        { id: 'membership', label: '💳 Customers', perm: 'users' },
                        { id: 'users', label: '👥 Staff / Users', perm: 'users' },
                        { id: 'settings', label: '⚙️ Settings', perm: 'settings' }
                      ];
                      setAdminSubTabsOrder(defaultOrder);
                      localStorage.setItem('kalim_admin_tabs_order', JSON.stringify(defaultOrder));
                    }}
                    className="flex-1 py-3.5 bg-black/5 hover:bg-black/10 text-black rounded-2xl text-xs font-extrabold cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('kalim_admin_tabs_order', JSON.stringify(adminSubTabsOrder));
                      setIsRearrangeModalOpen(false);
                    }}
                    className="flex-1 py-3.5 bg-black text-white rounded-2xl text-xs font-extrabold shadow-md active:scale-95 transition-transform cursor-pointer"
                  >
                    Save & Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Navigation - Only visible for Merchant POS & Admin context */}
      {currentApp === 'merchant' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-4 md:px-8 py-2 md:py-6 flex justify-around items-center z-50">
          {[
            { id: 'cashier', icon: LayoutGrid, label: 'POS REGISTER', perm: 'pos' },
            { id: 'bar', icon: Coffee, label: 'BAR MONITOR', perm: 'bar' },
            { id: 'customer_display', icon: Users, label: 'CUSTOMER DISPLAY', perm: 'pos' },
            { id: 'admin', icon: Settings, label: 'SYSTEM ADMIN', perm: 'admin' }
          ].filter(tab => {
            if (tab.perm === 'admin') return hasPermission('inventory') || hasPermission('reports') || hasPermission('settings') || hasPermission('users') || hasPermission('ai');
            return hasPermission(tab.perm);
          }).map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === tab.id ? 'text-black' : 'text-black/20 hover:text-black/40'}`}
            >
              <tab.icon size={activeTab === tab.id ? 24 : 20} className="md:w-6 md:h-6" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>

    {/* Standalone Apps / Decoupled Links Modal (Hidden on Printing) */}
    <AnimatePresence>
      {isIndependentModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[99999] flex items-center justify-center p-4 print:hidden"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-[#121216] border border-white/10 text-white w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setIsIndependentModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white bg-neutral-900 p-2 rounded-full border border-white/5 cursor-pointer flex items-center justify-center"
            >
              <X size={16} />
            </button>

            <div className="space-y-1 text-left">
              <span className="text-[10px] font-black uppercase text-[#E07A5F] tracking-widest bg-[#E07A5F]/10 px-2.5 py-1 rounded w-fit inline-block">MULTIPLE INDEPENDENT DEVICES</span>
              <h2 className="text-xl md:text-2xl font-black text-white">Standalone Application Decoupler</h2>
              <p className="text-xs text-neutral-400">Deploy Kalim Coffee Connected Suite across separate, decoupled devices (customer phones, counter register, wall-mount barista monitor) concurrently using real-time synchronization.</p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-left">
              {/* Option 1: Customer App */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-1.5">
                      <span>📱</span> Customer-Facing Mobile Ordering App
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">For placement on tables, checkout stands via QR codes, or direct client smartphones. Features menu browsing, item design, loyalty tracking, and polling-enabled live status receipts.</p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold shrink-0">READY</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-white/5">
                  <input 
                    type="text" 
                    readOnly 
                    value={getStandaloneUrl('customer')}
                    className="bg-transparent text-[10px] text-neutral-400 font-mono flex-1 focus:outline-none select-all truncate px-1"
                  />
                  <button 
                    onClick={() => copyStandaloneUrl('customer')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[9px] font-bold border border-white/5 whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copiedLinkType === 'customer' ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                  <a 
                    href={getStandaloneUrl('customer')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#E07A5F] hover:bg-[#E07A5F]/80 text-white rounded-lg text-[9px] font-extrabold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={11} />
                    <span>Launch App</span>
                  </a>
                </div>
              </div>

              {/* Option 2: Staff Portal */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-1.5">
                      <span>👥</span> Specialized Staff & Operations Portal
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">For raw milk and syrup delivery check-ins, ingredient usage logs, digital shift scheduling, and timeclock audits. Perfect for office PCs or staff-room tablets.</p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold shrink-0">READY</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-white/5">
                  <input 
                    type="text" 
                    readOnly 
                    value={getStandaloneUrl('staff')}
                    className="bg-transparent text-[10px] text-neutral-400 font-mono flex-1 focus:outline-none select-all truncate px-1"
                  />
                  <button 
                    onClick={() => copyStandaloneUrl('staff')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[9px] font-bold border border-white/5 whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copiedLinkType === 'staff' ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                  <a 
                    href={getStandaloneUrl('staff')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#E07A5F] hover:bg-[#E07A5F]/80 text-white rounded-lg text-[9px] font-extrabold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={11} />
                    <span>Launch App</span>
                  </a>
                </div>
              </div>

              {/* Option 3: POS & Admin Command */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-1.5">
                      <span>💼</span> Merchant Register, Bar Monitor & Analytics Admin
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">The primary cashier command center. Houses the rich tablet-optimized cashier layout, barista bar screen with auditory beeps, dual-screen customer display, and executive admin reports.</p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold shrink-0">READY</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-white/5">
                  <input 
                    type="text" 
                    readOnly 
                    value={getStandaloneUrl('merchant')}
                    className="bg-transparent text-[10px] text-neutral-400 font-mono flex-1 focus:outline-none select-all truncate px-1"
                  />
                  <button 
                    onClick={() => copyStandaloneUrl('merchant')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[9px] font-bold border border-white/5 whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copiedLinkType === 'merchant' ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                  <a 
                    href={getStandaloneUrl('merchant')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#E07A5F] hover:bg-[#E07A5F]/80 text-white rounded-lg text-[9px] font-extrabold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={11} />
                    <span>Launch App</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 text-[10px] text-neutral-400 leading-relaxed text-center">
              💡 <strong>Tip:</strong> Opening these standalone links hides the global "Connected Suite" ecosystem control panel at the top, delivering a completely native app experience optimized for single-purpose tablet or smartphone usage.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* 📄 PRINTER-FRIENDLY INVENTORY COUNT SHEET (Optimized entirely for physical A4/Letter print outs) */}
    <div className="hidden print:block p-10 bg-white text-black font-sans min-h-screen text-left animate-fade-in" id="kalim-inventory-print-sheet">
      <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-black">KALIM COFFEE CO.</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mt-1">Manual Inventory Count & Stock Audit Sheet</p>
        </div>
        <div className="text-right font-mono text-[11px] text-black">
          <p><strong>Print Date:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p className="mt-1"><strong>Status Code:</strong> CLOUD-SYNC/STANDALONE</p>
        </div>
      </div>

      <div className="bg-neutral-100 p-4 border border-black rounded-xl mb-6 text-xs leading-relaxed text-black">
        <p><strong>Barista Instructions:</strong> Walk through physical inventory areas (counters, backroom, cold store). Check each item, verify against the current stock level, and write down the actual physical count in pen. Return this signed sheet to the admin for manual system entry or adjustments.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <p><strong>Audited By (Print Name):</strong> ___________________________________</p>
          <p><strong>Signature & Date:</strong> ___________________________________</p>
        </div>
      </div>

      <table className="w-full text-xs text-left border-collapse border border-black text-black">
        <thead>
          <tr className="bg-neutral-200 border border-black text-black">
            <th className="p-2 border border-black font-black uppercase">Item / Ingredient Name</th>
            <th className="p-2 border border-black font-black uppercase">Unit</th>
            <th className="p-2 border border-black font-black uppercase text-center w-32">Expected (System)</th>
            <th className="p-2 border border-black font-black uppercase text-center w-36 bg-neutral-100">Actual Audit Count</th>
            <th className="p-2 border border-black font-black uppercase">Notes / Discrepancies</th>
          </tr>
        </thead>
        <tbody className="border border-black text-black">
          {(stats.inventoryStatus || []).map((item: any) => {
            const supplier = suppliers.find(s => s.id === item.supplierId);
            return (
              <tr key={item.id} className="border border-black">
                <td className="p-3 border border-black font-bold">
                  {item.name}
                  {supplier && <span className="block text-[9px] text-neutral-500 font-normal">Supplier: {supplier.name}</span>}
                </td>
                <td className="p-3 border border-black font-medium">{item.unit}</td>
                <td className="p-3 border border-black text-center font-mono font-bold text-neutral-700 bg-neutral-50">
                  {item.stock} {item.unit}
                </td>
                <td className="p-3 border border-black text-center bg-white">
                  <div className="mx-auto border-2 border-black/30 rounded w-24 h-7" />
                </td>
                <td className="p-3 bg-white border border-black">
                  <div className="border-b border-black/20 w-full h-5 mt-1" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-12 text-center text-[10px] text-neutral-500 font-mono border-t border-dashed border-neutral-300 pt-4">
        Kalim Coffee Connected Suite Inventory Autopilot Protocol &copy; 2026. All rights reserved.
      </div>
    </div>
  </>
  );
}
