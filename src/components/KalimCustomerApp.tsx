import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  CreditCard,
  Plus, 
  Minus, 
  Trash2, 
  Sparkles, 
  Smartphone, 
  Clock, 
  User, 
  Phone,
  Gift,
  Heart,
  ChevronLeft,
  Search,
  Check,
  TrendingUp,
  Tag,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { translations } from '../utils/translations';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface Topping {
  id: string;
  name: string;
  price: number;
  category?: 'milk' | 'syrup' | 'extra' | 'size';
}

interface KalimCustomerAppProps {
  products: Product[];
  toppings: Topping[];
  currency: string;
  taxRegion: string;
  fetchData: () => Promise<void>;
  onOrderSuccess?: (payload: any) => void;
  webAppMode?: boolean;
  language?: string;
}

export default function KalimCustomerApp({
  products: rawProducts,
  toppings: rawToppings,
  currency,
  taxRegion,
  fetchData,
  onOrderSuccess,
  webAppMode = false,
  language = 'en'
}: KalimCustomerAppProps) {
  // Defensive fallback sanitization for robust rendering
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const toppings = Array.isArray(rawToppings) ? rawToppings : [];
  const lang = (language && language in translations) ? language : 'en';
  const t = (key: keyof typeof translations.en) => {
    return translations[lang as keyof typeof translations]?.[key] || translations.en[key] || key;
  };

  // Navigation states within the customer app
  const [customerScreen, setCustomerScreen] = useState<'auth' | 'home' | 'menu' | 'cart' | 'receipt'>('auth');
  const [loggedInCustomer, setLoggedInCustomer] = useState<any | null>(null);
  const [authPhoneInput, setAuthPhoneInput] = useState<string>('');
  const [authPasswordInput, setAuthPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authNameInput, setAuthNameInput] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Customization modal states
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<'Regular' | 'Large'>('Regular');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState<string>('');
  
  // Cart state
  const [custCart, setCustCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('Card');
  const [tipRate, setTipRate] = useState<number>(0.15); // Default 15%
  const [giftCardCode, setGiftCardCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Real-time order status polling from 'Wait' to 'Preparing' to 'Ready'
  useEffect(() => {
    if (customerScreen !== 'receipt' || !placedOrder?.id) return;

    let isMounted = true;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${placedOrder.id}`);
        if (res.ok) {
          const updatedOrder = await res.json();
          if (isMounted) {
            setPlacedOrder(prev => {
              if (!prev) return updatedOrder;
              if (prev.status !== updatedOrder.status) {
                // Play notification sound on status change
                try {
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  const gain = audioCtx.createGain();
                  
                  if (updatedOrder.status === 'Ready') {
                    // High pitch joyful double bell for "Ready"
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                    osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.15); // E6
                    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    setTimeout(() => osc.stop(), 400);
                  } else {
                    // Mellow notification beep for general transitions
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    setTimeout(() => osc.stop(), 200);
                  }
                  
                  osc.connect(gain);
                  gain.connect(audioCtx.destination);
                  osc.start();
                } catch (_) {}
              }
              return updatedOrder;
            });
          }
        }
      } catch (err) {
        console.error("Polling error for order status:", err);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [customerScreen, placedOrder?.id]);

  const getStatusIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'wait' || s === 'pending') return 1;
    if (s === 'preparing') return 2;
    if (s === 'ready' || s === 'completed' || s === 'done') return 3;
    return 1;
  };

  const currentStepNum = placedOrder ? getStatusIndex(placedOrder.status) : 1;

  // App notification banner
  const [appAlert, setAppAlert] = useState<string | null>(null);

  // Filter products
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCustomerLogin = async () => {
    if (!authPhoneInput) return triggerAppAlert("Enter mobile to continue.");
    if (!authPasswordInput) return triggerAppAlert("Enter password to continue.");
    
    try {
      if (isRegistering) {
        if (!authNameInput) return triggerAppAlert("Please enter your name");
        const res = await fetch("/api/loyalty-customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: authNameInput,
            phone: authPhoneInput,
            password: authPasswordInput,
            dob: "2000-01-01",
            points: 50, // bonus joining points
            favoriteDrink: "",
            tier: "New Member"
          })
        });
        const newCust = await res.json();
        setLoggedInCustomer(newCust);
        setCustomerScreen('home');
      } else {
        const res = await fetch("/api/loyalty-customers");
        const customers = await res.json();
        const found = customers.find((c: any) => c.phone === authPhoneInput);
        if (found) {
          if (found.password === authPasswordInput) {
            setLoggedInCustomer(found);
            setCustomerScreen('home');
          } else {
            triggerAppAlert("Incorrect password.");
          }
        } else {
          setIsRegistering(true);
          triggerAppAlert("New device - please enroll.");
        }
      }
    } catch (e) {
      console.warn(e);
      triggerAppAlert("Connection error.");
    }
  };

  const triggerAppAlert = (msg: string) => {
    setAppAlert(msg);
    setTimeout(() => setAppAlert(null), 4000);
  };

  const handleOpenCustomize = (product: Product) => {
    setCustomizingProduct(product);
    setSelectedSize('Regular');
    setSelectedToppings([]);
    setItemNote('');
  };

  const handleToggleTopping = (id: string) => {
    if (selectedToppings.includes(id)) {
      setSelectedToppings(selectedToppings.filter(t => t !== id));
    } else {
      setSelectedToppings([...selectedToppings, id]);
    }
  };

  const handleAddToCart = () => {
    if (!customizingProduct) return;

    const extraSizeCost = selectedSize === 'Large' ? (currency === 'VND' ? 15000 : 1.00) : 0;
    const toppingsCost = selectedToppings.reduce((sum, tid) => {
      const t = toppings.find(top => top.id === tid);
      return sum + (t ? t.price : 0);
    }, 0);

    const unitPrice = customizingProduct.price + extraSizeCost + toppingsCost;

    const cartItem = {
      id: "cust-" + Date.now() + Math.random().toString(36).substr(2, 4),
      productId: customizingProduct.id,
      name: customizingProduct.name,
      image: customizingProduct.image,
      size: selectedSize,
      toppings: selectedToppings,
      notes: itemNote,
      quantity: 1,
      unitPrice: unitPrice,
      basePrice: customizingProduct.price
    };

    setCustCart([...custCart, cartItem]);
    setCustomizingProduct(null);
    triggerAppAlert(`Added 1x ${cartItem.name} to mobile basket!`);
  };

  const handleUpdateQty = (itemId: string, increment: boolean) => {
    setCustCart(custCart.map(item => {
      if (item.id === itemId) {
        const newQty = increment ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setCustCart(custCart.filter(item => item.id !== itemId));
    triggerAppAlert("Beverage removed from basket.");
  };

  // Pricing math
  const subtotal = custCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  
  // Tax determination (Support ON, AB, etc.)
  const taxRate = taxRegion === 'ON' ? 0.13 : taxRegion === 'QC' ? 0.14975 : taxRegion === 'US-CA' ? 0.0825 : 0.05;
  const taxAmount = subtotal * taxRate;
  const tipAmount = subtotal * tipRate;
  const finalDiscount = Math.min(appliedDiscount, subtotal);
  const total = subtotal + taxAmount + tipAmount - finalDiscount;

  const handleApplyGiftCard = () => {
    if (giftCardCode.trim().toUpperCase() === 'WELCOME') {
      const disc = currency === 'VND' ? 50000 : 5.00;
      setAppliedDiscount(disc);
      triggerAppAlert("Gift Card applied! Saved " + disc.toLocaleString() + " " + currency);
    } else if (giftCardCode.trim().toUpperCase() === 'BARISTA') {
      const disc = currency === 'VND' ? 25000 : 2.50;
      setAppliedDiscount(disc);
      triggerAppAlert("Staff Promo code active!");
    } else {
      triggerAppAlert("Invalid gift card or voucher code.");
    }
  };

  const handlePlaceOrder = async () => {
    if (custCart.length === 0) return;
    
    const cName = loggedInCustomer?.name || customerName;
    const cPhone = loggedInCustomer?.phone || customerPhone;

    if (!cName.trim() || !cPhone.trim()) {
      triggerAppAlert("Please fill in your name and phone number for pickup alerts.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const bCartTotal = custCart.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity), 0);

      const orderPayload = {
        customerInfo: {
          name: cName,
          phone: cPhone
        },
        items: custCart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          toppings: item.toppings,
          notes: item.notes
        })),
        tipAmount: tipAmount,
        giftCardCode: giftCardCode || undefined,
        notes: "Mobile App Order: " + (selectedPayment === 'Card' ? "PAID via Mobile Client" : "Pay at counter"),
        paymentMethod: selectedPayment
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const resData = await response.json();
        
        // Add Loyalty Points
        if (loggedInCustomer && loggedInCustomer.id !== 'guest') {
          const earnedPoints = Math.floor(bCartTotal + tipAmount);
          const newPoints = (loggedInCustomer.points || 0) + earnedPoints;
          const ptsResponse = await fetch("/api/loyalty-customers/" + loggedInCustomer.id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ points: newPoints })
          });
          const updatedCust = await ptsResponse.json();
          setLoggedInCustomer(updatedCust);
        }

        setPlacedOrder(resData.order);
        setCustCart([]);
        setAppliedDiscount(0);
        setGiftCardCode('');
        setCustomerScreen('receipt');
        if (onOrderSuccess) onOrderSuccess(resData.order);
        
        try {
          // Play native iOS chime
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
          osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.2); // D6
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          setTimeout(() => osc.stop(), 500);
        } catch (_) {}
      } else {
        triggerAppAlert("Failed to submit order. Please retry.");
      }
    } catch (err) {
      console.error(err);
      triggerAppAlert("Connection network offline.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className={webAppMode ? "flex h-full w-full bg-neutral-900 rounded-[20px] text-white overflow-hidden relative" : "flex flex-col md:flex-row gap-8 items-center justify-center p-4 min-h-[680px] bg-neutral-900 rounded-[40px] text-white"}>
      
      {/* Description / Instruction Block left side */}
      {!webAppMode && (
        <div className="flex-1 max-w-sm space-y-6 p-4">
          <div className="bg-[#E07A5F]/10 border border-[#E07A5F]/20 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-[#E07A5F]">
              <Sparkles size={20} />
              <h3 className="font-extrabold uppercase tracking-wider text-xs">Kalim Ecosystem Integration</h3>
            </div>
            <h2 className="text-xl font-black tracking-tight leading-tight">Kalim Customer App Mobile Client</h2>
            <p className="text-xs text-neutral-300 leading-relaxed">
              This viewport simulates the customer's iOS beverage ordering app. Browse live categories, configure sweet toppings, select sizes, set barista tips, and submit orders.
            </p>
            <div className="py-2.5 border-t border-white/10 space-y-1.5 text-[11px] text-neutral-400 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sends real request payloads (REST POST)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto updates live inventory levels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Triggers websocket alerts on Cashier POS</span>
              </div>
            </div>
          </div>

          {/* Coupon codes card */}
          <div className="bg-neutral-800/60 border border-white/5 p-5 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Active Workspace Vouchers</h4>
            <div className="flex items-center justify-between gap-2 text-xs bg-black/40 p-2 rounded-xl">
              <span className="font-mono bg-neutral-700 text-yellow-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">WELCOME</span>
              <span className="text-[11px] text-neutral-300 font-bold">-{currency === 'VND' ? '50,000 VND' : '$5.00 Off'}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs bg-black/40 p-2 rounded-xl">
              <span className="font-mono bg-neutral-700 text-yellow-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">BARISTA</span>
              <span className="text-[11px] text-neutral-300 font-bold">-{currency === 'VND' ? '25,000 VND' : '$2.50 Off'}</span>
            </div>
          </div>
        </div>
      )}

      {/* iOS SmartPhone Device Simulator Container block */}
      <div id="ios_customer_app_frame" className={webAppMode ? "w-full max-w-lg mx-auto bg-[#16161a] h-full flex flex-col relative text-neutral-100 shadow-md" : "relative w-[375px] h-[760px] bg-black rounded-[55px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-[#333] shrink-0"}>
        
        {/* Speaker / Camera pill notch */}
        {!webAppMode && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-neutral-800 rounded-full" />
            <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full ml-3 border border-neutral-800" />
          </div>
        )}

        {/* Screen layout */}
        <div className={webAppMode ? "w-full h-full bg-[#16161a] flex flex-col relative text-neutral-100 selection:bg-neutral-700 overflow-hidden" : "w-full h-full bg-[#16161a] rounded-[45px] overflow-hidden flex flex-col relative text-neutral-100 selection:bg-neutral-700"}>
          
          {/* Internal iOS status bar */}
          {!webAppMode && (
            <div className="h-11 pt-1 px-6 flex justify-between items-center text-[11px] font-black tracking-tight select-none">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span>LTE</span>
                <div className="w-4.5 h-2 bg-neutral-200/20 rounded-sm relative p-0.5 flex">
                  <div className="h-full w-4/5 bg-white rounded-2xs" />
                </div>
              </div>
            </div>
          )}

          {/* App header notice element banner */}
          <AnimatePresence>
            {appAlert && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-12 left-4 right-4 z-[60] bg-yellow-400 text-black p-3 rounded-2xl text-[10px] font-black uppercase shadow-lg flex items-center justify-between"
              >
                <span>{appAlert}</span>
                <span className="text-[8px] opacity-50 font-bold">Dismiss</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Views Switcher */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-16">
            
            {/* Screen 0: Auth */}
            {customerScreen === 'auth' && (
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="p-5 flex flex-col justify-center h-full space-y-6 max-w-sm mx-auto my-auto pt-24">
                <div className="text-center space-y-2 mb-6">
                  <div className="mx-auto w-16 h-16 bg-[#E07A5F] rounded-2xl flex items-center justify-center text-white mb-4">
                    <Coffee size={32} />
                  </div>
                  <h1 className="text-2xl font-black">Kalim Rewards</h1>
                  <p className="text-xs text-neutral-400">Log in with your phone to sync orders and points.</p>
                </div>
                
                <div className="space-y-4">
                  {showForgotPassword ? (
                    <div className="space-y-4">
                      <div className="text-center text-xs text-neutral-400 mb-4">
                        Please talk to the cashier at the POS terminal. They can securely reset your password from the Admin panel.
                      </div>
                      <button 
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full bg-[#E07A5F] text-white py-3 rounded-xl font-black text-xs hover:scale-[1.02] transition-transform"
                      >
                        BACK TO LOGIN
                      </button>
                    </div>
                  ) : (
                    <>
                      {isRegistering && (
                        <input 
                          type="text"
                          placeholder="Your First Name"
                          value={authNameInput}
                          onChange={e => setAuthNameInput(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white font-bold placeholder:text-neutral-600 focus:border-[#E07A5F] focus:outline-none transition-colors"
                        />
                      )}
                      <input 
                        type="tel"
                        placeholder="Mobile Number (e.g. 403-555-0111)"
                        value={authPhoneInput}
                        onChange={e => setAuthPhoneInput(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white font-bold placeholder:text-neutral-600 focus:border-[#E07A5F] focus:outline-none transition-colors"
                      />
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={authPasswordInput}
                          onChange={e => setAuthPasswordInput(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white font-bold placeholder:text-neutral-600 focus:border-[#E07A5F] focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-neutral-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      
                      {!isRegistering && (
                        <button 
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[#E07A5F] text-xs font-bold w-full text-right bg-transparent border-none p-0 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                      
                      <button 
                        onClick={handleCustomerLogin}
                        className="w-full bg-[#E07A5F] text-white py-4 rounded-xl font-black text-sm hover:scale-[1.02] transition-transform"
                      >
                        {isRegistering ? t('register_account').toUpperCase() : t('login_continue').toUpperCase()}
                      </button>

                      <div className="text-[10px] text-neutral-500 text-center flex items-center justify-center gap-1.5 mt-2">
                        <ShieldCheck size={12} className="text-[#E07A5F]" />
                        <span>Protected by Kalim Data Privacy Policies. Full compliance with data protection laws.</span>
                      </div>

                      <button 
                        onClick={() => {
                          setLoggedInCustomer({ name: 'Guest', phone: '000', points: 0, id: 'guest' });
                          setCustomerScreen('home');
                        }}
                        className="w-full bg-transparent border border-neutral-800 text-neutral-400 py-3 rounded-xl font-bold text-xs hover:bg-neutral-900 hover:text-white transition-all"
                      >
                        {lang === 'vi' ? 'TIẾP TỤC VỚI VAI TRÒ KHÁCH' : 'CONTINUE AS GUEST'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Screen 1: Home/Feed Welcome */}
            {customerScreen === 'home' && (
              <div className="p-5 space-y-6">
                <div className="flex justify-between items-center pt-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Kalim Co. Cloud Member</span>
                    <h1 className="text-xl font-black">Hello {loggedInCustomer?.name?.split(' ')[0] || 'Guest'}! ☕</h1>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-full">
                    <Heart size={14} className="text-[#E07A5F] fill-current" />
                    <span className="text-xs font-black text-white">{loggedInCustomer?.points || 0} pts</span>
                  </div>
                </div>

                {/* Promo card */}
                <div className="bg-gradient-to-br from-[#E07A5F] to-[#C95A40] p-5 rounded-3xl space-y-2.5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-15">
                    <Coffee size={140} />
                  </div>
                  <div className="bg-white/10 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full w-max tracking-wider">
                    Exclusive Digital Offer
                  </div>
                  <h3 className="text-base font-black leading-tight">Fast Mobile Pickup & Rewards</h3>
                  <p className="text-[10px] text-white/80 font-medium">Order ahead, skip the POS queue, and collect 1 reward point per {currency} spent.</p>
                  
                  <button 
                    onClick={() => { setCustomerScreen('menu'); }}
                    className="mt-2 bg-white text-neutral-900 text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-neutral-100"
                  >
                    <span>Order Drinks</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* Popular items section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Best Sellers Today</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 4).map(prod => (
                      <div 
                        key={prod.id} 
                        onClick={() => handleOpenCustomize(prod)}
                        className="bg-neutral-900 border border-white/5 p-3 rounded-2xl flex flex-col gap-2 hover:border-white/20 transition-all cursor-pointer"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-black/20 text-neutral-600"><Coffee size={24} /></div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-[11px] font-black truncate">{prod.name}</h5>
                          <p className="text-[9px] text-[#E07A5F] font-bold">{prod.price.toLocaleString()} {currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2: Direct Menu Browser */}
            {customerScreen === 'menu' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCustomerScreen('home')}
                    className="p-1.5 hover:bg-neutral-800 rounded-full"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h1 className="text-base font-black">Kalim Beverage Menu</h1>
                </div>

                {/* Search query field */}
                <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-2 rounded-xl">
                  <Search size={14} className="text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cafe favorites..."
                    className="bg-transparent border-none text-[11px] text-white focus:outline-none flex-1 placeholder-neutral-400"
                  />
                </div>

                {/* Selector pill row */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${selectedCategory === cat ? 'bg-[#E07A5F] text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* List items block */}
                <div className="space-y-2 pt-1">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-neutral-500 font-bold">No drinks matching filters found</p>
                    </div>
                  ) : (
                    filteredProducts.map(prod => (
                      <div 
                        key={prod.id}
                        onClick={() => handleOpenCustomize(prod)}
                        className="bg-neutral-900 border border-white/5 p-3 rounded-2xl flex items-center gap-3 hover:bg-neutral-850 cursor-pointer hover:border-white/10 transition-all"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-black/20"><Coffee size={18} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black truncate">{prod.name}</h4>
                          <p className="text-[10px] text-neutral-400">{prod.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-black text-[#E07A5F]">{prod.price.toLocaleString()} {currency}</span>
                          <div className="w-6 h-6 bg-[#E07A5F]/10 text-[#E07A5F] rounded-full flex items-center justify-center mt-1 ml-auto">
                            <Plus size={12} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Screen 3: Cart Checkout */}
            {customerScreen === 'cart' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCustomerScreen('menu')} className="p-1 hover:bg-neutral-850 rounded-full">
                      <ChevronLeft size={16} />
                    </button>
                    <h1 className="text-base font-black">{t('basket')}</h1>
                  </div>
                  <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                    {custCart.length} {lang === 'vi' ? 'Sản phẩm' : 'Items'}
                  </span>
                </div>

                {custCart.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-full mx-auto flex items-center justify-center">
                      <ShoppingBag size={24} className="text-neutral-500" />
                    </div>
                    <p className="text-xs text-neutral-400 font-bold">{t('empty_basket')}</p>
                    <button 
                      onClick={() => setCustomerScreen('menu')}
                      className="px-4 py-2 bg-[#E07A5F] text-white text-[11px] font-black uppercase rounded-lg"
                    >
                      {t('back_to_menu')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items list */}
                    <div className="space-y-2">
                      {custCart.map(item => (
                        <div key={item.id} className="bg-neutral-900/60 p-3 rounded-2xl border border-white/5 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black/20 text-neutral-500"><Coffee size={14} /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-black truncate">{item.name}</h4>
                              <p className="text-[9px] text-[#E07A5F] font-bold">Size: {item.size}</p>
                              {item.toppings?.length > 0 && (
                                <p className="text-[8px] text-neutral-400 truncate font-semibold">
                                  +Toppings: {item.toppings.map((tid: string) => toppings.find(t => t.id === tid)?.name).join(', ')}
                                </p>
                              )}
                              {item.notes && <p className="text-[8px] text-neutral-400 truncate italic">"{item.notes}"</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-neutral-200">{(item.unitPrice * item.quantity).toLocaleString()} {currency}</span>
                            </div>
                          </div>

                          {/* Qty controls */}
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <button onClick={() => handleRemoveItem(item.id)} className="text-[9px] text-red-400 hover:text-red-300 font-bold flex items-center gap-0.5">
                              <Trash2 size={10} /> Delete
                            </button>
                            <div className="flex items-center gap-2 bg-neutral-950 px-2 py-0.5 rounded-lg border border-white/5">
                              <button onClick={() => handleUpdateQty(item.id, false)} className="p-0.5 text-neutral-400 hover:text-white"><Minus size={10} /></button>
                              <span className="text-[10px] font-black">{item.quantity}</span>
                              <button onClick={() => handleUpdateQty(item.id, true)} className="p-0.5 text-neutral-400 hover:text-white"><Plus size={10} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Voucher promo Box */}
                    <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 space-y-1.5">
                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wide">Ecosystem Promo / Code:</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          placeholder="Try: WELCOME"
                          className="bg-black/50 border border-white/10 px-3 py-1.5 text-[10px] text-white flex-1 rounded-lg outline-none uppercase font-bold"
                        />
                        <button 
                          onClick={handleApplyGiftCard}
                          className="px-3 bg-neutral-800 hover:bg-neutral-700 text-yellow-300 text-[9px] font-black uppercase rounded-lg shrink-0 border border-white/5"
                        >
                          Verify
                        </button>
                      </div>
                    </div>

                    {/* Barista Dynamic Tip Selector */}
                    <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-neutral-300">
                        <span>Baristas Gratitude Slider</span>
                        <span className="text-yellow-400">{(tipRate * 100).toFixed(0)}% Tip</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.0, 0.15, 0.18, 0.20].map(rate => (
                          <button
                            key={rate}
                            onClick={() => setTipRate(rate)}
                            className={`py-1 rounded text-[10px] uppercase font-black tracking-wide ${tipRate === rate ? 'bg-yellow-400 text-black' : 'bg-black/45 hover:bg-black text-neutral-400'}`}
                          >
                            {rate === 0.0 ? 'No Tip' : `${(rate * 100).toFixed(0)}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer contact fields */}
                    <div className="bg-neutral-900 p-3.5 rounded-2xl border border-white/5 space-y-2">
                      <h4 className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Order Placement Details</h4>
                      {loggedInCustomer && loggedInCustomer.id !== 'guest' ? (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 space-y-1">
                          <div className="flex items-center gap-2">
                            <User size={11} className="text-[#E07A5F]" />
                            <span className="text-[11px] font-bold text-white">{loggedInCustomer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={11} className="text-[#E07A5F]" />
                            <span className="text-[10px] text-neutral-400 font-mono">{loggedInCustomer.phone}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-white/5">
                            <User size={11} className="text-neutral-500" />
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Your Name (e.g. Liam)"
                              className="bg-transparent border-none text-[11px] text-white placeholder-neutral-500 outline-none flex-1"
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-white/5">
                            <Phone size={11} className="text-neutral-500" />
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Phone Number"
                              className="bg-transparent border-none text-[11px] text-[#fff] placeholder-neutral-500 outline-none flex-1 font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment methods */}
                    <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 space-y-1.5">
                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wide">Pick Payment Channel</span>
                      <div className="grid grid-cols-2 gap-2">
                        {['Card', 'ApplePay', 'Kakao', 'Cash'].map(method => (
                          <button
                            key={method}
                            onClick={() => setSelectedPayment(method)}
                            className={`p-2 rounded-xl flex items-center gap-1.5 border text-[10px] font-black uppercase ${selectedPayment === method ? 'bg-white text-black border-white' : 'bg-neutral-950 text-neutral-400 border-white/5 hover:bg-neutral-900'}`}
                          >
                            <CreditCard size={12} />
                            <span>{method}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pricing summary list */}
                    <div className="bg-neutral-950 p-3 rounded-2xl border border-white/5 text-[11px] font-semibold space-y-1 text-neutral-400">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="text-neutral-200">{subtotal.toLocaleString()} {currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Tax ({taxRegion.replace('US-', '')} {Math.round(taxRate*100)}%):</span>
                        <span className="text-neutral-200">{taxAmount.toLocaleString()} {currency}</span>
                      </div>
                      {tipAmount > 0 && (
                        <div className="flex justify-between text-yellow-300">
                          <span>Barista Tip {Math.round(tipRate*100)}%:</span>
                          <span>{tipAmount.toLocaleString()} {currency}</span>
                        </div>
                      )}
                      {finalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Voucher Deductions:</span>
                          <span>-{finalDiscount.toLocaleString()} {currency}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-black text-white pt-1.5 border-t border-white/10">
                        <span>Total Due:</span>
                        <span className="text-[#E07A5F]">{total.toLocaleString()} {currency}</span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder || custCart.length === 0}
                      className="w-full bg-[#E07A5F] hover:bg-[#C95A40] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 cursor-pointer disabled:scale-100"
                    >
                      {isPlacingOrder ? (
                        <>
                          <TrendingUp className="animate-spin" size={14} />
                          <span>Connecting Cloud...</span>
                        </>
                      ) : (
                        <>
                          <span>{t('order_button')} ({total.toLocaleString()} {currency})</span>
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Screen 4: Receipt Confirmation */}
            {customerScreen === 'receipt' && placedOrder && (
              <div className="p-5 text-center space-y-6 pt-6">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">SUCCESSFULLY PLACED</span>
                    <h2 className="text-lg font-black text-white">Order Sent to Cloud POS!</h2>
                    <p className="text-[10px] text-neutral-400">ID Reference: <span className="font-mono text-neutral-200">#{placedOrder.id}</span></p>
                  </div>

                  {/* Real-time Order Progress Status Bar */}
                  <div className="bg-neutral-950 p-4 rounded-3xl border border-[#E07A5F]/20 space-y-4 shadow-xl text-left">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black tracking-wider text-[#E07A5F] uppercase">
                        {lang === 'vi' ? 'Tiến Trình Đơn Hàng Real-time' : 'Live Order Progress Tracker'}
                      </span>
                      <span className="bg-[#E07A5F]/20 text-[#E07A5F] text-[9px] px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                        ● {lang === 'vi' ? 'ĐANG POLLING' : 'POLLING STATUS'}
                      </span>
                    </div>

                    {/* Horizontal visual line and circles */}
                    <div className="relative flex items-center justify-between px-3 pt-3 pb-2">
                      {/* Background Progress line */}
                      <div className="absolute left-[30px] right-[30px] top-[26px] h-1.5 bg-neutral-800 rounded-full" />
                      
                      {/* Active Progress Line */}
                      <div 
                        className="absolute left-[30px] top-[26px] h-1.5 bg-[#E07A5F] transition-all duration-700 rounded-full"
                        style={{
                          width: currentStepNum === 1 ? '0%' : currentStepNum === 2 ? '50%' : '100%'
                        }}
                      />

                      {/* Step 1: Placed / Wait */}
                      <div className="relative flex flex-col items-center z-10 w-16 text-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          currentStepNum >= 1 
                            ? 'bg-[#E07A5F]/10 border-[#E07A5F] text-[#E07A5F]' 
                            : 'bg-neutral-900 border-neutral-700 text-neutral-500'
                        } ${currentStepNum === 1 ? 'ring-4 ring-[#E07A5F]/20 animate-pulse' : ''}`}>
                          <Clock size={14} className={currentStepNum === 1 ? "animate-spin" : ""} style={{ animationDuration: '6s' }} />
                        </div>
                        <span className={`text-[10px] font-black mt-1.5 ${currentStepNum >= 1 ? 'text-white' : 'text-neutral-500'}`}>
                          {lang === 'vi' ? 'Chờ nhận' : 'Wait'}
                        </span>
                        <span className="text-[8px] text-neutral-500 font-bold scale-[0.9]">In Queue</span>
                      </div>

                      {/* Step 2: Preparing */}
                      <div className="relative flex flex-col items-center z-10 w-16 text-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          currentStepNum >= 2 
                            ? 'bg-[#E07A5F] border-[#E07A5F] text-white' 
                            : 'bg-neutral-900 border-neutral-700 text-neutral-500'
                        } ${currentStepNum === 2 ? 'ring-4 ring-[#E07A5F]/30 animate-pulse' : ''}`}>
                          <Coffee size={14} className={currentStepNum === 2 ? 'animate-bounce' : ''} />
                        </div>
                        <span className={`text-[10px] font-black mt-1.5 ${currentStepNum >= 2 ? 'text-white' : 'text-neutral-500'}`}>
                          {lang === 'vi' ? 'Pha chế' : 'Preparing'}
                        </span>
                        <span className="text-[8px] text-neutral-500 font-bold scale-[0.9]">Brewing</span>
                      </div>

                      {/* Step 3: Ready */}
                      <div className="relative flex flex-col items-center z-10 w-16 text-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          currentStepNum >= 3 
                            ? 'bg-emerald-500 border-emerald-500 text-neutral-950 font-black' 
                            : 'bg-neutral-900 border-neutral-700 text-neutral-500'
                        } ${currentStepNum === 3 ? 'ring-4 ring-emerald-500/30' : ''}`}>
                          <CheckCircle2 size={14} />
                        </div>
                        <span className={`text-[10px] font-black mt-1.5 ${currentStepNum >= 3 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}>
                          {lang === 'vi' ? 'Sẵn sàng' : 'Ready'}
                        </span>
                        <span className="text-[8px] text-neutral-500 font-bold scale-[0.9]">Pickup!</span>
                      </div>
                    </div>

                    {/* Descriptive text helper */}
                    <div className="bg-neutral-900/60 p-2.5 rounded-2xl border border-white/5 text-[9.5px] font-medium text-neutral-300">
                      {currentStepNum === 1 && (
                        <p className="text-center">
                          ⏳ {lang === 'vi' ? 'Cửa hàng đã nhận đơn hàng' : 'Our cashiers received order'} <strong className="text-[#E07A5F]">#{placedOrder.id}</strong>. {lang === 'vi' ? 'Chuyên viên pha chế đang sắp xếp tách cà phê của bạn!' : 'A barista is about to pull your shots!'}
                        </p>
                      )}
                      {currentStepNum === 2 && (
                        <p className="text-center text-yellow-300">
                          ☕ <strong>{lang === 'vi' ? 'Đang pha chế:' : 'Now Brewing:'}</strong> {lang === 'vi' ? 'Barista đang chuẩn bị nguyên liệu, sữa & chiết xuất espresso!' : 'Barista is mixing dairy, toppings & extracting your espresso carefully.'}
                        </p>
                      )}
                      {currentStepNum >= 3 && (
                        <p className="text-center text-emerald-400 font-black">
                          🎉 <strong>{lang === 'vi' ? 'ĐỒ UỐNG ĐÃ SẴN SÀNG!' : 'DRINK IS READY!'}</strong> {lang === 'vi' ? 'Vui lòng nhận tại quầy giao hàng. Chúc bạn một ngày tốt lành!' : 'Please collect your fresh drinks at the pickup counter. Enjoy!'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Simulated Order ticket */}
                <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 text-left space-y-3.5">
                  <div className="border-b border-white/5 pb-2 text-[10px] text-neutral-400 flex justify-between font-mono font-bold">
                    <span>Customer: {placedOrder.customerName}</span>
                    <span>{new Date(placedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="space-y-2">
                    {placedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="border-b border-white/5 pb-1 last:border-0 last:pb-0 font-mono">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{item.quantity}x {item.product?.name || item.name} ({item.size})</span>
                          <span className="text-neutral-400">
                            {((item.product?.price || item.unitPrice || 0) * item.quantity).toLocaleString()} {currency}
                          </span>
                        </div>
                        {item.toppings?.length > 0 && (
                          <div className="text-[9px] text-[#E07A5F] pl-4 font-bold">
                            + {item.toppings.map((tId: string) => toppings.find(t => t.id === tId)?.name || tId).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[9px] text-neutral-400 italic pl-4">
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-2 text-[11px] font-black flex justify-between">
                    <span>Paid via {placedOrder.paymentMethod}:</span>
                    <span className="text-[#E07A5F]">{placedOrder.totalPrice?.toLocaleString()} {currency}</span>
                  </div>

                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <Clock size={12} className="text-yellow-400 leading-none" />
                    <p className="text-[9px] text-neutral-300 font-bold">
                      Est. Barista Crafting Duration: <span className="text-yellow-400 font-extrabold">{placedOrder.estimatedTime || 12} minutes</span>
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-white/5 text-[9px] text-neutral-400 leading-normal font-semibold">
                  🚀 Your espresso ticket is registered on the primary POS (Cashier tab) and Bar monitor! Audio notifications have played on physical headsets.
                </div>

                <button
                  onClick={() => setCustomerScreen('menu')}
                  className="w-full bg-white text-black py-3 rounded-xl text-xs font-black uppercase hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                >
                  Order another drink
                </button>
              </div>
            )}
          </div>

          {/* iOS Bottom Navigation Bar Mockup */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-neutral-950 border-t border-white/5 flex justify-around items-center px-4">
            <button 
              onClick={() => { setCustomerScreen('home'); playIOSSound('click'); }}
              className={`flex flex-col items-center gap-0.5 text-center ${customerScreen === 'home' ? 'text-white' : 'text-neutral-500'}`}
            >
              <Coffee size={18} />
              <span className="text-[8px] font-extrabold uppercase">Home</span>
            </button>
            <button 
              onClick={() => { setCustomerScreen('menu'); playIOSSound('click'); }}
              className={`flex flex-col items-center gap-0.5 text-center relative ${customerScreen === 'menu' ? 'text-white' : 'text-neutral-500'}`}
            >
              <TrendingUp size={18} />
              <span className="text-[8px] font-extrabold uppercase">Menu</span>
            </button>
            <button 
              onClick={() => { setCustomerScreen('cart'); playIOSSound('click'); }}
              className={`flex flex-col items-center gap-0.5 text-center relative ${customerScreen === 'cart' ? 'text-white' : 'text-neutral-500'}`}
            >
              <ShoppingBag size={18} />
              <span className="text-[8px] font-extrabold uppercase">Cart</span>
              {custCart.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white font-mono font-black text-[8px] px-1.5 rounded-full select-none">
                  {custCart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {customizingProduct && (
              <BeverageCustomizer
                product={customizingProduct}
                toppingsList={toppings}
                currency={currency}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                selectedToppings={selectedToppings}
                handleToggleTopping={handleToggleTopping}
                itemNote={itemNote}
                setItemNote={setItemNote}
                onClose={() => setCustomizingProduct(null)}
                onAdd={handleAddToCart}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Minimal Audio Chime Handler
function playIOSSound(type: 'click' | 'unlock') {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'click') {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 80);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 150);
    }
  } catch (e) {
    // Postponed gracefully
  }
}

// Extended Beverage Customizer Overlay component inside KalimCustomerApp View
interface CustomizerProps {
  product: Product;
  toppingsList: Topping[];
  currency: string;
  selectedSize: 'Regular' | 'Large';
  setSelectedSize: (size: 'Regular' | 'Large') => void;
  selectedToppings: string[];
  handleToggleTopping: (id: string) => void;
  itemNote: string;
  setItemNote: (note: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export function BeverageCustomizer({
  product,
  toppingsList,
  currency,
  selectedSize,
  setSelectedSize,
  selectedToppings,
  handleToggleTopping,
  itemNote,
  setItemNote,
  onClose,
  onAdd
}: CustomizerProps) {
  const extraSizeCost = selectedSize === 'Large' ? (currency === 'VND' ? 15000 : 1.00) : 0;
  const toppingsCost = selectedToppings.reduce((sum, tid) => {
    const t = toppingsList.find(top => top.id === tid);
    return sum + (t ? t.price : 0);
  }, 0);
  const finalPrice = product.price + extraSizeCost + toppingsCost;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-end justify-center p-0 md:p-4">
      <motion.div 
        initial={{ y: "100%", opacity: 0.8 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0.8 }}
        className="bg-neutral-900 text-white w-full max-w-sm rounded-t-[40px] md:rounded-[40px] p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border-t md:border border-white/10"
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">{product.category}</span>
            <h3 className="text-lg font-black text-white">{product.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 px-3 bg-neutral-800 text-neutral-400 text-xs font-black uppercase rounded-full hover:text-white cursor-pointer select-none">
            Close
          </button>
        </div>

        {/* Liquid Preview frame */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center p-4">
          {product.image ? (
            <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          ) : (
            <Coffee size={40} className="text-neutral-700" />
          )}
          <div className="relative z-10 text-center space-y-1">
            <span className="text-[14px] font-extrabold tracking-widest text-[#E07A5F]">{finalPrice.toLocaleString()} {currency}</span>
            <p className="text-[9px] text-white/50">Customizing recipe coefficients</p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Cup Serving size:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedSize('Regular')}
              className={`p-3 rounded-2xl text-xs font-black text-center border transition-all cursor-pointer ${selectedSize === 'Regular' ? 'bg-[#E07A5F] border-[#E07A5F] text-white' : 'bg-neutral-955 border-white/5 text-neutral-400 hover:bg-neutral-800'}`}
            >
              Regular Size (Standard)
            </button>
            <button
              onClick={() => setSelectedSize('Large')}
              className={`p-3 rounded-2xl text-xs font-black text-center border transition-all cursor-pointer ${selectedSize === 'Large' ? 'bg-[#E07A5F] border-[#E07A5F] text-white' : 'bg-neutral-955 border-white/5 text-neutral-400 hover:bg-neutral-800'}`}
            >
              Large Size (+{extraSizeCost > 0 ? extraSizeCost.toLocaleString() : (currency === 'VND' ? '15,000' : '1.00')} {currency})
            </button>
          </div>
        </div>

        {/* Sweet syrup / Oat Milk toppings */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Custom Beverage Add-ons:</span>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar">
            {toppingsList.map(topo => {
              const checked = selectedToppings.includes(topo.id);
              return (
                <div 
                  key={topo.id}
                  onClick={() => handleToggleTopping(topo.id)}
                  className="flex justify-between items-center bg-neutral-955 hover:bg-neutral-800 p-2.5 rounded-xl border border-white/5 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? 'bg-[#E07A5F] border-[#E07A5F]' : 'border-white/20'}`}>
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold">{topo.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">+ {topo.price.toLocaleString()} {currency}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barista request notes */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Note for Barista crew (optional):</span>
          <input
            type="text"
            value={itemNote}
            onChange={(e) => setItemNote(e.target.value)}
            placeholder="Less sweet, extra ice, oat milk hot, etc..."
            className="w-full bg-neutral-950 border border-white/5 px-4 py-3 rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Add to Basket button */}
        <button
          onClick={onAdd}
          className="w-full bg-[#E07A5F] hover:bg-[#C95A40] text-white py-4 rounded-3xl text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          Add to Basket ({finalPrice.toLocaleString()} {currency})
        </button>
      </motion.div>
    </div>
  );
}
