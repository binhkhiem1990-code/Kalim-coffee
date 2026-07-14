import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, MapPin, AlertTriangle, Play, RefreshCw, Smartphone, Laptop, Cpu, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface User {
  id: string;
  name: string;
  role: string;
  employeeId: string;
}

interface AntiCheatSimulatorProps {
  users: User[];
  simulateDeveloperMode: boolean;
  setSimulateDeveloperMode: (val: boolean) => void;
}

export default function AntiCheatSimulator({
  users,
  simulateDeveloperMode,
  setSimulateDeveloperMode
}: AntiCheatSimulatorProps) {
  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || '');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLog, setAuditLog] = useState<string>('');
  const [audioFeedback, setAudioFeedback] = useState<string>('');

  const triggerBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(simulateDeveloperMode ? 350 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("Web Audio blocker:", e);
    }
  };

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    setAuditLog('');
    triggerBeep();

    const currentUserObj = users.find(u => u.id === selectedUser) || users[0];
    if (!currentUserObj) {
      setAuditLog('Error: No active team member selected for analysis.');
      setIsAuditing(false);
      return;
    }

    try {
      const payload = {
        employeeName: currentUserObj.name,
        hourlyRate: 19.5,
        hours: 140,
        rating: "Outstanding",
        gameBonus: simulateDeveloperMode ? 120 : 0,
        spoofModeActive: simulateDeveloperMode
      };

      const response = await fetch("/api/ai/employee-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Performance auditing endpoint is currently unavailable.');
      }

      const data = await response.json();
      setAuditLog(data.analysis || 'Analysis retrieved successfully with clear status.');
    } catch (err: any) {
      setAuditLog(`Audit Failed: ${err.message || 'Network delay connecting to AI Gateway.'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-[32px] p-6 md:p-8 border border-neutral-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert size={20} className={simulateDeveloperMode ? "animate-pulse text-rose-500" : "text-emerald-400"} />
            </span>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
              Integrity Assurance Hub
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
            Security & Geofence Spoof Simulator
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            Verify device compliance logs, audit mobile geolocation coordinates, and toggle virtual spoof defenses to test our AI-assisted security policies.
          </p>
        </div>

        {/* Global Toggle Box */}
        <div className="bg-neutral-800/80 p-4 rounded-3xl border border-neutral-700/60 flex items-center gap-4 shrink-0 shadow-inner">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-neutral-400 font-mono">
              GPS Spoof Simulation
            </span>
            <span className={`text-xs font-black uppercase ${simulateDeveloperMode ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {simulateDeveloperMode ? 'Active (Hacks On)' : 'Secure (No Spoof)'}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-700"></div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={simulateDeveloperMode} 
              onChange={(e) => {
                setSimulateDeveloperMode(e.target.checked);
                triggerBeep();
              }}
              className="sr-only peer" 
            />
            <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-900 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Simulation Controls & Baristas Directory Check */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-neutral-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Smartphone size={16} className="text-neutral-500" /> Crew Geofence Monitor
            </h3>

            <div className="space-y-2">
              {users.map(u => {
                const isViolator = simulateDeveloperMode; 
                return (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedUser === u.id 
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' 
                        : 'bg-neutral-50 hover:bg-neutral-100/70 border-neutral-200/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs">{u.name}</div>
                      <div className={`text-[10px] font-mono tracking-wider ${selectedUser === u.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        ID: {u.employeeId} • {u.role.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      {isViolator ? (
                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase font-mono flex items-center gap-1 ${
                          selectedUser === u.id ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 border border-rose-300/30'
                        }`}>
                          <AlertTriangle size={10} className="animate-spin" /> GPS Spoof
                        </span>
                      ) : (
                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase font-mono flex items-center gap-1 ${
                          selectedUser === u.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-300/30'
                        }`}>
                          <CheckCircle size={10} /> Compliant
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Sandbox Controls */}
          <div className="bg-white rounded-[32px] border border-neutral-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Cpu size={16} className="text-neutral-500" /> Active Security Shields
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-700">VPN Tunnel Defense</span>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md">ENFORCED</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-700">Root / Jailbreak Shield</span>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md">ENFORCED</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-700">GPS Drift Tolerancing</span>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md">15 METERS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI Audit Execution Console */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-neutral-200/80 p-6 shadow-sm flex flex-col space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-neutral-600" /> Smart Integrity Audits
                </h3>
                <p className="text-xs text-neutral-400">Evaluate active barista shift integrity logs with AI</p>
              </div>
              <button
                onClick={handleRunAiAudit}
                disabled={isAuditing}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 ${
                  isAuditing 
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                {isAuditing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Auditing Coordinates...
                  </>
                ) : (
                  <>
                    <Play size={12} fill="currentColor" /> Run AI Audit
                  </>
                )}
              </button>
            </div>

            {/* Simulated Live Feed map or terminal warning */}
            {simulateDeveloperMode ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex gap-3 items-start">
                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="font-black text-xs uppercase tracking-wider">GPS Spoofing Alarm Triggered</h4>
                  <p className="text-[11px] text-rose-800/80 leading-relaxed">
                    Virtual mocking is turned ON. Any employee clock-ins will suffer geofencing isolation blocks. Managers are requested to test checking compliance manually through the prompt below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider">System State Secure</h4>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    Device telemetry is authentic. Clean location verification records active across all bar terminals. No geofencing alerts flagged.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Log Result Output */}
            <div className="space-y-2 flex-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block font-mono">
                Audit Feedback Log Stream
              </label>
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 font-mono text-xs text-neutral-700 min-h-[300px] leading-relaxed overflow-y-auto max-h-[450px]">
                {auditLog ? (
                  <div className="whitespace-pre-line text-neutral-800">
                    {auditLog}
                  </div>
                ) : (
                  <div className="text-neutral-400 italic flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <Cpu size={24} className="text-neutral-300" />
                    <div>
                      <span>No audits executed for current shift session.</span>
                      <span className="block text-[10px] mt-1">Select a barista and click "Run AI Audit" to fetch compliance profiles.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
