import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { exportPaystubToPdf } from '../utils/pdfExport';
import { 
  Users, 
  Clock, 
  QrCode, 
  MapPin, 
  CreditCard, 
  Printer, 
  UserCheck, 
  Sparkles, 
  Calculator, 
  AlertCircle, 
  Lock, 
  DollarSign, 
  CheckCircle2, 
  Calendar, 
  ArrowRight,
  RefreshCw,
  Sliders,
  Award,
  Globe,
  Settings,
  Plus,
  Trash2,
  FileText,
  ChevronRight,
  Info
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  pin: string;
  employeeId: string;
  permissions: string[];
  hourlyWage?: number; // Custom pay rate if configured
  avatarColor?: string;
  phone?: string;
  email?: string;
  notificationPreference?: 'email' | 'sms' | 'both';
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

interface StaffPortalProps {
  users: User[];
  timeClock: TimeStamp[];
  taxRegion: string;
  currency: string;
  fetchData: () => Promise<void>;
  isAdmin?: boolean;
  defaultTab?: 'self_service' | 'nfc_tap' | 'qr_scan' | 'auto_gps' | 'payroll' | 'ai_support';
  simulateDeveloperMode?: boolean;
  setSimulateDeveloperMode?: (val: boolean) => void;
}

interface RegionConfig {
  id: string; // Region Code, e.g., AB, ON, CA-CA
  country: string; // e.g., Canada, USA, Vietnam, Global
  name: string; // e.g., Alberta
  currency: string; // e.g., $, VND, £
  minWage: number;
  fedTaxRate: number; // Federal Income Tax %
  stateTaxRate: number; // State/Province Tax %
  pensionName: string; // e.g., CPP - Employee, FICA Social Security
  pensionRate: number; // e.g., 0.05953
  healthName: string; // e.g., EI - Employee, FICA Medicare
  healthRate: number; // e.g., 0.01630
  vacationPayRate: number; // e.g., 0.04 (4%)
  corpFedTaxRate?: number; // Federal Corporate Tax %
  corpLocalTaxRate?: number; // Provincial/State Corporate Tax %
}

// Preset configurations for North America, with support for additions to Go Global easily!
const PRESET_REGIONS: RegionConfig[] = [
  // Canada Provinces
  {
    id: "AB",
    country: "Canada",
    name: "Alberta",
    currency: "$",
    minWage: 15.00,
    fedTaxRate: 0.1382, // Calculated rate to match user's physical paystub exactly
    stateTaxRate: 0.00,  // Federal + Prov combined in federal line or separate
    pensionName: "CPP - Employee",
    pensionRate: 0.05953, // Canada Pension Plan
    healthName: "EI - Employee",
    healthRate: 0.0163,  // Employment Insurance
    vacationPayRate: 0.04, // 4% VacPay
    corpFedTaxRate: 0.09, // 9% Small Business
    corpLocalTaxRate: 0.02 // 2% Alberta
  },
  {
    id: "ON",
    country: "Canada",
    name: "Ontario",
    currency: "$",
    minWage: 17.20,
    fedTaxRate: 0.1500,
    stateTaxRate: 0.0505,
    pensionName: "CPP - Employee",
    pensionRate: 0.05953,
    healthName: "EI - Employee",
    healthRate: 0.0163,
    vacationPayRate: 0.04,
    corpFedTaxRate: 0.09,
    corpLocalTaxRate: 0.032 // 3.2% Ontario
  },
  {
    id: "BC",
    country: "Canada",
    name: "British Columbia",
    currency: "$",
    minWage: 17.40,
    fedTaxRate: 0.1500,
    stateTaxRate: 0.0506,
    pensionName: "CPP - Employee",
    pensionRate: 0.05953,
    healthName: "EI - Employee",
    healthRate: 0.0163,
    vacationPayRate: 0.04,
    corpFedTaxRate: 0.09,
    corpLocalTaxRate: 0.02 // 2.0% BC
  },
  {
    id: "QC",
    country: "Canada",
    name: "Quebec",
    currency: "$",
    minWage: 15.75,
    fedTaxRate: 0.1500,
    stateTaxRate: 0.1500,
    pensionName: "QPP - Employee", // Quebec Pension Plan
    pensionRate: 0.0640,
    healthName: "QPIP - Employee",
    healthRate: 0.0125,
    vacationPayRate: 0.04,
    corpFedTaxRate: 0.09,
    corpLocalTaxRate: 0.04 // 4% Quebec
  },
  // USA States
  {
    id: "US-CA",
    country: "USA",
    name: "California",
    currency: "$",
    minWage: 16.00,
    fedTaxRate: 0.1200,
    stateTaxRate: 0.0600,
    pensionName: "FICA Social Security",
    pensionRate: 0.0620,
    healthName: "FICA Medicare",
    healthRate: 0.0145,
    vacationPayRate: 0.00,
    corpFedTaxRate: 0.21,
    corpLocalTaxRate: 0.0884
  },
  {
    id: "US-NY",
    country: "USA",
    name: "New York",
    currency: "$",
    minWage: 16.00,
    fedTaxRate: 0.1200,
    stateTaxRate: 0.0550,
    pensionName: "FICA Social Security",
    pensionRate: 0.0620,
    healthName: "FICA Medicare",
    healthRate: 0.0145,
    vacationPayRate: 0.00,
    corpFedTaxRate: 0.21,
    corpLocalTaxRate: 0.065
  },
  {
    id: "US-TX",
    country: "USA",
    name: "Texas",
    currency: "$",
    minWage: 7.25,
    fedTaxRate: 0.1200,
    stateTaxRate: 0.0000,
    pensionName: "FICA Social Security",
    pensionRate: 0.0620,
    healthName: "FICA Medicare",
    healthRate: 0.0145,
    vacationPayRate: 0.00,
    corpFedTaxRate: 0.21,
    corpLocalTaxRate: 0.0000
  }
];

export default function StaffPortal({ 
  users: rawUsers, 
  timeClock: rawTimeClock, 
  taxRegion, 
  currency, 
  fetchData, 
  isAdmin = false, 
  defaultTab,
  simulateDeveloperMode = false,
  setSimulateDeveloperMode
}: StaffPortalProps) {
  // Defensive fallback sanitization for robust rendering
  const users = Array.isArray(rawUsers) ? rawUsers : [];
  const timeClock = Array.isArray(rawTimeClock) ? rawTimeClock : [];
  const [activePortalTab, setActivePortalTab] = useState<'self_service' | 'nfc_tap' | 'qr_scan' | 'auto_gps' | 'payroll' | 'ai_support'>(
    isAdmin ? (defaultTab || 'payroll') : 'self_service'
  );
  
  // Custom Regions list (persisted in localStorage to keep user entries)
  const [regions, setRegions] = useState<RegionConfig[]>(() => {
    const saved = localStorage.getItem('global_tax_regions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PRESET_REGIONS;
      }
    }
    return PRESET_REGIONS;
  });

  const [selectedRegionId, setSelectedRegionId] = useState<string>(taxRegion || "AB");

  // Keep localStorage sync
  useEffect(() => {
    localStorage.setItem('global_tax_regions', JSON.stringify(regions));
  }, [regions]);

  const activeRegion = regions.find(r => r.id === selectedRegionId) || regions[0] || PRESET_REGIONS[0];

  // Self-Service Timecard States
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Kalim Staff Connect Cloud Sync States
  const [syncPackets, setSyncPackets] = useState<any[]>([]);
  const [broadcastingMsg, setBroadcastingMsg] = useState<string>('');
  const [broadcastType, setBroadcastType] = useState<'announcement' | 'notification'>('announcement');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  const fetchSyncLogs = async () => {
    try {
      const res = await fetch("/api/staff-connect-sync");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSyncPackets(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (e) {
      console.warn("Failed to load staff-connect-sync packets", e);
    }
  };

  useEffect(() => {
    fetchSyncLogs();
    const interval = setInterval(fetchSyncLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendSyncBroadcast = async () => {
    if (!broadcastingMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      const activeUser = users.find(u => u.employeeId === selectedEmpId) || { name: "Staff Connect Portal" };
      const response = await fetch("/api/staff-connect-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: activeUser.name,
          message: broadcastingMsg,
          type: broadcastType
        })
      });
      if (response.ok) {
        setBroadcastingMsg('');
        fetchSyncLogs();
        fetchData(); // Trigger full POS data reload (syncs other lists)
      }
    } catch (err) {
      console.error("Failed to broadcast message:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };
  
  // NFC Tap States
  const [nfcSelectedId, setNfcSelectedId] = useState<string>('');
  const [isTapping, setIsTapping] = useState(false);
  const [nfcFeedback, setNfcFeedback] = useState<string>('');

  // QR Scan States
  const [qrSelectedId, setQrSelectedId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [qrFeedback, setQrFeedback] = useState<string>('');

  // User Toggles for Smart Auth
  const [nfcAuthEnabled, setNfcAuthEnabled] = useState(false);
  const [qrAuthEnabled, setQrAuthEnabled] = useState(false);
  const [gpsAuthEnabled, setGpsAuthEnabled] = useState(false);

  // Auto Geofence States
  const [gpsSelectedId, setGpsSelectedId] = useState<string>('');
  const [gpsSliderDistance, setGpsSliderDistance] = useState<number>(45); // simulated radial distance in meters
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(false);
  const [gpsLogs, setGpsLogs] = useState<string[]>([]);

  // Advanced Payroll/Paystub States
  const [paystubEmployeeId, setPaystubEmployeeId] = useState<string>('manual'); // 'manual' or existing user ID
  const [paystubMonth, setPaystubMonth] = useState<string>('2026-05'); // 'YYYY-MM'
  const [useManualPaystubHours, setUseManualPaystubHours] = useState<boolean>(true);
  const [paystubHours, setPaystubHours] = useState<number>(160.00); // Defaults to physical slip quantity
  const [paystubHourlyRate, setPaystubHourlyRate] = useState<number>(25.00); // Defaults to physical slip rate
  const [paystubCustomBonus, setPaystubCustomBonus] = useState<number>(0.00); // Custom bonus amount
  const [paystubCustomAllowance, setPaystubCustomAllowance] = useState<number>(0.00); // Custom allowance amount
  const [ytdMultiplier, setYtdMultiplier] = useState<number>(5); // May is month #5, so 5 cycles of earnings for YTD
  
  // Advanced Dynamic Bonus & Allowance list states
  const [paystubBonuses, setPaystubBonuses] = useState<{ id: string; category: string; description: string; amount: number }[]>([
    { id: 'b1', category: 'Performance', description: 'Store Sales Target Achievement Bonus', amount: 150.00 },
  ]);
  const [paystubAllowances, setPaystubAllowances] = useState<{ id: string; category: string; description: string; amount: number }[]>([
    { id: 'a1', category: 'Wellness', description: 'Gym & Mental Health Stipend', amount: 50.00 },
  ]);

  // Form states for adding items
  const [newBonusCategory, setNewBonusCategory] = useState<string>('Performance');
  const [newBonusDesc, setNewBonusDesc] = useState<string>('');
  const [newBonusAmt, setNewBonusAmt] = useState<number>(100);

  const [newAllowanceCategory, setNewAllowanceCategory] = useState<string>('Transit');
  const [newAllowanceDesc, setNewAllowanceDesc] = useState<string>('');
  const [newAllowanceAmt, setNewAllowanceAmt] = useState<number>(50);

  // Advanced Tax Exemption & Rate Overrides
  const [pensionExempt, setPensionExempt] = useState<boolean>(false);
  const [healthExempt, setHealthExempt] = useState<boolean>(false);
  const [pensionRateOverride, setPensionRateOverride] = useState<string>('');
  const [healthRateOverride, setHealthRateOverride] = useState<string>('');
  const [fedTaxRateOverride, setFedTaxRateOverride] = useState<string>('');
  const [stateTaxRateOverride, setStateTaxRateOverride] = useState<string>('');
  
  const [activePayingUserHireDate, setActivePayingUserHireDate] = useState<string>('2025-11-20');
  const [activePayingUserRating, setActivePayingUserRating] = useState<'standard' | 'excellent'>('standard');
  const [isUpdatingWage, setIsUpdatingWage] = useState<boolean>(false);

  // Game Quest Bonus mapping for each employee (defaults to empty, or can have a simulation for manual "Bear John" too)
  const [employeeGameBonus, setEmployeeGameBonus] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('kf_staff_game_bonuses');
    return saved ? JSON.parse(saved) : { manual: 0 };
  });

  // Track Quest progresses
  const [employeeQuests, setEmployeeQuests] = useState<Record<string, { q1: number; q2: number; q3: number; q1_done: boolean; q2_done: boolean; q3_done: boolean }>>(() => {
    const saved = localStorage.getItem('kf_staff_game_quests');
    return saved ? JSON.parse(saved) : {
      manual: { q1: 3, q2: 2, q3: 1, q1_done: true, q2_done: true, q3_done: true },
    };
  });

  // Synchronize game values to local storage
  useEffect(() => {
    localStorage.setItem('kf_staff_game_bonuses', JSON.stringify(employeeGameBonus));
  }, [employeeGameBonus]);

  useEffect(() => {
    localStorage.setItem('kf_staff_game_quests', JSON.stringify(employeeQuests));
  }, [employeeQuests]);

  // Quest Claim States
  const [claimingState, setClaimingState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [claimProgressStep, setClaimProgressStep] = useState<string>('');
  const [lastClaimedAmount, setLastClaimedAmount] = useState<number>(0);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string>('');

  // AI Cognitive Auditor panel states
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [aiAnalysisError, setAiAnalysisError] = useState<string>('');

  // Kalim Ecosystem AI Support & Requests states
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportLanguage, setSupportLanguage] = useState<'en' | 'fr' | 'es' | 'ja' | 'zh' | 'vi'>('en');
  
  const getInitialGreeting = (lang: 'en' | 'fr' | 'es' | 'ja' | 'zh' | 'vi') => {
    switch(lang) {
      case 'vi':
        return `### 🤖 HELLO! I AM THE KALIM COFFEE AI ECOSYSTEM ASSISTANT\nI can guide you through operations, troubleshooting, or applying excellent customer policies to keep them happy!\n\n**You can ask me about:**\n- ☕ **Exchange or mistake policies** (*Customer received wrong item*, *Customer unsatisfied with drink flavor*, *Refund policy*).\n- 🛠️ **Device self-troubleshooting** (*GPS geofencing locator issue*, *Receipt printer jam*, *Faulty NFC card*).\n- 📆 **Quick schedule operations** (*Apply for leave*, *Toggle fixed schedule*, *Register shifts*).`;
      case 'fr':
        return `### 🤖 BONJOUR ! JE SUIS L'ASSISTANT D'EXPLOITATION IA DE KALIM COFFEE\nJe suis là pour vous former sur les recettes, résoudre les incidents POS, ou planifier vos plannings !\n\n**Vous pouvez me questionner sur :**\n- ☕ **Boissons erronées / Goût insatisfait**\n- 🛠️ **Dépannage incident matériel (GPS, imprimante ticket)**\n- 📆 **Congés, absences et plannings fixes**`;
      case 'es':
        return `### 🤖 ¡HOLA! SOY EL ASISTENTE DE OPERACIONES IA DE KALIM COFFEE\n¡Puedo orientarle en recetas de bar, errores de POS, políticas de satisfacción, y organizar su agenda!\n\n**Pregúnteme sobre:**\n- ☕ **Bebidas equivocadas y opiniones de sabor**\n- 🛠️ **Solución de problemas de hardware (GPS, impresora de recibos)**\n- 📆 **Vacaciones, turnos asignados y agendas semanales**`;
      case 'ja':
        return `### 🤖 こんにちは！カリム・コーヒーAIオペレーションアシスタントです\nレシピ規定、決済機器トラブルの解説、お客様対応のアドバイス、休暇やシフトの登録連携など何でもお答えします。\n\n**以下についてご質問ください：**\n- ☕ **注文間違え、商品の味に関してご不満への対応**\n- 🛠️ **打刻GPSのエラー対処、レシート詰まりの対処**\n- 📆 **休暇申請、固定勤務シフト、時間割登録の操作**`;
      case 'zh':
        return `### 🤖 您好！我是卡林咖啡生态智能运营AI助手\n不管是做错饮料、打印机故障排查，还是请假及班次排程同步，我都能为您提供专业的一站式指导！\n\n**您可以向我咨询：**\n- ☕ **做错产品或顾客对口感不满意时的理赔标准**\n- 🛠️ **硬件及网络连接异常排查（如：考勤异常、卡纸解决方法）**\n- 📆 **提交请假登记、周固定排班及单周排班确认**`;
      default:
        return `### 🤖 HELLO! I AM KALIM ECOSYSTEM AI OPERATIONAL CHAMPION\nI can guide you on coffee recipes, POS hardware troubleshooting, customer compensation policies, or sync staff leaves directly to POS!\n\n**You can ask me about:**\n- ☕ **Incorrect drink served & custom taste complaints** (Double prioritizing order, Happy voucher)\n- 🛠️ **POS hardware fixes** (Paper jam, geofencing GPS calibration check)\n- 📆 **Workforce schedule sync** (Apply leave, setup fixed rosters, register shifts)`;
    }
  };

  const [supportHistory, setSupportHistory] = useState<Array<{ role: 'user' | 'model', text: string }>>([
    {
      role: 'model',
      text: getInitialGreeting('en')
    }
  ]);

  // Sync default greeting text when active supportLanguage modifications occur
  useEffect(() => {
    setSupportHistory([
      { role: 'model', text: getInitialGreeting(supportLanguage) }
    ]);
  }, [supportLanguage]);

  const [isTypingSupport, setIsTypingSupport] = useState<boolean>(false);
  const [employeeRequests, setEmployeeRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [aiLearningLogs, setAiLearningLogs] = useState<any[]>([]);

  // Fetch continuous learning logs
  const fetchAiLearningLogs = async () => {
    try {
      const res = await fetch("/api/ai-learning-logs");
      if (res.ok) {
        const data = await res.json();
        setAiLearningLogs(data);
      }
    } catch (e) {
      console.error("Failed to load ecosystem learning logs:", e);
    }
  };

  useEffect(() => {
    fetchAiLearningLogs();
  }, []);

  // Synchronize Employee Requests from Backend
  const fetchEmployeeRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch("/api/employee-requests");
      if (res.ok) {
        const data = await res.json();
        setEmployeeRequests(data);
      }
    } catch (e) {
      console.error("Failed to fetch employee requests:", e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchEmployeeRequests();
  }, []);

  // Submit automated request triggered by AI agent parsing conversational statements
  const handleTriggerRequestCreation = async (type: string, date: string, details: string) => {
    try {
      const currentStaff = selectedEmpId ? users.find(u => u.id === selectedEmpId) : null;
      const res = await fetch("/api/employee-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentStaff?.id || "u3",
          userName: currentStaff?.name || "Staff User",
          type,
          date,
          details
        })
      });
      if (res.ok) {
        await fetchEmployeeRequests();
      }
    } catch (err) {
      console.error("Failed to automatically create schedule requirement:", err);
    }
  };
  
  // Custom Paystub Header Variables (Initialized with values from physical image)
  const [showPaystubOverrideSettings, setShowPaystubOverrideSettings] = useState<boolean>(false);
  const [employerName, setEmployerName] = useState<string>('KALIM COFFEE');
  const [employerStreet, setEmployerStreet] = useState<string>('730 58 Ave Sw');
  const [employerCityStateZip, setEmployerCityStateZip] = useState<string>('Calgary, AB, Canada T2V 4Z5');

  const [employeeName, setEmployeeName] = useState<string>('BEAR JOHN');
  const [employeeStreet, setEmployeeStreet] = useState<string>('5720 2 St SW');
  const [employeeCityStateZip, setEmployeeCityStateZip] = useState<string>('Calgary, AB T2H 3B3');
  const [employeeOccupation, setEmployeeOccupation] = useState<string>('Manager');

  const [chequeNumber, setChequeNumber] = useState<string>('884294');
  const [chequeDate, setChequeDate] = useState<string>('2026-05-31');
  const [payPeriodStart, setPayPeriodStart] = useState<string>('2026-05-01');
  const [payPeriodEnd, setPayPeriodEnd] = useState<string>('2026-05-31');

  // Custom Region Form variables
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [newRegId, setNewRegId] = useState('');
  const [newRegName, setNewRegName] = useState('');
  const [newRegCountry, setNewRegCountry] = useState('Global');
  const [newRegCurrency, setNewRegCurrency] = useState('$');
  const [newRegMinWage, setNewRegMinWage] = useState(15.00);
  const [newRegFedTax, setNewRegFedTax] = useState(12.00);
  const [newRegStateTax, setNewRegStateTax] = useState(5.00);
  const [newRegPensionName, setNewRegPensionName] = useState('Social Pension Fund');
  const [newRegPensionRate, setNewRegPensionRate] = useState(5.00);
  const [newRegHealthName, setNewRegHealthName] = useState('National Medical Insurance');
  const [newRegHealthRate, setNewRegHealthRate] = useState(1.50);
  const [newRegVacRate, setNewRegVacRate] = useState(4.00);

  // Play audio feedbacks using Web Audio synth
  const triggerTone = (type: 'success' | 'error' | 'click') => {
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = actx.createOscillator();
      const gainNode = actx.createGain();
      osc.connect(gainNode);
      gainNode.connect(actx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, actx.currentTime); // A5 tone
        gainNode.gain.setValueAtTime(0.08, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.12);
        
        setTimeout(() => {
          const osc2 = actx.createOscillator();
          const gain2 = actx.createGain();
          osc2.connect(gain2);
          gain2.connect(actx.destination);
          osc2.frequency.setValueAtTime(1318.51, actx.currentTime); // E6
          gain2.gain.setValueAtTime(0.06, actx.currentTime);
          osc2.start();
          osc2.stop(actx.currentTime + 0.18);
        }, 110);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, actx.currentTime);
        gainNode.gain.setValueAtTime(0.12, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(950, actx.currentTime);
        gainNode.gain.setValueAtTime(0.05, actx.currentTime);
        osc.start();
        osc.stop(actx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn("Synthesizer bypassed:", e);
    }
  };

  // Switch employee and preload details instantly
  useEffect(() => {
    if (paystubEmployeeId && paystubEmployeeId !== 'manual') {
      const u = users.find(x => x.id === paystubEmployeeId) as any;
      if (u) {
        setEmployeeName((u.name || "").toUpperCase());
        const roleUpper = (u.role || "").toUpperCase();
        setEmployeeOccupation(roleUpper === 'ADMIN' ? 'General Manager' : roleUpper === 'MANAGER' ? 'Store Manager' : 'Barista');
        setPaystubHourlyRate(u.hourlyWage || activeRegion.minWage);
        
        // Define default hire dates and performance classes if not in database
        let defaultHire = "2025-12-15"; // default 3mo tenure roughly
        let defaultRating: 'standard' | 'excellent' = 'standard';
        if (u.id === 'u1') {
          defaultHire = "2024-01-15"; // > 1 year
          defaultRating = 'standard';
        } else if (u.id === 'u2' || u.id === 'u4' || u.id === 'u5') {
          defaultHire = "2024-06-01"; // > 1 year & High Performer
          defaultRating = 'excellent';
        } else if (u.id === 'u3') {
          defaultHire = "2025-11-20"; // around 3-4 months (Training bump test)
          defaultRating = 'standard';
        }
        
        setActivePayingUserHireDate(u.hireDate || defaultHire);
        setActivePayingUserRating(u.performanceRating || defaultRating);

        // Calculate dynamic real logged hours for selected month
        if (!useManualPaystubHours) {
          const stats = calculateShiftHoursForUser(u.id, paystubMonth);
          setPaystubHours(stats.totalHours);
        }
      }
    }
  }, [paystubEmployeeId, paystubMonth, useManualPaystubHours, users]);

  // Handle Geofence automatic Clock-In triggers
  useEffect(() => {
    if (autoTrackingEnabled && gpsSliderDistance <= 15 && gpsSelectedId) {
      const alreadyCheckedToday = timeClock.some(tc => {
        const todayStr = new Date().toISOString().split('T')[0];
        return tc.userId === gpsSelectedId && tc.timestamp.startsWith(todayStr) && tc.type === 'in' && tc.location === 'Geofence Auto-Trigger (15m)';
      });

      if (!alreadyCheckedToday) {
        const u = users.find(x => x.id === gpsSelectedId);
        if (u) {
          triggerAutoGeofenceClockIn(u);
        }
      }
    }
  }, [gpsSliderDistance, autoTrackingEnabled, gpsSelectedId]);

  const triggerAutoGeofenceClockIn = async (employee: User) => {
    try {
      const response = await fetch('/api/time-clock/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          type: 'in',
          location: 'Geofence Auto-Trigger (15m)'
        })
      });
      const data = await response.json();
      if (response.ok) {
        triggerTone('success');
        const now = new Date().toLocaleTimeString();
        setGpsLogs(prev => [`[${now}] SUCCESS: Automatic Geofence Clock-In verified for ${employee.name} at 15m radius. Logged reference!`, ...prev]);
        fetchData();
      } else {
        const now = new Date().toLocaleTimeString();
        setGpsLogs(prev => [`[${now}] NOTIFICATION: Geofence check skipped for ${employee.name}: ${data.error || "Shift already logged today"}`, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit direct clock stamp via self service
  const handleStampSubmit = async (type: 'in' | 'out') => {
    if (!selectedEmpId) {
      triggerTone('error');
      setStatusMsg({ text: "Please select an employee profile to record.", success: false });
      return;
    }
    const staff = users.find(u => u.id === selectedEmpId);
    if (!staff) return;

    if (pin !== staff.pin) {
      triggerTone('error');
      setStatusMsg({ text: "Authentication Error: Incorrect 4-digit security PIN.", success: false });
      return;
    }

    try {
      const response = await fetch('/api/time-clock/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staff.employeeId,
          type,
          location: 'Standard Self-Punch Terminal'
        })
      });
      const resData = await response.json();
      if (!response.ok) {
        triggerTone('error');
        setStatusMsg({ text: resData.error || "Action failed - shift constraint", success: false });
      } else {
        triggerTone('success');
        setStatusMsg({ 
          text: `Success! ${staff.name} successfully clocked ${type.toUpperCase()} at ${new Date(resData.timestamp).toLocaleTimeString()}`, 
          success: true 
        });
        setPin('');
        fetchData();
      }
    } catch (err: any) {
      triggerTone('error');
      setStatusMsg({ text: "Web server communication failure.", success: false });
    }
  };

  // NFC Device TAP simulated handler
  const handleNfcSimulateTap = async () => {
    if (!nfcSelectedId) {
      triggerTone('error');
      setNfcFeedback("Error: Please choose an active barista signature card first.");
      return;
    }
    const staff = users.find(u => u.id === nfcSelectedId);
    if (!staff) return;

    setIsTapping(true);
    setNfcFeedback("Transmitting secure high-frequency NFC ticket to register...");
    triggerTone('click');

    setTimeout(async () => {
      const lastStamp = [...timeClock].reverse().find(tc => tc.userId === staff.id);
      const nextType = (!lastStamp || lastStamp.type === 'out') ? 'in' : 'out';

      try {
        const response = await fetch('/api/time-clock/stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: staff.employeeId,
            type: nextType,
            location: 'POS Smart Tap (NFC)'
          })
        });
        const resData = await response.json();
        setIsTapping(false);
        if (!response.ok) {
          triggerTone('error');
          setNfcFeedback(`Terminal Rejected Tag: ${resData.error || "Daily limit hit"}`);
        } else {
          triggerTone('success');
          setNfcFeedback(`Terminal Approved! Verified ${staff.name} (#${staff.employeeId}). Clocked ${nextType.toUpperCase()} successfully!`);
          fetchData();
        }
      } catch (e) {
        setIsTapping(false);
        triggerTone('error');
        setNfcFeedback("NFC transaction interrupted by connection timeout.");
      }
    }, 1500);
  };

  // QR Barcode scanning simulation
  const handleQrSimulateScan = async () => {
    if (!qrSelectedId) {
      triggerTone('error');
      setQrFeedback("Error: Please select a staff ID badge to load.");
      return;
    }
    const staff = users.find(u => u.id === qrSelectedId);
    if (!staff) return;

    setIsScanning(true);
    setQrFeedback("Calibrating optical focal width other barcode...");
    triggerTone('click');

    setTimeout(async () => {
      const lastStamp = [...timeClock].reverse().find(tc => tc.userId === staff.id);
      const nextType = (!lastStamp || lastStamp.type === 'out') ? 'in' : 'out';

      try {
        const response = await fetch('/api/time-clock/stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: staff.employeeId,
            type: nextType,
            location: 'Optical QR Badge Scanner'
          })
        });
        const resData = await response.json();
        setIsScanning(false);
        if (!response.ok) {
          triggerTone('error');
          setQrFeedback(`Scan Refused: ${resData.error || "Already logged"}`);
        } else {
          triggerTone('success');
          setQrFeedback(`Decoded! Authorized Staff: ${staff.name}. Action: Clocked-${nextType.toUpperCase()} registered!`);
          fetchData();
        }
      } catch (e) {
        setIsScanning(false);
        triggerTone('error');
        setQrFeedback("Optical hardware scanner reporting offline.");
      }
    }, 1200);
  };

  // Save modified wage back to server (go global feature)
  const saveEmployeeWage = async (userId: string, wage: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyWage: Number(wage) })
      });
      if (response.ok) {
        triggerTone('success');
        fetchData();
      } else {
        triggerTone('error');
      }
    } catch (e) {
      triggerTone('error');
      console.error("Save wage rate error", e);
    }
  };

  // Custom Region Adder
  const handleAddRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegId || !newRegName) {
      triggerTone('error');
      return;
    }
    const duplicate = regions.some(r => r.id.toLowerCase() === newRegId.toLowerCase());
    if (duplicate) {
      alert("A region with this short code already exists!");
      triggerTone('error');
      return;
    }

    const nRegion: RegionConfig = {
      id: newRegId.toUpperCase(),
      country: newRegCountry,
      name: newRegName,
      currency: newRegCurrency,
      minWage: Number(newRegMinWage),
      fedTaxRate: Number(newRegFedTax) / 100,
      stateTaxRate: Number(newRegStateTax) / 100,
      pensionName: newRegPensionName,
      pensionRate: Number(newRegPensionRate) / 100,
      healthName: newRegHealthName,
      healthRate: Number(newRegHealthRate) / 100,
      vacationPayRate: Number(newRegVacRate) / 100
    };

    setRegions(prev => [...prev, nRegion]);
    setSelectedRegionId(nRegion.id);
    setShowAddRegionModal(false);
    triggerTone('success');

    // Reset Form
    setNewRegId('');
    setNewRegName('');
    setNewRegFedTax(12.00);
    setNewRegStateTax(5.00);
    setNewRegPensionName('Pension Contribution');
    setNewRegPensionRate(5.00);
    setNewRegHealthName('Unemployment Levy');
    setNewRegHealthRate(1.50);
  };

  // Calculate Shift hours from logs
  const calculateShiftHoursForUser = (userId: string, filterMonth: string) => {
    const userEvents = timeClock
      .filter(tc => tc.userId === userId && tc.timestamp.startsWith(filterMonth))
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let shifts: { clockIn: string; clockOut?: string; hours: number; status: string }[] = [];
    let activeIn: TimeStamp | null = null;

    userEvents.forEach(event => {
      if (event.type === 'in') {
        activeIn = event;
      } else if (event.type === 'out' && activeIn) {
        const diffMs = new Date(event.timestamp).getTime() - new Date(activeIn.timestamp).getTime();
        const hrs = Math.max(0, diffMs / (1000 * 60 * 60));
        shifts.push({
          clockIn: activeIn.timestamp,
          clockOut: event.timestamp,
          hours: Number(hrs.toFixed(2)),
          status: 'completed'
        });
        activeIn = null;
      }
    });

    if (activeIn) {
      const diffMs = new Date().getTime() - new Date((activeIn as TimeStamp).timestamp).getTime();
      const hrs = Math.max(0, diffMs / (1000 * 60 * 60));
      shifts.push({
        clockIn: (activeIn as TimeStamp).timestamp,
        hours: Number(hrs.toFixed(2)),
        status: 'in_progress'
      });
    }

    const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
    return { shifts, totalHours: Number(totalHours.toFixed(2)) };
  };

  // Helper to format hours in exact HH:MM format like image ("160:00")
  const formatHourQty = (decimalHrs: number) => {
    const hrs = Math.floor(decimalHrs);
    const mins = Math.round((decimalHrs - hrs) * 60);
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${formattedMins}`;
  };

  // Tax Calculator for Current and YTD
  const calculateFinancialTotals = () => {
    const qty = paystubHours;
    const rate = paystubHourlyRate;
    
    // Regular Earnings
    const regularGross = qty * rate;
    
    // Vacation Pay calculated as dynamic multiplier (usually 4% for Canada)
    const vacPayRate = activeRegion.vacationPayRate;
    const vacPayAmount = regularGross * vacPayRate;

    // Quest Challenge Bonus & Custom Allowances
    const gameBonus = employeeGameBonus[paystubEmployeeId] || 0;
    
    // Sum up dynamic list items + standard input field values
    const dynamicBonusTotal = paystubBonuses.reduce((sum, b) => sum + b.amount, 0);
    const dynamicAllowanceTotal = paystubAllowances.reduce((sum, a) => sum + a.amount, 0);

    const additionalBonus = paystubCustomBonus + dynamicBonusTotal;
    const allowances = paystubCustomAllowance + dynamicAllowanceTotal;
    
    // Total gross is Regular + VacPay + bonuses + allowances
    const totalGross = regularGross + vacPayAmount + gameBonus + additionalBonus + allowances;

    // Deductions Formulas
    // Pension deduction with exemptions and custom rate overrides
    let pensionDeduction = 0;
    if (!pensionExempt) {
      const pensionRateToUse = pensionRateOverride !== '' ? Number(pensionRateOverride) / 100 : activeRegion.pensionRate;
      if (activeRegion.pensionName.includes("CPP")) {
        const monthlyExemption = 291.67;
        const taxableCPP = Math.max(0, totalGross - monthlyExemption);
        pensionDeduction = taxableCPP * pensionRateToUse;
      } else {
        pensionDeduction = totalGross * pensionRateToUse;
      }
    }

    // Health deduction with exemptions and custom rate overrides
    let healthDeduction = 0;
    if (!healthExempt) {
      const healthRateToUse = healthRateOverride !== '' ? Number(healthRateOverride) / 100 : activeRegion.healthRate;
      healthDeduction = totalGross * healthRateToUse;
    }

    // Federal and state deductions with rate overrides
    const fedTaxRateToUse = fedTaxRateOverride !== '' ? Number(fedTaxRateOverride) / 100 : activeRegion.fedTaxRate;
    const stateTaxRateToUse = stateTaxRateOverride !== '' ? Number(stateTaxRateOverride) / 100 : activeRegion.stateTaxRate;

    const fedDeduction = totalGross * fedTaxRateToUse;
    const stateDeduction = totalGross * stateTaxRateToUse;

    const totalWithholdings = pensionDeduction + healthDeduction + fedDeduction + stateDeduction;
    const netEarning = Math.max(0, totalGross - totalWithholdings);

    // Calculate simulated YTD Amounts using selected multiplier (eg. Q1 March = 3x)
    const ytdRegular = regularGross * ytdMultiplier;
    const ytdVac = vacPayAmount * ytdMultiplier;
    const ytdGameBonus = gameBonus * ytdMultiplier;
    const ytdAdditionalBonus = additionalBonus * ytdMultiplier;
    const ytdAllowances = allowances * ytdMultiplier;
    const ytdGross = totalGross * ytdMultiplier;
    const ytdPension = pensionDeduction * ytdMultiplier;
    const ytdHealth = healthDeduction * ytdMultiplier;
    const ytdFed = fedDeduction * ytdMultiplier;
    const ytdState = stateDeduction * ytdMultiplier;
    const ytdWithholdings = totalWithholdings * ytdMultiplier;
    const ytdNet = netEarning * ytdMultiplier;

    return {
      regularGross,
      vacPayAmount,
      gameBonus,
      additionalBonus,
      allowances,
      totalGross,
      pensionDeduction,
      healthDeduction,
      fedDeduction,
      stateDeduction,
      totalWithholdings,
      netEarning,
      
      ytdRegular,
      ytdVac,
      ytdGameBonus,
      ytdAdditionalBonus,
      ytdAllowances,
      ytdGross,
      ytdPension,
      ytdHealth,
      ytdFed,
      ytdState,
      ytdWithholdings,
      ytdNet
    };
  };

  const totals = calculateFinancialTotals();

  // Dynamic career roadmap calculations
  const getRoadmapDetailsForSelectedUser = () => {
    if (paystubEmployeeId === 'manual') {
      return {
        hireDate: '2023-01-01',
        performanceRating: 'standard' as const,
        diffMonths: 36,
        recommended: 32.50,
        milestoneAchieved: "Manual Specialist Rate",
        milestoneDetails: "Subject to direct custom enterprise agreement.",
        needsWageBump: false,
        currentWage: 32.50
      };
    }
    const u = users.find(x => x.id === paystubEmployeeId) as any;
    if (!u) {
      return {
        hireDate: activePayingUserHireDate,
        performanceRating: activePayingUserRating,
        diffMonths: 0,
        recommended: 15.00,
        milestoneAchieved: "Not Found",
        milestoneDetails: "",
        needsWageBump: false,
        currentWage: 15.00
      };
    }

    const hire = new Date(activePayingUserHireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Number((diffDays / 30.4375).toFixed(1));

    let recommended = 15.00;
    let milestoneAchieved = "Training Tier";
    let milestoneDetails = "Standard training probation period.";

    if (activePayingUserRating === 'excellent') {
      if (diffMonths >= 6) {
        recommended = 20.00;
        milestoneAchieved = "Professional Tier (Accelerated Growth 🚀)";
        milestoneDetails = "Excellent Performance: Promoted after 6 months (shortened from 12 months!)";
      } else if (diffMonths >= 1) {
        recommended = 17.00;
        milestoneAchieved = "Intermediate Tier (Accelerated Growth 🚀)";
        milestoneDetails = "Excellent Performance: Promoted after 1 month (shortened from 3 months!)";
      } else {
        recommended = 15.00;
        milestoneAchieved = "Training Tier (Accelerated Track)";
        milestoneDetails = "Excellent performance noted. Next promotion unlocks at month 1.";
      }
    } else {
      if (diffMonths >= 12) {
        recommended = 20.00;
        milestoneAchieved = "Professional / Senior Tier";
        milestoneDetails = "Standard Longevity Path: 12+ months seniority.";
      } else if (diffMonths >= 3) {
        recommended = 17.00;
        milestoneAchieved = "Intermediate Tier";
        milestoneDetails = "Standard Longevity Path: 3+ months seniority.";
      } else {
        recommended = 15.00;
        milestoneAchieved = "Training Tier";
        milestoneDetails = "Standard Path: Under 3 months training durational probation.";
      }
    }

    const currentWage = u.hourlyWage || activeRegion.minWage;
    const needsWageBump = Math.abs(currentWage - recommended) > 0.05;

    return {
      hireDate: activePayingUserHireDate,
      performanceRating: activePayingUserRating,
      diffMonths,
      recommended,
      milestoneAchieved,
      milestoneDetails,
      needsWageBump,
      currentWage
    };
  };

  // Submit updated employee growth properties to server
  const handleApplyGrowthUpdate = async (recWage: number) => {
    if (paystubEmployeeId === 'manual') return;
    setIsUpdatingWage(true);
    triggerTone('click');
    try {
      const response = await fetch(`/api/users/${paystubEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hourlyWage: recWage,
          hireDate: activePayingUserHireDate,
          performanceRating: activePayingUserRating
        })
      });
      if (response.ok) {
        setPaystubHourlyRate(recWage);
        triggerTone('success');
        await fetchData();
      } else {
        triggerTone('error');
        alert("Failed to sync career plan back to core systems.");
      }
    } catch (e) {
      triggerTone('error');
      console.error(e);
    } finally {
      setIsUpdatingWage(false);
    }
  };



  // Task Gamification & Anti-Fraud Engine
  const handleClaimReward = (empId: string) => {
    if (!empId) {
      alert("Please authenticate or select a staff profile first!");
      return;
    }
    triggerTone('click');
    setClaimingState('running');
    setClaimProgressStep("Initializing secure cryptographic session...");

    const steps = [
      "Accessing secure enclave storage container...",
      "Matching device hardware telemetry signature...",
      "Analyzing geofencing coordinates vs active shop receiver...",
      "Scanning Android / iOS kernel for Mock-Location provider services...",
      "Running machine-learning behavioral check on punch event logbooks..."
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setClaimProgressStep(steps[currentStepIndex]);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        // Anti-Fraud check evaluation
        if (simulateDeveloperMode) {
          setClaimErrorMessage("CRITICAL INTEGRITY FAILURE - EXPLOIT DETECTED: FakeGPS simulation detected on the device. ADB debugging features are currently enabled which violates employee integrity terms. Reward payout locked.");
          setClaimingState('failed');
          triggerTone('error');
        } else {
          // Success pathway!
          setEmployeeGameBonus(prev => ({
            ...prev,
            [empId]: (prev[empId] || 0) + 20
          }));
          // Make sure quests are fully logged as complete
          setEmployeeQuests(prev => ({
            ...prev,
            [empId]: { q1: 3, q2: 2, q3: 1, q1_done: true, q2_done: true, q3_done: true }
          }));
          setLastClaimedAmount(20);
          setClaimingState('success');
          triggerTone('success');
        }
      }
    }, 900);
  };

  const handleTriggerAIAnalysis = async (targetEmpId: string) => {
    triggerTone('click');
    setIsAnalyzingAI(true);
    setAiAnalysisResult('');
    setAiAnalysisError('');

    try {
      let payload = {
        employeeName: "Bear John",
        hourlyRate: paystubHourlyRate,
        hours: paystubHours,
        rating: activePayingUserRating,
        gameBonus: employeeGameBonus[targetEmpId] || 0,
        spoofModeActive: simulateDeveloperMode
      };

      if (targetEmpId !== 'manual') {
        const found = users.find(u => u.id === targetEmpId);
        if (found) {
          payload.employeeName = found.name;
        }
      }

      const response = await fetch("/api/ai/employee-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "AI Service responded with an error.");
      }

      const data = await response.json();
      setAiAnalysisResult(data.analysis || "No analysis returned from AI.");
    } catch (err: any) {
      console.error(err);
      setAiAnalysisError(err.message || "Failed to contact Gemini performance auditor.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSendSupportMessage = async (textToSend?: string) => {
    const rawMsg = textToSend !== undefined ? textToSend : supportMessage;
    if (!rawMsg.trim() || isTypingSupport) return;

    triggerTone('click');
    
    // Add user message to history
    const updatedHistory = [...supportHistory, { role: 'user' as const, text: rawMsg }];
    setSupportHistory(updatedHistory);
    setSupportMessage('');
    setIsTypingSupport(true);

    try {
      const currentStaff = selectedEmpId ? users.find(u => u.id === selectedEmpId) : null;
      const apiHistory = updatedHistory.slice(0, -1).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));

      const response = await fetch("/api/ai/employee-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawMsg,
          history: apiHistory,
          userId: currentStaff?.id || 'u3',
          userName: currentStaff?.name || 'Staff User',
          language: supportLanguage
        })
      });

      if (!response.ok) {
        throw new Error("Ecosystem API responded with error");
      }

      const data = await response.json();
      const aiReply = data.response;

      setSupportHistory(prev => [...prev, { role: 'model' as const, text: aiReply }]);

      // Trigger learning logs reload after successfully creating the support event logs
      fetchAiLearningLogs();

      // Check for automated scheduling triggers
      if (aiReply.includes('[REQUEST_TRIGGER]')) {
        try {
          const parts = aiReply.split('[REQUEST_TRIGGER]');
          const content = parts[1].split('[/REQUEST_TRIGGER]')[0].trim();
          const parsed = JSON.parse(content);
          if (parsed && parsed.type) {
            await handleTriggerRequestCreation(parsed.type, parsed.date || '', parsed.details || '');
          }
        } catch (parseErr) {
          console.warn("Failed to parse automated scheduling block:", parseErr);
        }
      }
    } catch (err) {
      console.error(err);
      setSupportHistory(prev => [
        ...prev,
        {
          role: 'model' as const,
          text: "⚠️ **Connection Error** - Unable to communicate with the AI Gateway. The issue might be due to an offline system status. Please check your network connection and try again."
        }
      ]);
    } finally {
      setIsTypingSupport(false);
    }
  };

  const handleApproveRejectRequest = async (id: string, action: 'approve' | 'reject') => {
    triggerTone('click');
    try {
      const res = await fetch(`/api/employee-requests/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        await fetchEmployeeRequests();
        await fetchData(); // triggers reloading App.tsx's master data (including rosters/schedules!)
      }
    } catch (err) {
      console.error("Failed to approve/reject schedule proposal:", err);
    }
  };

  // Print function
  const handlePrint = () => {
    triggerTone('click');
    window.print();
  };

  const handleExportPaystubPDF = () => {
    triggerTone('click');
    exportPaystubToPdf({
      employer: {
        name: employerName,
        street: employerStreet,
        cityStateZip: employerCityStateZip,
      },
      employee: {
        name: employeeName,
        street: employeeStreet,
        cityStateZip: employeeCityStateZip,
        occupation: employeeOccupation,
      },
      details: {
        chequeNumber: chequeNumber,
        payPeriodStart: payPeriodStart,
        payPeriodEnd: payPeriodEnd,
        chequeDate: chequeDate,
        hourlyRate: paystubHourlyRate,
        hours: paystubHours,
      },
      totals: {
        regularGross: totals.regularGross,
        ytdRegular: totals.ytdRegular,
        vacPayAmount: totals.vacPayAmount,
        ytdVac: totals.ytdVac,
        totalGross: totals.totalGross,
        ytdGross: totals.ytdGross,
        pensionDeduction: totals.pensionDeduction,
        ytdPension: totals.ytdPension,
        healthDeduction: totals.healthDeduction,
        ytdHealth: totals.ytdHealth,
        fedDeduction: totals.fedDeduction,
        ytdFed: totals.ytdFed,
        stateDeduction: totals.stateDeduction,
        ytdState: totals.ytdState,
        totalDeduction: totals.totalWithholdings,
        ytdDeduction: totals.ytdWithholdings,
        netPay: totals.netEarning,
        ytdNet: totals.ytdNet,
        gameBonus: totals.gameBonus,
        ytdGameBonus: totals.ytdGameBonus,
        additionalBonus: totals.additionalBonus,
        ytdAdditionalBonus: totals.ytdAdditionalBonus,
        allowances: totals.allowances,
        ytdAllowances: totals.ytdAllowances,
      },
      region: {
        currency: activeRegion.currency,
        pensionName: activeRegion.pensionName,
        healthName: activeRegion.healthName,
        pensionRate: activeRegion.pensionRate,
        healthRate: activeRegion.healthRate,
        vacationPayRate: activeRegion.vacationPayRate,
      }
    });
  };

  return (
    <div id="staff-central-workspace" className="flex-1 flex flex-col overflow-hidden bg-[#F8F7F4] text-[#1A1A1A] pb-24 font-sans">
      
      {/* Upper info section */}
      <div className="bg-white border-b border-black/5 px-6 py-5 md:py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-black/5 rounded-xl text-black">
              <Users size={20} />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Staff Personnel Terminal</h1>
          </div>
          <p className="text-xs text-black/50 mt-1">
            Realtime shop presence, geolocating tracking, and official CRA/IRS compliant paystub generator.
          </p>
        </div>
        
        {/* Quick provincial configuration info badge */}
        {isAdmin && (
          <div className="bg-black/5 p-2 rounded-2xl flex items-center gap-3 border border-black/5">
            <div className="space-y-0.5 text-right">
              <div className="text-[9px] uppercase font-bold tracking-wider text-black/40">Active Business Region</div>
              <div className="text-xs font-black text-black">{activeRegion.name} (Min: {activeRegion.currency}{activeRegion.minWage.toFixed(2)}/hr)</div>
            </div>
            <div className="h-8 w-[1px] bg-black/10"></div>
            <select 
              value={selectedRegionId} 
              onChange={(e) => {
                setSelectedRegionId(e.target.value);
                triggerTone('click');
              }}
              className="font-mono text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-black/10 text-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
            >
              {regions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id} - {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Primary Sub-tab switcher */}
      {!isAdmin && (
        <div className="bg-white border-b border-black/5 px-6 py-2 flex gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'self_service', label: 'Timecard Punch', icon: Clock }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                triggerTone('click');
                setActivePortalTab(item.id as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activePortalTab === item.id 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-black/55 hover:bg-black/5 hover:text-black/85'
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB A: SELF-SERVICE TIME CARD PUNCH */}
          {activePortalTab === 'self_service' && (
            <motion.div
              key="self_service"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
            >
              {/* Profile Selector */}
              <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-black uppercase">Staff Authentication</h2>
                  <p className="text-xs text-black/50">Select your name and enter your 4-digit PIN to punch clock-in/out.</p>
                </div>
                
                {/* Unified Smart Auth Configuration panel */}
                {!isAdmin ? (
                  <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-2xl space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Smart App Integrations</h3>
                    <div className="space-y-2">
                       <label className="flex items-center justify-between cursor-pointer group">
                         <div className="flex items-center gap-2">
                           <CreditCard size={14} className="text-stone-400 group-hover:text-black transition-colors" />
                           <span className="text-sm font-bold text-stone-700">NFC App Simulation</span>
                         </div>
                         <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${nfcAuthEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`} onClick={() => setNfcAuthEnabled(!nfcAuthEnabled)}>
                           <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${nfcAuthEnabled ? 'translate-x-4' : ''}`} />
                         </div>
                       </label>
                       
                       <label className="flex items-center justify-between cursor-pointer group">
                         <div className="flex items-center gap-2">
                           <QrCode size={14} className="text-stone-400 group-hover:text-black transition-colors" />
                           <span className="text-sm font-bold text-stone-700">Optical Barcode Scan</span>
                         </div>
                         <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${qrAuthEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`} onClick={() => setQrAuthEnabled(!qrAuthEnabled)}>
                           <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${qrAuthEnabled ? 'translate-x-4' : ''}`} />
                         </div>
                       </label>

                       <label className="flex items-center justify-between cursor-pointer group">
                         <div className="flex items-center gap-2">
                           <MapPin size={14} className="text-stone-400 group-hover:text-black transition-colors" />
                           <span className="text-sm font-bold text-stone-700">Autonomous GPS (15m)</span>
                         </div>
                         <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${gpsAuthEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`} onClick={() => {
                           setGpsAuthEnabled(!gpsAuthEnabled);
                           setAutoTrackingEnabled(!autoTrackingEnabled);
                         }}>
                           <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${gpsAuthEnabled ? 'translate-x-4' : ''}`} />
                         </div>
                       </label>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black text-white px-4 py-3 xl:px-5 xl:py-4 rounded-2xl flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/20 p-2 rounded-xl">
                         <Sparkles size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black tracking-tight">Smart Auth System</h3>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest">NFC • Barcode • GPS Active</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white/10 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">Enabled</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-black/40">Select Staff Profile</label>
                  <select 
                    value={selectedEmpId}
                    onChange={(e) => {
                      setSelectedEmpId(e.target.value);
                      triggerTone('click');
                    }}
                    className="w-full bg-black/5 hover:bg-black/10 transition-colors border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-black focus:ring-1 focus:ring-black outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Profile --</option>
                    {users.map(u => {
                      const lastEv = [...timeClock].reverse().find(tc => tc.userId === u.id);
                      const statusBadge = lastEv?.type === 'in' ? '🟢 Clocked In' : '⚪ Rest / Off';
                      const roleStr = (u.role || "").toUpperCase();
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name} ({roleStr}) - {statusBadge}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* PIN Entry Area */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-black/40 text-center block">Pass-PIN Verification</label>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3].map(pos => {
                      const char = pin[pos] || '';
                      return (
                        <div 
                          key={pos} 
                          className={`w-12 h-14 bg-black/5 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-black ${
                            char ? 'border-black bg-white scale-105' : 'border-transparent'
                          } transition-all`}
                        >
                          {char ? '•' : ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* Digit pad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          if (pin.length < 4) {
                            triggerTone('click');
                            setPin(prev => prev + num);
                          }
                        }}
                        className="h-12 bg-black/5 hover:bg-black/10 active:scale-95 transition-all text-sm font-black rounded-lg cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        triggerTone('click');
                        setPin('');
                      }}
                      className="h-12 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        if (pin.length < 4) {
                          triggerTone('click');
                          setPin(prev => prev + '0');
                        }
                      }}
                      className="h-12 bg-black/5 hover:bg-black/10 active:scale-95 transition-all text-sm font-black rounded-lg cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      onClick={() => {
                        if (pin.length > 0) {
                          triggerTone('click');
                          setPin(prev => prev.slice(0, -1));
                        }
                      }}
                      className="h-12 bg-black/5 hover:bg-black/10 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                {/* Punch Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleStampSubmit('in')}
                    className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <UserCheck size={14} /> CLOCK IN
                  </button>
                  <button
                    onClick={() => handleStampSubmit('out')}
                    className="py-3.5 bg-black hover:bg-black/95 text-white text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Clock size={14} /> CLOCK OUT
                  </button>
                </div>
              </div>

              {/* Dynamic Presence Logbook */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black/40 mb-4 flex items-center justify-between">
                    <span>Recent Activity Logs</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Systems Online</span>
                  </h3>

                  {statusMsg && (
                    <div className={`p-4 rounded-2xl text-xs font-bold mb-4 flex items-start gap-2 border ${
                      statusMsg.success 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-red-50 border-red-100 text-[#E07A5F]'
                    }`}>
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{statusMsg.text}</span>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {timeClock.length === 0 ? (
                      <p className="text-xs text-black/35 font-bold text-center py-12">No clock events recorded during this session.</p>
                    ) : (
                      [...timeClock].reverse().slice(0, 10).map((stamp, idx) => (
                        <div key={stamp.id || idx} className="flex justify-between items-center bg-black/5 p-3 rounded-2xl border border-black/5 hover:border-black/10 transition-all">
                          <div className="flex gap-2.5 items-center">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              stamp.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-black text-white'
                            }`}>
                              {stamp.type.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-black text-black">{stamp.userName}</p>
                              <p className="text-[10px] text-black/40 font-bold">{stamp.location || "Staff Clock-In"}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-mono font-bold text-black/60 bg-white/75 px-2 py-1 rounded-lg border">
                            {new Date(stamp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Kalim Connect Cloud Live Sync Noticeboard */}
                <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Kalim Cloud Connected</span>
                    </h3>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Staff Sync Active
                    </span>
                  </div>

                  <p className="text-[11px] text-black/50 leading-relaxed font-semibold">
                    This terminal is synchronized dynamically through Firebase Firestore. Broadcast announcements or alerts directly to all POS stations.
                  </p>

                  {/* Broadcast form */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={broadcastingMsg}
                        onChange={(e) => setBroadcastingMsg(e.target.value)}
                        placeholder={selectedEmpId ? "Type an announcement..." : "Select Profile first to broadcast..."}
                        disabled={!selectedEmpId || isBroadcasting}
                        className="flex-1 text-xs font-bold bg-black/5 border-none rounded-2xl px-4 py-3 text-black placeholder-black/30 outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        onClick={handleSendSyncBroadcast}
                        disabled={!selectedEmpId || !broadcastingMsg.trim() || isBroadcasting}
                        className="px-4 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
                      >
                        {isBroadcasting ? "Sending..." : "Send"}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-black text-black/40">Notice Type:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBroadcastType('announcement')}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer ${broadcastType === 'announcement' ? 'bg-amber-100 text-amber-800' : 'bg-black/5 text-black/50 hover:bg-black/10'}`}
                        >
                          📢 Notice
                        </button>
                        <button
                          onClick={() => setBroadcastType('notification')}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer ${broadcastType === 'notification' ? 'bg-red-100 text-red-800' : 'bg-black/5 text-black/50 hover:bg-black/10'}`}
                        >
                          🚨 Urgent
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Synced announcements stream */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[10px] font-black uppercase text-black/40 tracking-wider">Ecosystem Bulletins</h4>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar">
                      {syncPackets.length === 0 ? (
                        <p className="text-[10px] text-black/30 font-bold py-4 text-center">No active announcements on the cloud terminal.</p>
                      ) : (
                        syncPackets.slice(0, 5).map((packet, index) => (
                          <div
                            key={packet.id || index}
                            className={`p-3 rounded-2xl border flex flex-col gap-1 transition-all ${
                              packet.type === 'notification'
                                ? 'bg-red-50/70 border-red-100 text-red-950'
                                : packet.type === 'system'
                                ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
                                : 'bg-amber-50/70 border-amber-100 text-amber-950'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                {packet.type === 'notification' ? '🚨 URGENT' : packet.type === 'system' ? '🤖 SYSTEM' : '📢 NOTICE'}
                                <span className="text-black/30 font-bold">• {packet.senderName}</span>
                              </span>
                              <span className="text-[9px] font-mono font-bold opacity-60">
                                {new Date(packet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs font-bold leading-normal">{packet.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Guidelines card */}
                <div className="bg-[#E07A5F]/10 border border-[#E07A5F]/20 p-5 rounded-3xl flex gap-3">
                  <Sparkles size={18} className="text-[#E07A5F] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-[#E07A5F] uppercase">CRA / IRS Audit Match</p>
                    <p className="text-[11px] text-[#E07A5F]/80 leading-relaxed">
                      Clock punches are instantly recorded on Cloud Server nodes. Calculations automatically load associated regional basic hourly rates and deductions to generate official paycheck slips.
                    </p>
                  </div>
                </div>

                {/* Ecosystem Submissions */}
                <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-black uppercase text-black/50 tracking-wide">Ecosystem Submissions</h3>
                    <span className="text-[9px] font-mono text-zinc-400">{employeeRequests.length} Forms Sent</span>
                  </div>

                  {/* Submission triggers form */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        triggerTone('click');
                        const r = prompt("Enter leave startDate (YYYY-MM-DD):", "2026-06-18");
                        if (!r) return;
                        const d = prompt("Enter reasons for vacation leave:", "Family vacation leave proposal");
                        if (!d) return;
                        handleTriggerRequestCreation("leave", r, d);
                      }}
                      disabled={!selectedEmpId}
                      className="p-3 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 border border-rose-200/50 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer text-rose-800 transition-all text-center"
                    >
                      <span className="text-lg font-black shrink-0">🌴</span>
                      <span className="text-[10px] font-black uppercase">Apply for Leave</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerTone('click');
                        const details = prompt("Enter custom fixed schedule preferences:", "Standard repeat shift Tue & Thu afternoons");
                        if (!details) return;
                        handleTriggerRequestCreation("fixed_schedule", "", details);
                      }}
                      disabled={!selectedEmpId}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 border border-emerald-200/50 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer text-emerald-800 transition-all text-center"
                    >
                      <span className="text-lg font-black shrink-0">📌</span>
                      <span className="text-[10px] font-black uppercase">Weekly Fixed Shift</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerTone('click');
                        const date = prompt("Enter dynamic shift date (YYYY-MM-DD):", "2026-06-16");
                        if (!date) return;
                        const shift = prompt("Enter target shift (A / B):", "A");
                        if (!shift) return;
                        handleTriggerRequestCreation("register_schedule", date, `Enrolling in barista shift ${shift.toUpperCase()} on ${date}`);
                      }}
                      disabled={!selectedEmpId}
                      className="p-3 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 border border-indigo-200/50 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer text-indigo-800 transition-all col-span-2 text-center"
                    >
                      <span className="text-lg font-black shrink-0">📆</span>
                      <span className="text-[10px] font-black uppercase">Register Schedule Shift</span>
                    </button>
                  </div>

                  {/* Log list of active requests */}
                  <div className="space-y-2 border-t pt-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#1a1a1a]/40">Ecosystem Synchronized Petitions</span>
                    <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar">
                      {employeeRequests.filter(r => r.userId === selectedEmpId).length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic text-center py-6">No requests filed. Use the buttons above to propose vacation or register shifts.</p>
                      ) : (
                        employeeRequests.filter(r => r.userId === selectedEmpId).map((req) => (
                          <div key={req.id} className="p-3 bg-zinc-50 border rounded-2xl flex justify-between items-start text-[11px] gap-2">
                            <div className="space-y-1">
                              <p className="font-extrabold text-zinc-900 flex items-center gap-1">
                                {req.type === 'leave' && <span className="text-rose-600">🌴 Leave Request</span>}
                                {req.type === 'fixed_schedule' && <span className="text-emerald-700">📌 Fixed Weekly</span>}
                                {req.type === 'register_schedule' && <span className="text-indigo-600">📆 Shift Enrollment</span>}
                                {req.date && <span className="text-zinc-500 font-mono text-[9px] bg-zinc-200 px-1 py-0.5 rounded">({req.date})</span>}
                              </p>
                              <p className="text-zinc-600 leading-normal">{req.details}</p>
                            </div>
                            <div>
                              {req.status === 'pending' ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold uppercase text-[8px] rounded-full">PENDING</span>
                              ) : req.status === 'approved' ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold uppercase text-[8px] rounded-full">APPROVED</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold uppercase text-[8px] rounded-full">DENIED</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Training Logs Widget */}
                <div className="bg-white p-6 rounded-[28px] border border-indigo-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wide flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-600" />
                        AI Learning & Sync Training Logs (Ecosystem)
                      </h3>
                      <p className="text-[10px] text-zinc-400">Captured issues trained to optimize future fine-tuning model responses</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{aiLearningLogs.length} Events</span>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                    {aiLearningLogs.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic text-center py-6">No training logs recorded yet. Use the floating chat assistant to populate log streams.</p>
                    ) : (
                      aiLearningLogs.map((log: any) => (
                        <div key={log.id} className="p-2.5 bg-indigo-50/40 border border-indigo-100/50 rounded-xl space-y-1 text-[11px]">
                          <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                            <span>{new Date(log.timestamp).toLocaleTimeString()} ({log.language?.toUpperCase()})</span>
                            <span className="text-indigo-600 font-bold text-[8px]">{log.source.toUpperCase()}</span>
                          </div>
                          <p className="font-extrabold text-indigo-950 flex items-center gap-1.5 leading-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            {log.detectedIssue}
                          </p>
                          <p className="text-zinc-600 italic">" {log.userQuery} "</p>
                          <p className="text-[9px] text-zinc-400 truncate bg-white p-1 rounded border border-zinc-100">{log.responseExcerpt}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      triggerTone('success');
                      try {
                        const res = await fetch("/api/ai-learning-logs/optimize", { method: "POST" });
                        if (res.ok) {
                          fetchAiLearningLogs();
                        }
                      } catch (err) {
                        console.error("Failed to optimize AI learning database logs:", err);
                      }
                    }}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles size={12} /> Rotate Optimizer & Sim Training Cycle
                  </button>
                </div>
              </div>

              {/* GAMIFIED CHALLENGES / QUESTS CARD */}
              <div id="gamified-quest-hub" className="col-span-1 md:col-span-2 bg-[#1E293B] text-white p-6 md:p-8 rounded-[32px] border border-slate-700 shadow-xl space-y-6 mt-6">
                {/* Title Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-5">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                      <Award size={22} className="animate-pulse text-[#E07A5F]" />
                    </span>
                    <div>
                      <h3 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                        🎯 KALIM QUEST CLOUD <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-mono tracking-widest font-black animate-bounce">Shift gamification</span>
                      </h3>
                      <p className="text-xs text-slate-400">Complete daily tasks on your shift to unlock instant $20 cash bonuses directly credited to your paycheck!</p>
                    </div>
                  </div>
                  {/* Active User Badge */}
                  <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 text-xs shrink-0">
                    <div className="text-right">
                      <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Status Check</div>
                      <div className="font-bold text-slate-300">
                        {selectedEmpId ? `Active employee: ${users.find(u => u.id === selectedEmpId)?.name || 'Team member'}` : "Please select your profile above"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quests list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Quest 1 */}
                  <div className="bg-slate-800/55 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-400/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">NFC SPEED TAP</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{selectedEmpId ? '3/3' : '0/3'} completed</span>
                      </div>
                      <h4 className="text-sm font-black text-white">⚡ Peak Hour Attendance Check</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Tap your NFC chip key twice between 8AM - 10AM to confirm barista peak presence.</p>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: selectedEmpId ? '100%' : '0%' }}></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold block text-right">Progress: {selectedEmpId ? '100%' : '0%'}</span>
                    </div>
                  </div>

                  {/* Quest 2 */}
                  <div className="bg-slate-800/55 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-400/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">GPS GEOFENCE</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{selectedEmpId ? '2/2' : '0/2'} verified</span>
                      </div>
                      <h4 className="text-sm font-black text-white">📍 Geofence Shield Protocol</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Maintain GPS coordinates within 15 meters of HQ center throughout shift duration.</p>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full" style={{ width: selectedEmpId ? '100%' : '0%' }}></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold block text-right">Progress: {selectedEmpId ? '100%' : '0%'}</span>
                    </div>
                  </div>

                  {/* Quest 3 */}
                  <div className="bg-slate-800/55 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">SECURITY PIN</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{selectedEmpId ? '1/1' : '0/1'} verified</span>
                      </div>
                      <h4 className="text-sm font-black text-white">🛡️ Hardware Key Authentication</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">Submit secure enclave hardware keys upon every clock punchout.</p>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: selectedEmpId ? '100%' : '0%' }}></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold block text-right">Progress: {selectedEmpId ? '100%' : '0%'}</span>
                    </div>
                  </div>
                </div>

                {/* Claim action container */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                    <span className="text-xs font-mono font-bold text-slate-400">Bonus Eligible: <strong className="text-emerald-400">{selectedEmpId ? "$20.00 cash bonus" : "Please select your profile first"}</strong></span>
                  </div>

                  <div>
                    {claimingState === 'idle' && (
                      <button
                        onClick={() => handleClaimReward(selectedEmpId || 'manual')}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles size={14} /> Claim $20 Quest Reward
                      </button>
                    )}

                    {claimingState === 'running' && (
                      <div className="flex items-center gap-3">
                        <RefreshCw size={14} className="animate-spin text-teal-400" />
                        <span className="text-xs font-black uppercase text-teal-400 tracking-wider animate-pulse">{claimProgressStep}</span>
                      </div>
                    )}

                    {claimingState === 'success' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs font-black">
                        <CheckCircle2 size={15} /> SUCCESS: $20.00 ADDED TO WAGES!
                        <button 
                          onClick={() => setClaimingState('idle')}
                          className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[9px] uppercase hover:bg-emerald-500/30 transition-all ml-1"
                        >
                          Reset / Clear
                        </button>
                      </div>
                    )}

                    {claimingState === 'failed' && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex flex-col gap-1 text-rose-400 text-xs">
                        <div className="flex items-center gap-2 font-black">
                          <AlertCircle size={15} /> CLAIM REJECTED: SPOOFING DETECTED
                        </div>
                        <p className="text-[12px] text-rose-300/80 leading-normal max-w-md">{claimErrorMessage}</p>
                        <button 
                          onClick={() => {
                            setClaimingState('idle');
                            setSimulateDeveloperMode(false);
                          }}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold px-3 py-1 rounded text-[9px] uppercase max-w-[170px] transition-all mt-1"
                        >
                          Disable FakeGPS Hook
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB E: POWERFUL GLOBAL PAYROLL LEDGER & PRINTABLE OFFICIAL PAYSTUB */}
          {activePortalTab === 'payroll' && (
            <motion.div
              key="payroll"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Top Administration section and Add Custom Region trigger */}
              <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight uppercase text-black">Advanced Global Payroll System</h3>
                  <p className="text-xs text-black/40">Configure basic hourly rates, calculate withholding deductions matching regional laws, and generate paper paystubs.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      triggerTone('click');
                      setShowAddRegionModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm ml-auto md:ml-0"
                  >
                    <Plus size={14} /> Add Custom Region / Country
                  </button>
                </div>
              </div>

              {/* COFFEE ECOSYSTEM PETITIONS APPROVAL PANEL (Kalim Ecosystem Sync Panel) */}
              <div className="bg-white p-6 rounded-[28px] border border-[#E07A5F]/20 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-black/5 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase text-black tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Ecosystem Petitions Approval Center
                    </h3>
                    <p className="text-[11px] text-zinc-500">Approve leave proposals, barista shifts, and recurring rosters synchronized automatically via AI and employee requests</p>
                  </div>
                  <button
                    onClick={() => {
                      triggerTone('click');
                      fetchEmployeeRequests();
                    }}
                    className="px-3 py-1.5 bg-[#F8F7F4] hover:bg-black/5 border border-black/10 rounded-xl text-[10px] font-bold text-zinc-600 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={10} className={isLoadingRequests ? "animate-spin" : ""} />
                    Refresh proposals list
                  </button>
                </div>

                {employeeRequests.length === 0 ? (
                  <div className="py-10 text-center text-zinc-400 text-xs italic">
                    🎉 Completed! No pending petitions currently from staff or AI assistants.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employeeRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          req.status === 'pending'
                            ? 'bg-zinc-50 border-amber-200 shadow-sm'
                            : req.status === 'approved'
                            ? 'bg-emerald-50/30 border-emerald-100 opacity-80'
                            : 'bg-rose-50/20 border-rose-100 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[10px] bg-zinc-200/60 text-zinc-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              {req.userName || "Staff Member"}
                            </span>
                            <h4 className="text-xs font-black text-zinc-900 mt-1 flex items-center gap-1.5">
                              {req.type === 'leave' && <span>🌴 Vacation/Leave Offer</span>}
                              {req.type === 'fixed_schedule' && <span>📌 Weekly Fixed Shift</span>}
                              {req.type === 'register_schedule' && <span>📆 Shift Registration</span>}
                              {req.date && <span className="font-mono text-[10px] text-zinc-500 bg-white border px-1 rounded">{req.date}</span>}
                            </h4>
                          </div>

                          <div>
                            {req.status === 'pending' ? (
                              <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 font-bold uppercase text-[8px] rounded-full">PENDING</span>
                            ) : req.status === 'approved' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold uppercase text-[8px] rounded-full">APPROVED</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-800 font-bold uppercase text-[8px] rounded-full">REJECTED</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-zinc-600 leading-normal bg-white p-2.5 rounded-xl border border-black/5 font-medium">
                          {req.details}
                        </p>

                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRejectRequest(req.id, 'approve')}
                              className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer shadow-sm text-center"
                            >
                              ✓ Approve Petition
                            </button>
                            <button
                              onClick={() => handleApproveRejectRequest(req.id, 'reject')}
                              className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase rounded-lg border border-rose-200 transition-all cursor-pointer text-center"
                            >
                              ✗ Deny
                            </button>
                          </div>
                        )}

                        {req.status !== 'pending' && (
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1 italic">
                            <span>Automation sync complete</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row splitter: Left is controls, Right is physical paystub matching image */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Playbook Controls (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">

                  {/* ⚙️ Live Regional Paystub Tax Rates & Settings Overrides Component */}
                  <div className="bg-zinc-50 border border-black/10 rounded-[28px] p-6 shadow-sm space-y-4 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaystubOverrideSettings(!showPaystubOverrideSettings);
                        triggerTone('click');
                      }}
                      className="w-full flex justify-between items-center text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#E07A5F]/10 rounded-xl text-[#E07A5F] shrink-0">
                          <Sliders size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-black tracking-wide">
                            ⚙️ active region tax overrides
                          </h4>
                          <p className="text-[10px] text-black/50 leading-tight">
                            Edit federal, state/prov, CPP/pension, and EI rates for region ({activeRegion.id}) in real-time.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-white border border-black/15 shadow-sm px-2.5 py-1 rounded-xl text-black hover:bg-zinc-100 transition-all font-bold shrink-0">
                        {showPaystubOverrideSettings ? 'Hide ▲' : 'Edit ▼'}
                      </span>
                    </button>

                    {showPaystubOverrideSettings && (
                      <div className="pt-4 border-t border-black/10 space-y-4 text-xs animate-fade-in font-sans">
                        {/* Section 1: Active Region Tax Percentages */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-black/5 shadow-inner">
                          <h5 className="font-black uppercase text-[#E07A5F] tracking-wider text-[10px]">
                            1. Regional Tax rates ({activeRegion.name})
                          </h5>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-black/45">Federal tax Rate %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="90"
                                value={Number((activeRegion.fedTaxRate * 100).toFixed(4))}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value)) / 100;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, fedTaxRate: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-black/45">State / Prov Rate %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="90"
                                value={Number((activeRegion.stateTaxRate * 100).toFixed(4))}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value)) / 100;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, stateTaxRate: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-zinc-500">Pension Fund Name</label>
                              <input
                                type="text"
                                value={activeRegion.pensionName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, pensionName: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold text-zinc-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-black/45">Pension Rate %</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="30"
                                value={Number((activeRegion.pensionRate * 100).toFixed(4))}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value)) / 100;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, pensionRate: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-zinc-500">Health / EI Plan Name</label>
                              <input
                                type="text"
                                value={activeRegion.healthName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, healthName: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold text-zinc-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-black/45">Health / EI Rate %</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="30"
                                value={Number((activeRegion.healthRate * 100).toFixed(4))}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value)) / 100;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, healthRate: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-black/45">Vacation Pay Rate %</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="30"
                                value={Number((activeRegion.vacationPayRate * 100).toFixed(4))}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value)) / 100;
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, vacationPayRate: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-black/45">Min Wage ({activeRegion.currency}/hr)</label>
                              <input
                                type="number"
                                step="0.10"
                                min="5"
                                max="50"
                                value={activeRegion.minWage}
                                onChange={(e) => {
                                  const val = Math.max(5, Number(e.target.value));
                                  setRegions(prev => prev.map(r => r.id === activeRegion.id ? { ...r, minWage: val } : r));
                                }}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Active Employer/Company Parameters */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-black/5 shadow-inner">
                          <h5 className="font-black uppercase text-[#E07A5F] tracking-wider text-[10px]">
                            2. Employer Organization Details
                          </h5>
                          
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-zinc-500">Employer Legal Name</label>
                              <input
                                type="text"
                                value={employerName}
                                onChange={(e) => setEmployerName(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold text-zinc-800"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-zinc-500">Street Address</label>
                                <input
                                  type="text"
                                  value={employerStreet}
                                  onChange={(e) => setEmployerStreet(e.target.value)}
                                  className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold text-zinc-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-zinc-500">City / Postal / Zip</label>
                                <input
                                  type="text"
                                  value={employerCityStateZip}
                                  onChange={(e) => setEmployerCityStateZip(e.target.value)}
                                  className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 font-bold text-zinc-800"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select target profile for payee */}
                  <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase text-black/40 tracking-wider">Payee & Wage Parameters</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/50">Select Payee Target</label>
                      <select
                        value={paystubEmployeeId}
                        onChange={(e) => {
                          setPaystubEmployeeId(e.target.value);
                          triggerTone('click');
                          setPaystubCustomBonus(0);
                          setPaystubCustomAllowance(0);
                          if (e.target.value === 'manual') {
                            setEmployeeName("BEAR JOHN");
                            setEmployeeOccupation("Manager");
                            setPaystubHourlyRate(25.00);
                            setPaystubHours(160.00);
                            setPaystubMonth("2026-05");
                            setChequeDate("2026-05-31");
                            setPayPeriodStart("2026-05-01");
                            setPayPeriodEnd("2026-05-31");
                          }
                        }}
                        className="w-full bg-black/5 rounded-xl px-4 py-2.5 text-xs font-bold border-none outline-none cursor-pointer"
                      >
                        <option value="manual">💎 Custom Manual Employee (Bear John - Manager)</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            👤 Member: {u.name} ({(u.role || "").toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Hours Mode */}
                    {paystubEmployeeId !== 'manual' && (
                      <div className="flex justify-between items-center bg-black/5 p-3 rounded-xl border">
                        <div>
                          <p className="text-xs font-black">Use Real Recorded Logs</p>
                          <p className="text-[10px] text-black/40">Aggregates exact clock-in/out timestamps.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={!useManualPaystubHours}
                          onChange={(e) => {
                            setUseManualPaystubHours(!e.target.checked);
                            triggerTone('click');
                            if (e.target.checked) {
                              const stats = calculateShiftHoursForUser(paystubEmployeeId, paystubMonth);
                              setPaystubHours(stats.totalHours);
                            } else {
                              setPaystubHours(160.00);
                            }
                          }}
                          className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Month selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/50">Ledger Calendar Month</label>
                      <input
                        type="month"
                        value={paystubMonth}
                        onChange={(e) => {
                          setPaystubMonth(e.target.value);
                          triggerTone('click');
                        }}
                        className="w-full bg-black/5 rounded-xl px-4 py-2.5 text-xs font-bold border-none outline-none"
                      />
                    </div>

                    {/* Hourly wage setting slider */}
                    <div className="space-y-2 pt-1 border-t border-black/5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-black/50">Base Pay Rate</span>
                        <span className="font-mono font-bold text-black bg-black/5 px-2 py-0.5 rounded-lg border">
                          {activeRegion.currency}{paystubHourlyRate.toFixed(2)}/hr
                        </span>
                      </div>
                      <input 
                        type="range"
                        min={Math.floor(activeRegion.minWage)}
                        max={120}
                        step="0.5"
                        value={paystubHourlyRate}
                        onChange={(e) => {
                          setPaystubHourlyRate(Number(e.target.value));
                        }}
                        className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>

                    {/* Numeric custom hours input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-black/50">Monthly Hours Qty</span>
                        <span className="font-mono font-bold text-black bg-black/5 px-2 py-0.5 rounded-lg border">
                          {paystubHours} hrs ({formatHourQty(paystubHours)})
                        </span>
                      </div>
                      <input 
                        type="number"
                        disabled={!useManualPaystubHours && paystubEmployeeId !== 'manual'}
                        value={paystubHours}
                        onChange={(e) => setPaystubHours(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-black/5 rounded-xl px-4 py-2.5 text-xs font-bold border-none outline-none disabled:opacity-40"
                      />
                    </div>

                    {/* Advanced Bonuses, Allowances & Tax Controls */}
                    <div className="space-y-4 pt-3 border-t border-black/5 mt-2">
                      <h5 className="text-[11px] font-black uppercase text-black/60 tracking-wider flex items-center gap-1.5">
                        <span>💰</span> Bonuses & Allowances Engine
                      </h5>
                      
                      {/* Original Quick Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-black/55 block">Quick Base Bonus ({activeRegion.currency})</label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={paystubCustomBonus}
                            onChange={(e) => setPaystubCustomBonus(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 text-xs font-bold font-mono focus:ring-1 focus:ring-black focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-black/55 block">Quick Base Allowance ({activeRegion.currency})</label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={paystubCustomAllowance}
                            onChange={(e) => setPaystubCustomAllowance(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 text-xs font-bold font-mono focus:ring-1 focus:ring-black focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Active Items Table */}
                      <div className="space-y-2 bg-neutral-50 border border-black/5 p-3 rounded-xl">
                        <span className="text-[9px] font-black uppercase text-black/40 block">Line Items Ledger</span>
                        
                        {paystubBonuses.length === 0 && paystubAllowances.length === 0 ? (
                          <p className="text-[10px] text-black/40 italic py-1 text-center">No custom bonus/allowance line items added yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {paystubBonuses.map(b => (
                              <div key={b.id} className="flex justify-between items-center text-[10px] bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-emerald-850 font-bold">
                                <div className="flex-1 truncate">
                                  <span className="bg-emerald-200 text-emerald-950 px-1 py-0.5 rounded text-[8px] uppercase font-black mr-1.5">{b.category}</span>
                                  <span>{b.description}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span>+{activeRegion.currency}{b.amount.toFixed(2)}</span>
                                  <button 
                                    onClick={() => setPaystubBonuses(prev => prev.filter(x => x.id !== b.id))}
                                    className="text-black/35 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                    title="Delete line item"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {paystubAllowances.map(a => (
                              <div key={a.id} className="flex justify-between items-center text-[10px] bg-blue-50 border border-blue-100 p-2 rounded-lg text-blue-850 font-bold">
                                <div className="flex-1 truncate">
                                  <span className="bg-blue-200 text-blue-950 px-1 py-0.5 rounded text-[8px] uppercase font-black mr-1.5">{a.category}</span>
                                  <span>{a.description}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span>+{activeRegion.currency}{a.amount.toFixed(2)}</span>
                                  <button 
                                    onClick={() => setPaystubAllowances(prev => prev.filter(x => x.id !== a.id))}
                                    className="text-black/35 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                    title="Delete line item"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Interactive dynamic item fields */}
                        <div className="pt-2 border-t border-black/5 mt-2 space-y-2">
                          <span className="text-[8px] font-black uppercase text-black/50 block">Add Dynamic Line Item</span>
                          
                          {/* Bonus addition form */}
                          <div className="bg-white p-2 border rounded-lg space-y-2">
                            <div className="flex gap-1.5">
                              <select 
                                value={newBonusCategory}
                                onChange={(e) => setNewBonusCategory(e.target.value)}
                                className="bg-zinc-50 text-[10px] p-1 border rounded font-bold"
                              >
                                <option value="Performance">Performance</option>
                                <option value="Referral">Referral</option>
                                <option value="Tips">Tips Payout</option>
                                <option value="Holiday">Holiday Bonus</option>
                                <option value="Allowance-Transit">Transit Alloc</option>
                                <option value="Allowance-Telecom">Telecom Alloc</option>
                                <option value="Allowance-Wellness">Wellness Alloc</option>
                                <option value="Allowance-Meals">Meal Alloc</option>
                              </select>
                              <input 
                                type="text"
                                placeholder="Description (e.g. Sales Goal)"
                                value={newBonusDesc}
                                onChange={(e) => setNewBonusDesc(e.target.value)}
                                className="bg-zinc-50 text-[10px] p-1 border rounded flex-1 font-bold focus:outline-none"
                              />
                              <input 
                                type="number"
                                placeholder="Amount"
                                value={newBonusAmt}
                                onChange={(e) => setNewBonusAmt(Math.max(0, Number(e.target.value)))}
                                className="bg-zinc-50 text-[10px] p-1 border rounded w-16 font-bold font-mono focus:outline-none"
                              />
                              <button 
                                onClick={() => {
                                  if (!newBonusDesc.trim()) return;
                                  const isAllowance = newBonusCategory.startsWith('Allowance-');
                                  const cleanCat = isAllowance ? newBonusCategory.replace('Allowance-', '') : newBonusCategory;
                                  
                                  if (isAllowance) {
                                    setPaystubAllowances(prev => [...prev, {
                                      id: 'allow_' + Date.now(),
                                      category: cleanCat,
                                      description: newBonusDesc,
                                      amount: newBonusAmt
                                    }]);
                                  } else {
                                    setPaystubBonuses(prev => [...prev, {
                                      id: 'bonus_' + Date.now(),
                                      category: cleanCat,
                                      description: newBonusDesc,
                                      amount: newBonusAmt
                                    }]);
                                  }
                                  setNewBonusDesc('');
                                  triggerTone('click');
                                }}
                                className="bg-black hover:bg-neutral-800 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase transition-colors cursor-pointer"
                              >
                                + ADD
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Tax Declaration & Exemptions */}
                      <div className="space-y-3 bg-neutral-50 border border-black/5 p-3 rounded-xl mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-black/50 block">Withholding Exemptions & Bracket Overrides</span>
                          <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase">CRA / IRS Compliant</span>
                        </div>

                        {/* Tax Exempt checkboxes */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <label className="flex items-center gap-1.5 bg-white border p-2 rounded-lg cursor-pointer hover:bg-black/[0.02] select-none font-bold">
                            <input 
                              type="checkbox" 
                              checked={pensionExempt} 
                              onChange={(e) => setPensionExempt(e.target.checked)}
                              className="accent-black w-3.5 h-3.5"
                            />
                            <span>Pension Exempt</span>
                          </label>
                          <label className="flex items-center gap-1.5 bg-white border p-2 rounded-lg cursor-pointer hover:bg-black/[0.02] select-none font-bold">
                            <input 
                              type="checkbox" 
                              checked={healthExempt} 
                              onChange={(e) => setHealthExempt(e.target.checked)}
                              className="accent-black w-3.5 h-3.5"
                            />
                            <span>Health Ins Exempt</span>
                          </label>
                        </div>

                        {/* Withholding overrides */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-black/45 block">Override Fed Tax (%)</label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder={(activeRegion.fedTaxRate * 100).toFixed(2) + '%'}
                              value={fedTaxRateOverride}
                              onChange={(e) => setFedTaxRateOverride(e.target.value)}
                              className="w-full bg-white border border-black/10 rounded-lg p-1.5 text-[10px] font-bold font-mono focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-black/45 block">Override Prov/State Tax (%)</label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder={(activeRegion.stateTaxRate * 100).toFixed(2) + '%'}
                              value={stateTaxRateOverride}
                              onChange={(e) => setStateTaxRateOverride(e.target.value)}
                              className="w-full bg-white border border-black/10 rounded-lg p-1.5 text-[10px] font-bold font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-black/45 block">Override Pension Rate (%)</label>
                            <input 
                              type="number"
                              min="0"
                              max="20"
                              step="0.001"
                              disabled={pensionExempt}
                              placeholder={(activeRegion.pensionRate * 100).toFixed(4) + '%'}
                              value={pensionRateOverride}
                              onChange={(e) => setPensionRateOverride(e.target.value)}
                              className="w-full bg-white border border-black/10 rounded-lg p-1.5 text-[10px] font-bold font-mono disabled:opacity-40 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-black/45 block">Override Health Rate (%)</label>
                            <input 
                              type="number"
                              min="0"
                              max="20"
                              step="0.001"
                              disabled={healthExempt}
                              placeholder={(activeRegion.healthRate * 100).toFixed(4) + '%'}
                              value={healthRateOverride}
                              onChange={(e) => setHealthRateOverride(e.target.value)}
                              className="w-full bg-white border border-black/10 rounded-lg p-1.5 text-[10px] font-bold font-mono disabled:opacity-40 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Year To Date multiplier slider */}
                    <div className="space-y-2 pt-2 border-t border-black/5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-black/50">YTD Period Aggregator</span>
                        <span className="font-mono font-bold text-white bg-black px-2 py-0.5 rounded-lg text-xs">
                          {ytdMultiplier} months (x{ytdMultiplier})
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="12"
                        value={ytdMultiplier}
                        onChange={(e) => {
                          setYtdMultiplier(Number(e.target.value));
                          triggerTone('click');
                        }}
                        className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                      <p className="text-[10px] text-black/40">Multiplies the current cycle's earnings, vacation payouts, and tax withholdings to generate realistic YTD Ledger cumulative values.</p>
                    </div>
                  </div>

                  {/* Performance-Based Tiered Wage Roadmap & Career Tracker */}
                  {paystubEmployeeId !== 'manual' && (() => {
                    const roadmap = getRoadmapDetailsForSelectedUser();
                    return (
                      <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase text-black/40 tracking-wider">Longevity & Career Growth</h4>
                          <span className="px-2 py-0.5 bg-zinc-100 border text-black font-mono font-bold text-[9px] rounded-full uppercase">
                            Active Plan
                          </span>
                        </div>

                        {/* Interactive Growth Inputs */}
                        <div className="grid grid-cols-2 gap-3 bg-black/[0.02] p-4 rounded-2xl border">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-black/50">Hiring Date</label>
                            <input
                              type="date"
                              value={activePayingUserHireDate}
                              onChange={(e) => {
                                setActivePayingUserHireDate(e.target.value);
                                triggerTone('click');
                              }}
                              className="w-full bg-white border border-black/10 rounded-xl px-2 py-1.5 text-xs font-bold font-mono outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-black/50 font-sans">Performance Class</label>
                            <select
                              value={activePayingUserRating}
                              onChange={(e) => {
                                setActivePayingUserRating(e.target.value as any);
                                triggerTone('click');
                              }}
                              className="w-full bg-white border border-black/10 rounded-xl px-2 py-1.5 text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="standard">Standard Growth ⏳</option>
                              <option value="excellent">Excellent - Fast 🚀</option>
                            </select>
                          </div>
                        </div>

                        {/* Calculated Statistics */}
                        <div className="grid grid-cols-2 gap-2 text-xs py-1 border-y border-black/5">
                          <div>
                            <span className="text-black/40 font-bold block">Assessed Tenure</span>
                            <span className="font-mono font-black text-black">{roadmap.diffMonths} months</span>
                          </div>
                          <div>
                            <span className="text-black/40 font-bold block">Current wage rate</span>
                            <span className="font-mono font-black text-zinc-600">${roadmap.currentWage.toFixed(2)}/hr</span>
                          </div>
                        </div>

                        {/* Visual SVG Timeline Roadmap */}
                        <div className="space-y-2 pt-2">
                          <p className="text-[10px] font-black uppercase text-black/40 tracking-wider">Career Progression Progress</p>
                          
                          <div className="relative pt-1">
                            {/* Line connecting nodes */}
                            <div className="absolute top-[18px] left-[10%] right-[10%] h-[3px] bg-zinc-200 z-0"></div>
                            <div 
                              className="absolute top-[18px] left-[10%] h-[3px] bg-emerald-500 transition-all duration-500 z-0"
                              style={{ 
                                width: activePayingUserRating === 'excellent'
                                  ? `${Math.min(80, (roadmap.diffMonths / 6) * 80)}%`
                                  : `${Math.min(80, (roadmap.diffMonths / 12) * 80)}%`
                              }}
                            ></div>

                            {/* Nodes */}
                            <div className="flex justify-between relative z-10">
                              {/* Tier 1 Node */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono text-[10px] font-bold ${
                                  roadmap.diffMonths >= 0 ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-white border-zinc-300 text-zinc-400'
                                }`}>
                                  $15
                                </div>
                                <span className="text-[8px] font-black uppercase mt-1">Hire</span>
                              </div>

                              {/* Tier 2 Node */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-zinc-400 font-mono font-bold">
                                  {activePayingUserRating === 'excellent' ? '1mo' : '3mo'}
                                </span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono text-[10px] font-bold transition-all ${
                                  (activePayingUserRating === 'excellent' ? roadmap.diffMonths >= 1 : roadmap.diffMonths >= 3)
                                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-110'
                                    : 'bg-white border-zinc-300 text-zinc-400'
                                }`}>
                                  $17
                                </div>
                                <span className="text-[8px] font-black uppercase mt-1">Promo</span>
                              </div>

                              {/* Tier 3 Node */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-zinc-400 font-mono font-bold">
                                  {activePayingUserRating === 'excellent' ? '6mo' : '1 yr'}
                                </span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono text-[10px] font-bold transition-all ${
                                  (activePayingUserRating === 'excellent' ? roadmap.diffMonths >= 6 : roadmap.diffMonths >= 12)
                                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-110'
                                    : 'bg-white border-zinc-300 text-zinc-400'
                                }`}>
                                  $20
                                </div>
                                <span className="text-[8px] font-black uppercase mt-1">Senior</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recommended summary banner & action button */}
                        <div className="mt-3 bg-zinc-50 border p-4 rounded-2xl flex flex-col gap-3">
                          <div className="space-y-1">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Milestone Assessed</h5>
                            <p className="text-xs font-black text-black">{roadmap.milestoneAchieved}</p>
                            <p className="text-[10px] text-black/50 leading-relaxed">{roadmap.milestoneDetails}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t text-xs">
                            <span className="font-bold text-zinc-500">Recommended base rate:</span>
                            <span className="font-mono font-black text-emerald-600">${roadmap.recommended.toFixed(2)}/hr</span>
                          </div>

                          {roadmap.needsWageBump && (
                            <motion.button
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              type="button"
                              disabled={isUpdatingWage}
                              onClick={() => handleApplyGrowthUpdate(roadmap.recommended)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 transition-all text-white font-black uppercase tracking-wider rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                            >
                              {isUpdatingWage ? (
                                <RefreshCw className="animate-spin" size={12} />
                              ) : (
                                <Award size={12} />
                              )}
                              Update profile standard rate to ${roadmap.recommended.toFixed(2)}/h
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* AI Cognitive Performance & Integrity Auditor panel */}
                  <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-black/40 tracking-wider">AI Cognitive Audit Enclave</h4>
                      <span className="px-2 py-0.5 bg-indigo-50 border text-indigo-600 font-mono font-bold text-[9px] rounded-full uppercase">
                        Gemini-3.5-Flash
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-black">Cognitive Performance & Integrity Compliance Checks</p>
                      <p className="text-[10px] text-black/50 leading-relaxed">
                        Assess barista craft longevity suggestions, quest milestones compliance logs, and run simulated FakeGPS attendance coordinate verification.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isAnalyzingAI}
                      onClick={() => handleTriggerAIAnalysis(paystubEmployeeId)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all text-white font-black uppercase tracking-wider rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {isAnalyzingAI ? (
                        <>
                          <RefreshCw className="animate-spin" size={12} />
                          Auditing employee records via server-side AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Run AI Performance & Anti-Fraud Audit
                        </>
                      )}
                    </button>

                    {aiAnalysisError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold leading-normal">
                        ⚠️ Error triggering AI: {aiAnalysisError}
                      </div>
                    )}

                    {aiAnalysisResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-zinc-50 border rounded-2xl space-y-2 text-xs text-zinc-700 leading-relaxed max-h-96 overflow-y-auto"
                      >
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span className="text-[10px] font-black uppercase text-zinc-500">Official AI Audit Decrypt</span>
                          <span className="text-[9px] font-mono text-zinc-400">Timestamp: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="whitespace-pre-wrap font-mono text-[10px] text-zinc-800 leading-normal border-l-2 border-indigo-500 pl-2.5">
                          {aiAnalysisResult}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Customizable Header Information details */}
                  <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase text-black/40 tracking-wider">Customize Header Details</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-black/40">Cheque Number</label>
                        <input 
                          type="text" 
                          value={chequeNumber} 
                          onChange={(e) => setChequeNumber(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-black/40">Cheque/Deposit Date</label>
                        <input 
                          type="date" 
                          value={chequeDate} 
                          onChange={(e) => setChequeDate(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-black/40">Period Start</label>
                        <input 
                          type="date" 
                          value={payPeriodStart} 
                          onChange={(e) => setPayPeriodStart(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-black/40">Period End</label>
                        <input 
                          type="date" 
                          value={payPeriodEnd} 
                          onChange={(e) => setPayPeriodEnd(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-black/40">Brand / Company Name</label>
                      <input 
                        type="text" 
                        value={employerName} 
                        onChange={(e) => setEmployerName(e.target.value)}
                        className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-black/40">Branch Street Address</label>
                        <input 
                          type="text" 
                          value={employerStreet} 
                          onChange={(e) => setEmployerStreet(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-black/40">Branch City & Postal Code</label>
                        <input 
                          type="text" 
                          value={employerCityStateZip} 
                          onChange={(e) => setEmployerCityStateZip(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                        />
                      </div>
                    </div>

                    {paystubEmployeeId === 'manual' && (
                      <>
                        <div className="space-y-1 pt-2 border-t border-black/5">
                          <label className="text-[9px] font-black uppercase text-black/40">Employee Name</label>
                          <input 
                            type="text" 
                            value={employeeName} 
                            onChange={(e) => setEmployeeName(e.target.value)}
                            className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase text-black/40">Employee Street</label>
                            <input 
                              type="text" 
                              value={employeeStreet} 
                              onChange={(e) => setEmployeeStreet(e.target.value)}
                              className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-black/40">Employee City/Postal</label>
                            <input 
                              type="text" 
                              value={employeeCityStateZip} 
                              onChange={(e) => setEmployeeCityStateZip(e.target.value)}
                              className="w-full bg-black/5 rounded-xl p-2.5 text-xs font-bold border-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* Right Column: High-Fidelity Paper Paystub Box (7 Cols) */}
                <div id="cheque-print-root" className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[36px] border border-black/10 shadow-md space-y-6">
                  
                  {/* Internal Controls for printer */}
                  <div className="flex justify-between items-center border-b border-black/5 pb-4">
                    <span className="text-xs text-black/40 font-bold flex items-center gap-2">
                      <FileText size={14} className="text-[#E07A5F]" /> HIGH FIDELITY CRA/IRS AUDIT MODEL
                    </span>
                    <button
                      onClick={handleExportPaystubPDF}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow"
                    >
                      <Printer size={13} /> Export Real PDF Paystub
                    </button>
                  </div>

                  {/* Print Target Slip Container */}
                  <div id="paystub-print-slip" className="printable-only-section p-6 bg-white border border-black rounded-lg font-mono text-xs text-black space-y-8 select-all relative overflow-x-auto min-w-[500px]">
                    
                    {/* Upper Addresses Grid */}
                    <div className="grid grid-cols-2 gap-4 items-start leading-tight">
                      {/* Employer Details */}
                      <div className="space-y-1 uppercase font-bold text-[11px]">
                        <div>{employerName}</div>
                        <div>{employerStreet}</div>
                        <div>{employerCityStateZip}</div>
                      </div>

                      {/* Employee Details */}
                      <div className="space-y-1 uppercase font-bold text-[11px] text-right md:text-left md:ml-12">
                        <div>{employeeName}</div>
                        <div>{employeeStreet}</div>
                        <div>{employeeCityStateZip}</div>
                      </div>
                    </div>

                    {/* Pay Stub Details row */}
                    <div className="border-t-2 border-b-2 border-black py-2.5 grid grid-cols-4 gap-2 text-[10px] uppercase font-bold leading-none">
                      <div>
                        <span className="block text-[8px] text-zinc-500 mb-1">Receipt Form</span>
                        Employee Paystub
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-500 mb-1">Cheque Number</span>
                        {chequeNumber}
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-500 mb-1">Pay Period Range</span>
                        {payPeriodStart} - {payPeriodEnd}
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-500 mb-1">Cheque Date</span>
                        {chequeDate}
                      </div>
                    </div>

                    {/* Employee & Occupation display */}
                    <div className="grid grid-cols-2 border-b-2 border-black pb-2.5 text-[10px] uppercase font-bold leading-normal">
                      <div>
                        <span className="block text-[8px] text-zinc-500 mb-0.5">Employee Name & Address</span>
                        <div className="max-w-[280px] break-words">{employeeName}, {employeeStreet}, {employeeCityStateZip}</div>
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-500 mb-0.5">Occupation Description</span>
                        <div>{employeeOccupation}</div>
                      </div>
                    </div>

                    {/* Table-1: Earnings and Hours */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-5 font-bold text-[10px] uppercase border-b border-black pb-1">
                        <div className="col-span-2">Earnings and Hours</div>
                        <div className="text-right">Qty</div>
                        <div className="text-right">Rate</div>
                        <div className="text-right">Current</div>
                        <div className="text-right">YTD Amount</div>
                      </div>

                      {/* Salary Row */}
                      <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold">
                        <div className="col-span-2">Salary / Regular Wage</div>
                        <div className="text-right">{formatHourQty(paystubHours)}</div>
                        <div className="text-right">{paystubHourlyRate.toFixed(2)}</div>
                        <div className="text-right">{activeRegion.currency}{totals.regularGross.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-right">{activeRegion.currency}{totals.ytdRegular.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>

                      {/* Vacation pay row */}
                      {totals.vacPayAmount > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold">
                          <div className="col-span-2">VacPay-Paid Out ({activeRegion.vacationPayRate * 100}%)</div>
                          <div className="text-right">--</div>
                          <div className="text-right">--</div>
                          <div className="text-right">{activeRegion.currency}{totals.vacPayAmount.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right">{activeRegion.currency}{totals.ytdVac.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Gamified Quest Bonus row */}
                      {totals.gameBonus > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold text-emerald-700">
                          <div className="col-span-2 flex items-center gap-1">🏆 Quest Cash Bonus</div>
                          <div className="text-right">--</div>
                          <div className="text-right">--</div>
                          <div className="text-right">+{activeRegion.currency}{totals.gameBonus.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right">+{activeRegion.currency}{totals.ytdGameBonus.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Custom Bonus */}
                      {paystubCustomBonus > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold text-emerald-700">
                          <div className="col-span-2 flex items-center gap-1">Additional Base Bonus</div>
                          <div className="text-right">--</div>
                          <div className="text-right">--</div>
                          <div className="text-right">+{activeRegion.currency}{paystubCustomBonus.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right">+{activeRegion.currency}{(paystubCustomBonus * ytdMultiplier).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Individual Dynamic Ledger Bonuses */}
                      {paystubBonuses.map(b => (
                        <div key={b.id} className="grid grid-cols-5 text-[11px] py-0.5 font-semibold text-emerald-700">
                          <div className="col-span-2 flex items-center gap-1">🎁 {b.category} Bonus ({b.description})</div>
                          <div className="text-right">--</div>
                          <div className="text-right">--</div>
                          <div className="text-right">+{activeRegion.currency}{b.amount.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right">+{activeRegion.currency}{(b.amount * ytdMultiplier).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      ))}

                      {/* Custom Allowances */}
                      {paystubCustomAllowance > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold text-emerald-700">
                          <div className="col-span-2 flex items-center gap-1">Base Allowance</div>
                          <div className="text-right">--</div>
                          <div className="text-right">--</div>
                          <div className="text-right">+{activeRegion.currency}{paystubCustomAllowance.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right">+{activeRegion.currency}{(paystubCustomAllowance * ytdMultiplier).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Individual Dynamic Ledger Allowances */}
                      {paystubAllowances.map(a => (
                        <div key={a.id} className="grid grid-cols-5 text-[11px] py-0.5 font-semibold text-emerald-700">
                          <div className="col-span-2 flex items-center gap-1">🚗 {a.category} Allowance ({a.description})</div>
                          <div className="text-right">--</div>
                          <div className="text-right">--</div>
                          <div className="text-right">+{activeRegion.currency}{a.amount.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right">+{activeRegion.currency}{(a.amount * ytdMultiplier).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      ))}

                      {/* Total Earnings Border Row */}
                      <div className="grid grid-cols-5 font-bold text-[11px] border-t border-black pt-1">
                        <div className="col-span-2">Total Gross Earnings</div>
                        <div className="text-right">{formatHourQty(paystubHours)}</div>
                        <div className="text-right">--</div>
                        <div className="text-right">{activeRegion.currency}{totals.totalGross.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-right">{activeRegion.currency}{totals.ytdGross.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>

                    {/* Table-2: Withholdings Deductions */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-5 font-bold text-[10px] uppercase border-b border-black pb-1">
                        <div className="col-span-3">Withholdings Deductions</div>
                        <div className="text-right">Current</div>
                        <div className="text-right">YTD Amount</div>
                      </div>

                      {/* Pension CPP row */}
                      {totals.pensionDeduction > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold">
                          <div className="col-span-3">{activeRegion.pensionName} ({(activeRegion.pensionRate * 100).toFixed(3)}%)</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.pensionDeduction.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.ytdPension.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Employment Insurance row */}
                      {totals.healthDeduction > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold">
                          <div className="col-span-3">{activeRegion.healthName} ({(activeRegion.healthRate * 100).toFixed(3)}%)</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.healthDeduction.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.ytdHealth.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Fed tax row */}
                      {totals.fedDeduction > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold">
                          <div className="col-span-3">Federal Income Tax Withholding</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.fedDeduction.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.ytdFed.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Provincial/State tax row */}
                      {totals.stateDeduction > 0 && (
                        <div className="grid grid-cols-5 text-[11px] py-0.5 font-semibold">
                          <div className="col-span-3">{activeRegion.country === "USA" ? "State" : "Provincial"} Income Tax</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.stateDeduction.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-right text-red-600">-{activeRegion.currency}{totals.ytdState.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}

                      {/* Total Deductions row */}
                      <div className="grid grid-cols-5 font-bold text-[11px] border-t border-black pt-1">
                        <div className="col-span-3">Total Tax & Source Deductions</div>
                        <div className="text-right text-red-700">-{activeRegion.currency}{totals.totalWithholdings.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-right text-red-700">-{activeRegion.currency}{totals.ytdWithholdings.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>

                    {/* Table-3: Net payout */}
                    <div className="border-t-2 border-b-2 border-black py-2 grid grid-cols-5 font-black text-xs uppercase leading-none">
                      <div className="col-span-3 text-sm">Net Pay Disbursed</div>
                      <div className="text-right text-sm text-emerald-800 bg-[#E8F5E9] px-1 py-0.5 rounded font-bold">
                        {activeRegion.currency}{totals.netEarning.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-right text-sm text-emerald-900 bg-[#E8F5E9] px-1 py-0.5 rounded font-bold">
                        {activeRegion.currency}{totals.ytdNet.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Bottom disclaimer */}
                    <div className="text-[8px] text-zinc-400 font-bold tracking-tight pt-2 leading-tight">
                      NOTICE: This document is configured for verification audits. All withholding values represent standard deductions required by the {activeRegion.country} National Revenue guidelines. Produced securely via Calgary Coffee Staff Personnel portal.
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ADD CUSTOM GLOBAL REGION MODAL DIALOG */}
      {showAddRegionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] border border-black/10 shadow-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                <Globe size={20} className="text-[#E07A5F]" /> Add New Operational Region
              </h3>
              <button 
                onClick={() => {
                  triggerTone('click');
                  setShowAddRegionModal(false);
                }}
                className="text-zinc-400 hover:text-black font-bold p-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddRegion} className="space-y-4 text-xs font-bold text-black/70">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] b block uppercase text-zinc-500">Short Code (e.g. VN, NZ, AU-NSW)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Short code" 
                    value={newRegId} 
                    onChange={e => setNewRegId(e.target.value.toUpperCase())}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black placeholder:text-zinc-400 uppercase text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Local Area Name (e.g. Vietnam, Auckland)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Area location" 
                    value={newRegName} 
                    onChange={e => setNewRegName(e.target.value)}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black placeholder:text-zinc-400 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Country Group</label>
                  <input 
                    type="text" 
                    value={newRegCountry} 
                    onChange={e => setNewRegCountry(e.target.value)}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Currency Symbol</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. ₫ or £" 
                    value={newRegCurrency} 
                    onChange={e => setNewRegCurrency(e.target.value)}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black font-semibold text-center text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Hourly Min Wage</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={newRegMinWage} 
                    onChange={e => setNewRegMinWage(Number(e.target.value))}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5">
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Federal Tax Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    value={newRegFedTax} 
                    onChange={e => setNewRegFedTax(Number(e.target.value))}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Local / Provincial Tax (%)</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    value={newRegStateTax} 
                    onChange={e => setNewRegStateTax(Number(e.target.value))}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <label className="text-[10px] block uppercase text-zinc-500">Pension Scheme Label (eg. Social Security, CPP)</label>
                <input 
                  type="text" 
                  value={newRegPensionName} 
                  onChange={e => setNewRegPensionName(e.target.value)}
                  className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Pension Levy rate (%)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    value={newRegPensionRate} 
                    onChange={e => setNewRegPensionRate(Number(e.target.value))}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase text-zinc-500">Vacation Pay Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={newRegVacRate} 
                    onChange={e => setNewRegVacRate(Number(e.target.value))}
                    className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <label className="text-[10px] block uppercase text-zinc-500">Health / Insurance Scheme Label (eg. Medicare, EI)</label>
                <input 
                  type="text" 
                  value={newRegHealthName} 
                  onChange={e => setNewRegHealthName(e.target.value)}
                  className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] block uppercase text-zinc-500">Health Levy rate (%)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  value={newRegHealthRate} 
                  onChange={e => setNewRegHealthRate(Number(e.target.value))}
                  className="w-full bg-black/5 rounded-xl p-3 border-none text-black text-xs"
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    triggerTone('click');
                    setShowAddRegionModal(false);
                  }}
                  className="py-3 bg-black/5 text-zinc-600 hover:bg-black/10 rounded-xl text-center active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-black uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  Confirm Region
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
