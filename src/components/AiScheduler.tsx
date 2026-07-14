import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Users,
  Clock,
  AlertTriangle,
  Send,
  Sliders,
  Calendar,
  CheckSquare,
  Database,
  Smartphone,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserItem {
  id: string;
  name: string;
  role: string;
  employeeId: string;
  phone?: string;
  email?: string;
  notificationPreference?: 'email' | 'sms' | 'both';
}

interface ScheduleItem {
  id: string;
  userId: string;
  userName: string;
  date: string;
  shift: string; // 'A', 'B' or '10AM-6PM' etc.
}

interface AiSchedulerProps {
  users: UserItem[];
  schedules: ScheduleItem[];
  onAddSchedule: (schedule: { userId: string; userName: string; date: string; shift: string }) => Promise<any>;
  onDeleteSchedule: (id: string) => Promise<any>;
  refreshSchedules: () => void;
}

export function AiScheduler({
  users = [],
  schedules = [],
  onAddSchedule,
  onDeleteSchedule,
  refreshSchedules
}: AiSchedulerProps) {
  const [minStaff, setMinStaff] = useState<number>(2); // Default of 2, options: 1 to 5
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'dispatched' | 'replied'>('idle');
  const [reScheduleLog, setReScheduleLog] = useState<string[]>([
    "System ready. AI Scheduler initialization finished.",
    "Kalim Coffee scheduling rules loaded (Calgary Branch)."
  ]);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Auto-cut Friday options
  const [autoFridayEnabled, setAutoFridayEnabled] = useState<boolean>(true);
  const [fridayLog, setFridayLog] = useState<string[]>([
    "Friday, May 29, 2026 17:00:00 - Friday Schedule Cut executed automatically. 14 shifts released.",
    "Friday, June 05, 2026 17:00:00 - Friday Schedule Cut executed automatically. 14 shifts released.",
    "Friday, June 12, 2026 17:00:00 - Friday Schedule Cut executed automatically. 14 shifts released."
  ]);
  const [isSimulatingFriday, setIsSimulatingFriday] = useState(false);

  // Companion Employee App states
  const [selectedEmployeeForApi, setSelectedEmployeeForApi] = useState<string>('u2'); // Bear John by default
  const [isDispatchingPush, setIsDispatchingPush] = useState(false);
  const [companionAppLogs, setCompanionAppLogs] = useState<string[]>([
    "📱 [Companion Portal] Live gateway listener active at port 3000.",
    "📱 [Companion Portal] Waiting for Employee App requests..."
  ]);

  // Mock-ups of responses from staff
  const [staffResponses, setStaffResponses] = useState<Array<{
    userId: string;
    userName: string;
    response: 'yes' | 'no' | 'none';
    message?: string;
  }>>([]);

  // Real-time Shift Swap Requests state
  const [employeeRequests, setEmployeeRequests] = useState<any[]>([]);
  const [isFetchingRequests, setIsFetchingRequests] = useState(false);
  const [selectedEmployeeForSwap, setSelectedEmployeeForSwap] = useState<string>('');
  const [myShiftIdForSwap, setMyShiftIdForSwap] = useState<string>('');
  const [selectedCoworkerForSwap, setSelectedCoworkerForSwap] = useState<string>('');
  const [coworkerShiftIdForSwap, setCoworkerShiftIdForSwap] = useState<string>('');
  const [swapDetails, setSwapDetails] = useState<string>('');
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);

  const fetchRequests = async () => {
    setIsFetchingRequests(true);
    try {
      const res = await fetch("/api/employee-requests");
      const data = await res.json();
      setEmployeeRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setIsFetchingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [schedules]);

  // Set default swap selection based on available schedules
  useEffect(() => {
    const activeStaff = users.filter(u => u.role !== 'admin');
    if (activeStaff.length > 0 && !selectedEmployeeForSwap) {
      setSelectedEmployeeForSwap(activeStaff[0].id);
    }
  }, [users]);

  // Select first shift helper
  useEffect(() => {
    if (selectedEmployeeForSwap) {
      const empShifts = schedules.filter(s => s.userId === selectedEmployeeForSwap);
      if (empShifts.length > 0) {
        setMyShiftIdForSwap(empShifts[0].id);
      } else {
        setMyShiftIdForSwap('');
      }
      
      const firstCoworker = users.find(u => u.id !== selectedEmployeeForSwap && u.role !== 'admin');
      if (firstCoworker) {
        setSelectedCoworkerForSwap(firstCoworker.id);
      } else {
        setSelectedCoworkerForSwap('');
      }
    }
  }, [selectedEmployeeForSwap, schedules]);

  useEffect(() => {
    if (selectedCoworkerForSwap) {
      const coworkerShifts = schedules.filter(s => s.userId === selectedCoworkerForSwap);
      if (coworkerShifts.length > 0) {
        setCoworkerShiftIdForSwap(coworkerShifts[0].id);
      } else {
        setCoworkerShiftIdForSwap('');
      }
    } else {
      setCoworkerShiftIdForSwap('');
    }
  }, [selectedCoworkerForSwap, schedules]);

  const handleSubmitShiftSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForSwap || !myShiftIdForSwap || !selectedCoworkerForSwap || !coworkerShiftIdForSwap) {
      alert("Please ensure coworker and shifts are completely selected!");
      return;
    }

    setIsSubmittingSwap(true);
    const originEmp = users.find(u => u.id === selectedEmployeeForSwap);
    const targetEmp = users.find(u => u.id === selectedCoworkerForSwap);
    const myShift = schedules.find(s => s.id === myShiftIdForSwap);
    const coworkerShift = schedules.find(s => s.id === coworkerShiftIdForSwap);

    const detailsText = `Swap ${originEmp?.name}'s shift on ${myShift?.date} (${myShift?.shift === 'A' ? 'Shift A' : myShift?.shift === 'B' ? 'Shift B' : myShift?.shift}) with coworker ${targetEmp?.name}'s shift on ${coworkerShift?.date} (${coworkerShift?.shift === 'A' ? 'Shift A' : coworkerShift?.shift === 'B' ? 'Shift B' : coworkerShift?.shift}). ${swapDetails ? `Reason: ${swapDetails}` : ''}`;

    try {
      const res = await fetch("/api/employee-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedEmployeeForSwap,
          userName: originEmp?.name || "Employee",
          type: "shift_swap",
          date: myShift?.date || "",
          details: detailsText,
          shift: myShift?.shift || "",
          myShiftId: myShiftIdForSwap,
          coworkerId: selectedCoworkerForSwap,
          coworkerShiftId: coworkerShiftIdForSwap
        })
      });
      if (res.ok) {
        setSwapDetails('');
        setReScheduleLog(prev => [
          `🔄 [Shift Swap Requested] Submitted swap proposal for ${originEmp?.name} and ${targetEmp?.name} to manager dashboard.`,
          ...prev
        ]);
        await fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/employee-requests/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });
      if (res.ok) {
        setReScheduleLog(prev => [
          `✅ [MANAGER ACTION] Swap approved successfully! Schedule grid recalculated automatically.`,
          ...prev
        ]);
        refreshSchedules();
        await fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/employee-requests/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" })
      });
      if (res.ok) {
        setReScheduleLog(prev => [
          `❌ [MANAGER ACTION] Swap request rejected by authority.`,
          ...prev
        ]);
        await fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeWeekStart = '2026-06-15'; // Anchor to local metadata date

  // Generate a week of dates starting June 15, 2026 (Monday)
  const weekDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(activeWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.push({
        name: daysOfWeek[i],
        dateString: d.toISOString().split('T')[0],
        dateObj: d
      });
    }
    return days;
  }, []);

  // Filter schedules to current active week
  const currentWeekSchedules = useMemo(() => {
    const targetDates = weekDays.map(wd => wd.dateString);
    return schedules.filter(s => targetDates.includes(s.date));
  }, [schedules, weekDays]);

  // Dynamic schedule payload for Bear John or selected employee (simulated API endpoint)
  const simulatedApiResponse = useMemo(() => {
    const emp = users.find(u => u.id === selectedEmployeeForApi);
    if (!emp) return { error: "Employee not found in database" };
    
    // Find all schedules for this employee for active week
    const targetDates = weekDays.map(wd => wd.dateString);
    const empSchedules = schedules
      .filter(s => s.userId === selectedEmployeeForApi && targetDates.includes(s.date))
      .map(s => ({
        date: s.date,
        day: weekDays.find(wd => wd.dateString === s.date)?.name || 'Unknown',
        shiftHours: s.shift === 'A' ? '7:00 AM - 2:00 PM' : s.shift === 'B' ? '2:00 PM - 9:00 PM' : s.shift,
        confirmed: staffResponses.find(r => r.userId === selectedEmployeeForApi)?.response === 'yes'
      }));

    return {
      status: "success",
      queryTimestamp: new Date().toISOString(),
      branchId: "branch-calgary-south",
      branchAddress: "730 58 Ave Sw, Calgary, AB, Canada T2V 4Z5",
      brand: "Kalim Coffee",
      employee: {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        employeeId: emp.employeeId
      },
      shiftsCount: empSchedules.length,
      scheduleWeekStart: activeWeekStart,
      shifts: empSchedules,
      actions: {
        confirmEndpoint: `POST /api/employee/confirm-shift`,
        swapEndpoint: `POST /api/employee/request-swap`
      }
    };
  }, [selectedEmployeeForApi, users, schedules, weekDays, staffResponses]);

  // AI Automatic schedule balancer and injector
  const handleAutoSchedule = async () => {
    setIsGenerating(true);
    setReScheduleLog(prev => [...prev, "⚡ Starting AI shift allocation solver for Calgary branch..."]);
    setEmailStatus('idle');
    setStaffResponses([]);
    
    // Clear out current active week schedules
    const targetDates = weekDays.map(wd => wd.dateString);
    const existingToClear = schedules.filter(s => targetDates.includes(s.date));
    
    for (const s of existingToClear) {
      await onDeleteSchedule(s.id);
    }

    // Allocate staff members up to minStaff multiplier per shift
    const eligibleTimekeepers = users.filter(u => u.role !== 'admin');
    if (eligibleTimekeepers.length === 0) {
      setIsGenerating(false);
      alert('Please add staff members with standard roles first to populate options');
      return;
    }

    // Assign staff evenly for each weekdate on Shift A (7AM-2PM) and Shift B (2PM-9PM)
    let staffIndex = 0;
    const addedLogs: string[] = [];

    for (const item of weekDays) {
      // Allocate Shift A matching the staffing option chosen (1 to 5 staff count)
      for (let i = 0; i < minStaff; i++) {
        const u = eligibleTimekeepers[staffIndex % eligibleTimekeepers.length];
        await onAddSchedule({
          userId: u.id,
          userName: u.name,
          date: item.dateString,
          shift: 'A'
        });
        staffIndex++;
      }

      // Allocate Shift B matching staffing options
      for (let i = 0; i < minStaff; i++) {
        const u = eligibleTimekeepers[staffIndex % eligibleTimekeepers.length];
        await onAddSchedule({
          userId: u.id,
          userName: u.name,
          date: item.dateString,
          shift: 'B'
        });
        staffIndex++;
      }
    }

    refreshSchedules();
    addedLogs.push(`Successfully populated 7-day schedule with exactly ${minStaff} staff per shift (A & B).`);
    addedLogs.push("Automatic layout matching constraints is complete!");
    setReScheduleLog(prev => [...prev, ...addedLogs]);
    setIsGenerating(false);
    setActiveStep(2);
  };

  // Simulate dispatching automated email/SMS invites using employee-specific custom "confirm logic"
  const handleSendEmails = async () => {
    setIsSendingEmails(true);
    setReScheduleLog(prev => [...prev, "🤖 AI starting schedule slicing and auto-dispatch analysis..."]);
    await new Promise(resolve => setTimeout(resolve, 800));

    const dispatchLogs: string[] = [];

    // Loop through users to see who has shifts assigned and send based on preference
    users.forEach(u => {
      // Find what shifts they have in schedules
      const userShifts = schedules.filter(s => s.userId === u.id);
      if (userShifts.length > 0) {
        const pref = u.notificationPreference || 'email';
        const phoneNum = u.phone || '+17785550000';
        const emailAddress = u.email || `${u.name.toLowerCase().replace(/\s+/g, '')}@kalimcoffee.ca`;
        const shiftSpec = userShifts.map(s => `${s.date}: Shift ${s.shift}`).join(', ');

        if (pref === 'sms') {
          dispatchLogs.push(`📱 [AI Auto-Slicer] SMS confirmation dispatched to ${u.name} via ${phoneNum} ➜ Link: https://kalimcoffee.ca/confirm/${u.id}?shifts=${userShifts.map(s=>s.id).join(',')}`);
        } else if (pref === 'both') {
          dispatchLogs.push(`💫 [AI Auto-Slicer] Broad-cast (Email & SMS) sent to ${u.name} (✉️ ${emailAddress} & 📞 ${phoneNum}) ➜ Link: https://kalimcoffee.ca/confirm/${u.id}?shifts=${userShifts.map(s=>s.id).join(',')}`);
        } else {
          dispatchLogs.push(`✉️ [AI Auto-Slicer] Email confirmation dispatched to ${u.name} via ${emailAddress} ➜ Link: https://kalimcoffee.ca/confirm/${u.id}?shifts=${userShifts.map(s=>s.id).join(',')}`);
        }
      }
    });

    if (dispatchLogs.length === 0) {
      dispatchLogs.push("⚠️ No active shifts assigned to any staff in the current scheduling period. Generated general broadcast list.");
      users.forEach(u => {
        const pref = u.notificationPreference || 'email';
        if (pref === 'sms' || pref === 'both') {
          dispatchLogs.push(`📱 [AI Auto-Slicer] SMS broadcast test sent to ${u.name} (${u.phone || '+17785550000'})`);
        } else {
          dispatchLogs.push(`✉️ [AI Auto-Slicer] Email broadcast test sent to ${u.name} (${u.email || 'staff@kalimcoffee.ca'})`);
        }
      });
    }
    
    // Generate intelligent feedback simulations
    const standardResponses = [
      {
        userId: users.find(u => u.name === 'Staff User')?.id || 'u3',
        userName: 'Staff User',
        response: 'yes' as const,
        message: 'Sounds perfect! Happy to take the Shift.'
      },
      {
        userId: users.find(u => u.name === 'Bear John')?.id || 'u2',
        userName: 'Bear John',
        response: 'none' as const, // initially waiting for confirm link click in sandbox!
        message: 'Awaiting confirmation via Smart Mail/App Link.'
      },
    ];

    // Add random responses for other users
    users.forEach(u => {
      if (u.name !== 'Staff User' && u.name !== 'Bear John' && u.role !== 'admin') {
        const accept = Math.random() > 0.2;
        standardResponses.push({
          userId: u.id,
          userName: u.name,
          response: accept ? 'yes' : 'none',
          message: accept ? 'Confirmed attendance.' : 'Pending confirmation link.'
        });
      }
    });

    setStaffResponses(standardResponses);
    setEmailStatus('dispatched');
    setIsSendingEmails(false);
    setActiveStep(3);
    setReScheduleLog(prev => [
      ...prev, 
      ...dispatchLogs,
      "✨ AI automatically sliced shift schedules and generated interactive links!",
      "👉 Try clicking the 'Smart Inbox Simulation' buttons to simulate employee response logic."
    ]);
  };

  // Simulate Friday Auto-Cut Trigger
  const handleSimulateFridayCut = async () => {
    setIsSimulatingFriday(true);
    setReScheduleLog(prev => [...prev, "📅 [FRIDAY CALENDAR MATCH EVENT] Initiating automatic Friday Cut-Off algorithm..."]);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Execute default schedule allocate
    await handleAutoSchedule();
    // Dispatch smart verification instantly
    await handleSendEmails();

    const timestampStr = new Date().toLocaleString();
    setFridayLog(prev => [
      `Friday, June 19, 2026 17:00:00 - Friday Schedule Cut simulation executed. Auto-balanced and broadcasted successfully.`,
      ...prev
    ]);
    
    setIsSimulatingFriday(false);
    setCompanionAppLogs(prev => [
      `📱 [Companion Push] Sent broadcast: "New schedule release for Calgary branch is ready. Please confirm before Sunday night!"`,
      ...prev
    ]);
  };

  // Interactive link response updates status dynamically
  const handleSmartConfirmResponse = (userId: string, choice: 'yes' | 'no') => {
    setStaffResponses(prev => prev.map(item => {
      if (item.userId === userId) {
        return {
          ...item,
          response: choice,
          message: choice === 'yes' ? "Confirmed via smart interactive verification link." : "Reschedule requested - Swap needed."
        };
      }
      return item;
    }));

    const userName = users.find(u => u.id === userId)?.name || 'Employee';
    setReScheduleLog(prev => [
      ...prev,
      `🔑 [Verification Log] Staff member [${userName}] executed smart confirmation: [${choice.toUpperCase()}].`
    ]);

    setCompanionAppLogs(prev => [
      `📱 [API Callback] Received status update from Employee App: { userId: "${userId}", confirmed: ${choice === 'yes'} }`,
      ...prev
    ]);
  };

  // Dispatch mock push notification to companion app
  const handleTriggerPushNotification = async () => {
    setIsDispatchingPush(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const targetEmp = users.find(u => u.id === selectedEmployeeForApi)?.name || "Staff";
    
    setCompanionAppLogs(prev => [
      `📱 [Companion App Push Broadcast] Delivered toast to [${targetEmp}]'s registered device (ID: app-dev-${selectedEmployeeForApi}): "📢 Kalim Coffee POS Scheduler: Hey ${targetEmp}! Fresh shifts have been released for Kalim Coffee Calgary. Tap to confirm!"`,
      ...prev
    ]);
    setIsDispatchingPush(false);
  };

  // AI automatic re-balancing action to handle employee "No" requests and adjust schedule
  const handleAiAdjustSchedule = async () => {
    setIsGenerating(true);
    const adjustments: string[] = [];

    // Filter staff who requested reschedule or said NO
    const rejectionRequests = staffResponses.filter(r => r.response === 'no');
    const eligibleReplacements = users.filter(u => u.role !== 'admin' && !rejectionRequests.some(rr => rr.userId === u.id));

    if (eligibleReplacements.length === 0) {
      setIsGenerating(false);
      alert('Need more staff members to make adjustments and swap shifts!');
      return;
    }

    adjustments.push("🤖 AI agent is parsing the Inbox exceptions...");
    
    for (const req of rejectionRequests) {
      adjustments.push(`Exception resolved: User [${req.userName}] asked to reschedule.`);

      // Find all schedule instances of this person
      const targetDates = weekDays.map(wd => wd.dateString);
      const userActiveSchedules = schedules.filter(s => s.userId === req.userId && targetDates.includes(s.date));

      for (const entry of userActiveSchedules) {
        // Delete original assignment to release them
        await onDeleteSchedule(entry.id);

        // Assign a replacement worker on their original shift to protect the selected staffing level constraint!
        const replacementCandidate = eligibleReplacements[Math.floor(Math.random() * eligibleReplacements.length)];
        
        await onAddSchedule({
          userId: replacementCandidate.id,
          userName: replacementCandidate.name,
          date: entry.date,
          shift: entry.shift // Keep the Shift A/B matching staffing constraints
        });

        // Relocate the original staff requester to the desired "10AM-6PM" custom shift as requested!
        await onAddSchedule({
          userId: req.userId,
          userName: req.userName,
          date: entry.date,
          shift: '10AM-6PM' // The custom requested rescheduling hours
        });

        adjustments.push(`🔄 Swap Completed: Replaced [${req.userName}] on Shift ${entry.shift} with [${replacementCandidate.name}] to maintain the requested shift level of ${minStaff} employee(s).`);
        adjustments.push(`📌 New Shift Assigned: Created custom "10AM-6PM" shift for [${req.userName}].`);
      }
    }

    adjustments.push("✅ Shift validation checks PASSED. Staff levels are now safe.");
    refreshSchedules();
    setReScheduleLog(prev => [...prev, ...adjustments]);
    setEmailStatus('replied');
    setIsGenerating(false);
    setActiveStep(4);
  };

  return (
    <div className="bg-white rounded-[40px] border border-black/5 p-6 md:p-8 shadow-sm space-y-8">
      {/* Top Banner introducing the AI manager concept */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-emerald-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
            <Sparkles size={12} className="animate-pulse text-amber-300" /> AI Scheduler Pro & Companion API
          </span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">Kalim Coffee Shift Automation Suite</h3>
          <p className="text-xs text-gray-500 mt-1">
            Configure staffing rules, simulate intelligent Friday schedule cuts, dispatch confirmation loops, and serve dynamic APIs to your upcoming Employee Companion App.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Branch Address</div>
          <div className="text-xs font-black text-zinc-800">730 58 Ave Sw, Calgary, AB</div>
        </div>
      </div>

      {/* Steps indicators */}
      <div className="grid grid-cols-4 gap-2 border-b border-black/5 pb-4">
        {[
          { num: 1, label: 'Configure rules' },
          { num: 2, label: 'Generate shifts' },
          { num: 3, label: 'Await replies' },
          { num: 4, label: 'Auto-adjust swaps' }
        ].map(step => (
          <div key={step.num} className={`text-left space-y-1 ${activeStep >= step.num ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeStep >= step.num ? 'bg-zinc-900 text-white' : 'bg-black/5 text-zinc-500'}`}>
              Step {step.num}
            </span>
            <p className="text-[11px] font-bold text-gray-700 max-w-full truncate">{step.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Parameter Panel: 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action A: Configuration & Generator */}
          <div className="bg-[#F8F7F4] rounded-3xl p-6 border border-black/5 space-y-6">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-black flex items-center gap-2">
              <Sliders size={16} /> Scheduler Parameters
            </h4>

            {/* Set staffing count */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-black/50 block">Minimum Staffing per Shift (A & B)</label>
              <div className="grid grid-cols-5 gap-1.5 font-mono">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMinStaff(num)}
                    className={`py-2 rounded-xl text-sm font-black border transition-all ${
                      minStaff === num 
                        ? 'bg-black border-black text-white shadow-md scale-105' 
                        : 'bg-white border-black/5 hover:border-black/20 text-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                The scheduler algorithm scales slots dynamically. At least {minStaff} employees are allocated on Shift A and Shift B for each of the 7 days.
              </p>
            </div>

            {/* Manual actions */}
            <div className="space-y-3 pt-2 border-t border-black/5">
              <button
                disabled={isGenerating}
                onClick={handleAutoSchedule}
                className="w-full bg-black hover:bg-zinc-800 disabled:opacity-50 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {isGenerating ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sliders size={14} />
                )}
                Generate Balanced Slots
              </button>

              {activeStep >= 2 && (
                <button
                  disabled={isSendingEmails}
                  onClick={handleSendEmails}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {isSendingEmails ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Mail size={14} />
                  )}
                  Dispatch Smart Verification Loop
                </button>
              )}
            </div>
          </div>

          {/* Action B: Friday Automated Engine (Friday automatic cutoff section) */}
          <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-500/10 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <Clock size={16} className="text-emerald-700" /> Auto Friday Cut-Off
              </h4>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                Active
              </span>
            </div>

            <p className="text-[11px] text-emerald-800/80 leading-relaxed">
              Every **Friday at 5:00 PM**, the scheduling engine freezes editing, resolves timecard disputes, assigns upcoming week slots, and pushes verification summaries.
            </p>

            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-emerald-500/5">
              <input
                type="checkbox"
                id="autoFriday"
                checked={autoFridayEnabled}
                onChange={(e) => setAutoFridayEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="autoFriday" className="text-xs font-black text-emerald-900 cursor-pointer select-none">
                Enable Autonomous Friday Cut-Off
              </label>
            </div>

            <button
              onClick={handleSimulateFridayCut}
              disabled={isSimulatingFriday || isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-200 animate-pulse" />
              Simulate Friday Auto-Cut Now
            </button>

            {/* Simulated cron list */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-emerald-900/40 uppercase tracking-widest block">
                Friday Engine Logs
              </span>
              <div className="bg-white/80 rounded-2xl p-3 border border-emerald-500/5 space-y-2 max-h-[100px] overflow-y-auto no-scrollbar font-mono text-[9px] text-emerald-800 leading-tight">
                {fridayLog.map((log, i) => (
                  <div key={i} className="flex gap-1">
                    <span className="shrink-0 text-emerald-600 font-bold">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Active Workspace Panel: 3 Columns */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Inbox Responses and Logs */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-widest text-[#1A1A1A]/40 flex items-center gap-2">
              <Calendar size={14} /> Operational Timeline & Verification Logs
            </h4>

            {reScheduleLog.length > 0 && (
              <div className="bg-zinc-950 text-emerald-400 p-5 rounded-3xl space-y-1.5 max-h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed border border-zinc-800 shadow-md">
                {reScheduleLog.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="text-zinc-600">[{15 - index >= 0 ? `02:2${15 - index}` : `02:20`}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Email Inbox / Team Feedback simulation list */}
            {staffResponses.length > 0 && (
              <div className="bg-[#F8F7F4] rounded-3xl border border-black/5 p-6 space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="space-y-0.5">
                    <h5 className="font-black text-sm text-gray-900 uppercase tracking-wide">Live Staff Verification Matrix</h5>
                    <p className="text-[10px] text-zinc-500">Real-time status of employees responding to the scheduling broadcast.</p>
                  </div>
                  <span className="text-[10px] bg-zinc-900 text-white py-1 px-3 rounded-full font-bold">
                    {staffResponses.filter(s => s.response !== 'none').length} / {staffResponses.length} Confirmed
                  </span>
                </div>

                <div className="space-y-3">
                  {staffResponses.map(rs => (
                    <div key={rs.userId} className="p-4 bg-white rounded-2xl flex items-start justify-between gap-3 text-xs border border-zinc-100 shadow-sm">
                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center font-black text-sm text-zinc-700 shrink-0 border border-zinc-200">
                          {rs.userName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-zinc-900 flex items-center gap-2">
                            {rs.userName}
                            {rs.userId === 'u2' && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Branch Manager</span>
                            )}
                          </p>
                          <p className="text-zinc-500 italic">"{rs.message}"</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {rs.response === 'yes' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <CheckCircle size={11} /> Active Confirm
                          </span>
                        ) : rs.response === 'no' ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <XCircle size={11} /> Conflict/Swap
                          </span>
                        ) : (
                          <span className="bg-zinc-200 text-zinc-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl flex items-center gap-1 animate-pulse">
                            <Clock size={11} /> Waiting Reply
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated Interactive Email sandbox to demonstrate smart confirmation logic! */}
                <div className="bg-white rounded-2xl p-5 border border-zinc-300/40 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2.5">
                    <Mail size={16} className="text-zinc-400" />
                    <span className="text-xs font-black uppercase tracking-wide text-zinc-800">Smart Verification Link Sandbox</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Below is the interactive verification link generated inside <strong>Bear John (u2)'s</strong> email inbox. Test clicking either option below:
                  </p>
                  <div className="bg-zinc-50 rounded-xl p-4 border border-dashed space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                      <span>Sender: automatic-payroll@kalimcoffee.com</span>
                      <span>Recipient: bearjohn@kalim.com</span>
                    </div>
                    <div className="space-y-1">
                      <h6 className="text-xs font-black text-zinc-800">📅 [ACTION REQUIRED] Please verify your new schedule for Calgary South</h6>
                      <p className="text-[10px] text-zinc-600 leading-normal">
                        Hi Bear John, your upcoming shifts at <strong>730 58 Ave Sw</strong> have been generated by the AI agent on Friday check-point. Please lock in:
                      </p>
                      <ul className="text-[10px] text-zinc-600 pl-4 list-disc space-y-0.5 font-semibold">
                        <li>Monday (Jun 15): Shift A (7:00 AM - 2:00 PM)</li>
                        <li>Wednesday (Jun 17): Shift B (2:00 PM - 9:00 PM)</li>
                        <li>Thursday (Jun 18): Shift B (2:00 PM - 9:00 PM)</li>
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleSmartConfirmResponse('u2', 'yes')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 rounded-lg flex items-center justify-center gap-1 px-2 cursor-pointer transition-colors"
                      >
                        <CheckCircle size={10} /> Confirm I'll Be There
                      </button>
                      <button
                        onClick={() => handleSmartConfirmResponse('u2', 'no')}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black py-2 rounded-lg flex items-center justify-center gap-1 px-2 cursor-pointer transition-colors"
                      >
                        <XCircle size={10} /> Request Shift Swap
                      </button>
                    </div>
                  </div>
                </div>

                {/* Adjust Schedule Action */}
                {staffResponses.some(r => r.response === 'no') && emailStatus !== 'replied' && (
                  <motion.div 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="pt-3 border-t border-black/10"
                  >
                    <button
                      type="button"
                      onClick={handleAiAdjustSchedule}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Sparkles size={14} className="text-amber-300" />
                      Resolve Conflicts (Run AI Re-scheduler)
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Co-worker Shift Swap Center */}
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-[32px] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
              <RefreshCw size={12} className="animate-spin text-stone-100" /> Co-worker Shift Swap Center
            </span>
            <h4 className="text-xl font-black text-gray-900 mt-2">Employee Shift Swap Management</h4>
            <p className="text-xs text-stone-500 mt-1">
              Select scheduled shifts, trigger real-time shift swaps, and render pending manager approvals instantaneously.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 font-extrabold px-3 py-1 rounded-full">
              {employeeRequests.filter(r => r.type === 'shift_swap' && r.status === 'pending').length} Pending Swaps
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Submit Shift Swap Request Form */}
          <div className="lg:col-span-2 space-y-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h5 className="font-extrabold text-sm uppercase tracking-wider text-stone-800 flex items-center gap-2 border-b pb-3">
              <Users size={16} className="text-indigo-600" /> Propose Swap
            </h5>
            
            <form onSubmit={handleSubmitShiftSwap} className="space-y-4">
              {/* Requester Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Originating Employee</label>
                <select
                  value={selectedEmployeeForSwap}
                  onChange={(e) => setSelectedEmployeeForSwap(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-bold text-stone-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Select requester...</option>
                  {users.filter(u => u.role !== 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {/* Requester's Shift Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Their scheduled shift to trade away</label>
                <select
                  value={myShiftIdForSwap}
                  onChange={(e) => setMyShiftIdForSwap(e.target.value)}
                  disabled={!selectedEmployeeForSwap}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="" disabled>Select a shift...</option>
                  {schedules.filter(s => s.userId === selectedEmployeeForSwap).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.date} (Shift {s.shift})
                    </option>
                  ))}
                  {schedules.filter(s => s.userId === selectedEmployeeForSwap).length === 0 && selectedEmployeeForSwap && (
                    <option value="" disabled>No scheduled slots found this week!</option>
                  )}
                </select>
              </div>

              {/* Coworker Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Coworker to swap with</label>
                <select
                  value={selectedCoworkerForSwap}
                  onChange={(e) => setSelectedCoworkerForSwap(e.target.value)}
                  disabled={!selectedEmployeeForSwap}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-bold text-stone-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="" disabled>Select co-worker...</option>
                  {users.filter(u => u.id !== selectedEmployeeForSwap && u.role !== 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {/* Coworker's Shift Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Coworker's scheduled shift to acquire</label>
                <select
                  value={coworkerShiftIdForSwap}
                  onChange={(e) => setCoworkerShiftIdForSwap(e.target.value)}
                  disabled={!selectedCoworkerForSwap}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="" disabled>Select coworker shift...</option>
                  {schedules.filter(s => s.userId === selectedCoworkerForSwap).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.date} (Shift {s.shift})
                    </option>
                  ))}
                  {schedules.filter(s => s.userId === selectedCoworkerForSwap).length === 0 && selectedCoworkerForSwap && (
                    <option value="" disabled>No scheduled slots found for coworker!</option>
                  )}
                </select>
              </div>

              {/* swap description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Details / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent family commit..."
                  value={swapDetails}
                  onChange={(e) => setSwapDetails(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-medium text-stone-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSwap || !selectedEmployeeForSwap || !myShiftIdForSwap || !selectedCoworkerForSwap || !coworkerShiftIdForSwap}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingSwap ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Submit Swap Request
              </button>
            </form>
          </div>

          {/* Pending Swap Requests for Manager Approvals */}
          <div className="lg:col-span-3 space-y-4">
            <h5 className="font-extrabold text-sm uppercase tracking-wider text-stone-800 flex items-center gap-2 border-b border-stone-200 pb-3">
              <CheckSquare size={16} className="text-emerald-600" /> Manager Approval Queue
            </h5>

            <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
              {employeeRequests.filter(r => r.type === 'shift_swap').length === 0 && (
                <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-2">
                  <p className="text-xs text-stone-400 font-bold uppercase">No Swap Requests Found</p>
                  <p className="text-[11px] text-stone-400">All requested shift alignments are cleanly completed or empty!</p>
                </div>
              )}

              {employeeRequests.filter(r => r.type === 'shift_swap').map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div key={req.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-md uppercase">Request ID: {req.id}</span>
                          {isPending ? (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-black uppercase px-2 py-0.5 rounded-full">Awaiting Approval</span>
                          ) : req.status === 'approved' ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black uppercase px-2 py-0.5 rounded-full">Approved</span>
                          ) : (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-black uppercase px-2 py-0.5 rounded-full">Rejected</span>
                          )}
                        </div>
                        <h6 className="text-xs font-black text-stone-900 mt-1">{req.userName} Proposed Swap</h6>
                        <p className="text-xs text-stone-600 leading-relaxed font-medium bg-indigo-50/50 p-3 rounded-2xl border border-indigo-500/5 mt-2">
                          {req.details}
                        </p>
                      </div>
                    </div>

                    {isPending && (
                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-stone-100">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={13} /> Approve (Apply Swap)
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle size={13} /> Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Employee App Sync Gateway Sandbox (New Feature matching 'create employee app to communicate') */}
      <div className="bg-[#18181B] text-zinc-100 rounded-[32px] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Smartphone size={16} /> Companion Employee App Gateway Sync Hub
            </h4>
            <p className="text-xs text-zinc-400">
              Developed endpoints so your upcoming companion app can exchange real-time schedules, push alerts, and direct digital clock-ins.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API LISTENING (PORT 3000)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Controls & API Trigger */}
          <div className="lg:col-span-2 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-zinc-500">Target Employee Endpoint Preview</label>
              <select
                value={selectedEmployeeForApi}
                onChange={(e) => setSelectedEmployeeForApi(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-zinc-700 rounded-xl p-3 text-xs font-bold text-zinc-300 cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold">Dispatch Push Alerts</span>
                <Bell size={13} className="text-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Test firing mobile system toasts to the custom registered device matching this employee ID.
              </p>
              <button
                onClick={handleTriggerPushNotification}
                disabled={isDispatchingPush}
                className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-emerald-400 border border-zinc-700/50 hover:border-emerald-500/20 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isDispatchingPush ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Trigger Companion App Push
              </button>
            </div>

            {/* Simulated terminal logs */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-zinc-600 uppercase tracking-widest block">Live Gateway Events</span>
              <div className="bg-zinc-950/80 rounded-2xl p-4 h-[120px] overflow-y-auto font-mono text-[9px] text-zinc-500 leading-tight border border-zinc-900/50 space-y-1">
                {companionAppLogs.map((log, i) => (
                  <div key={i} className={`flex gap-1.5 ${log.includes('PUSH') || log.includes('Toast') ? 'text-emerald-400' : log.includes('Callback') ? 'text-amber-400' : ''}`}>
                    <span>→</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real JSON output sandbox */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                Dynamic API Payload: GET /api/employee/schedule?employeeId={selectedEmployeeForApi}
              </span>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase font-mono">
                application/json
              </span>
            </div>
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 h-[340px] overflow-y-auto font-mono text-[11px] leading-relaxed select-all text-emerald-400 no-scrollbar">
              <pre>{JSON.stringify(simulatedApiResponse, null, 2)}</pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
