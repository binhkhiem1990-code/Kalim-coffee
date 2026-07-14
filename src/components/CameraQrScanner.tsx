import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Scan, ShieldCheck, UserCheck, RefreshCw, Sparkles, Check, Play, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';

interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  dob: string;
  points: number;
  favoriteDrink: string;
  tier: string;
}

interface CameraQrScannerProps {
  customers: LoyaltyCustomer[];
  onCustomerScanned: (customer: LoyaltyCustomer) => void;
  currentlyScanned?: LoyaltyCustomer | null;
}

export default function CameraQrScanner({
  customers,
  onCustomerScanned,
  currentlyScanned
}: CameraQrScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [successScannedMsg, setSuccessScannedMsg] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<LoyaltyCustomer | null>(currentlyScanned || null);
  
  // Camera WebRTC references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  // Sound feedback
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration + 0.01);
    } catch (e) {
      console.warn("Audio Context playback warning:", e);
    }
  };

  // Sync state if selected customer changes from outside
  useEffect(() => {
    if (currentlyScanned !== undefined) {
      setActiveCustomer(currentlyScanned);
    }
  }, [currentlyScanned]);

  // Handle stream initialization
  const startCamera = async () => {
    setPermissionError(null);
    setSuccessScannedMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
      setIsActive(true);
      playBeep(600, 0.1);
    } catch (err: any) {
      console.error("Camera capture failed:", err);
      setPermissionError("Camera access denied or unavailable in this device frame (check browser tab state / https secure constraints).");
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    // Cancel animation frames
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    // Release camera stream locks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  // Turn off camera on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame scanner tick loop
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        requestRef.current = requestAnimationFrame(tick);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          // Draw video frame to hidden processing canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // Run JSQR processing pipeline
          const decodedCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (decodedCode) {
            const rawText = decodedCode.data.trim();
            console.log("Found QR Core code context:", rawText);
            
            // Try to match loyalty ID (e.g. "c1", "c2") or text contents
            const matchedCustomer = customers.find(c => 
              c.id.toLowerCase() === rawText.toLowerCase() || 
              rawText.toLowerCase().includes(c.id.toLowerCase()) ||
              rawText.toLowerCase().includes(c.name.toLowerCase())
            );

            if (matchedCustomer) {
              handleCustomerMatched(matchedCustomer);
              stopCamera();
              return;
            }
          }
        }
      }
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isActive, customers]);

  const handleCustomerMatched = (customer: LoyaltyCustomer) => {
    setActiveCustomer(customer);
    onCustomerScanned(customer);
    playBeep(987.77, 0.28); // high perfect fourth chime
    setSuccessScannedMsg(`Successfully matched member card: ${customer.name}`);
    setTimeout(() => {
      setSuccessScannedMsg(null);
    }, 5000);
  };

  // Simulating NFC/QR Card triggers
  const handleSimulatedCardScan = (customer: LoyaltyCustomer) => {
    handleCustomerMatched(customer);
  };

  return (
    <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-[32px] p-6 border border-neutral-200/80 shadow-md space-y-6">
      
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-neutral-900 text-white rounded-xl">
              <Scan size={16} className={isActive ? "animate-spin text-amber-400" : "text-white"} />
            </span>
            <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-mono">
              Staff Scanner Core
            </div>
          </div>
          <h3 className="text-lg font-black text-neutral-800 uppercase tracking-tight">
            NFC / QR Optical Smart Scanner
          </h3>
          <p className="text-xs text-neutral-500 max-w-lg">
            Verify guest loyalty profiles inside the shop instantly. Point the device camera towards the member's digital QR pass.
          </p>
        </div>

        {/* Start/Stop Camera buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isActive ? (
            <button 
              onClick={stopCamera}
              className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <CameraOff size={14} /> Stop Stream
            </button>
          ) : (
            <button 
              onClick={startCamera}
              className="flex-1 sm:flex-initial bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <Camera size={14} /> Start QR Camera
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Camera Finder / Viewport section */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="relative bg-neutral-950 aspect-[4/3] rounded-3xl overflow-hidden border border-neutral-800 shadow-inner flex flex-col items-center justify-center">
            
            {/* Real WebRTC camera container */}
            <video 
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            {/* Processing hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Static HUD Guides */}
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center"
                >
                  {/* Glowing Scanner Reticle */}
                  <div className="w-48 h-48 border-2 border-dashed border-amber-400 rounded-2xl relative shadow-md flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-[2px] -ml-[2px] rounded-tl-sm"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-[2px] -mr-[2px] rounded-tr-sm"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-[2px] -ml-[2px] rounded-bl-sm"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-[2px] -mr-[2px] rounded-br-sm"></div>
                    
                    {/* Pulsing Scan bar */}
                    <div className="w-full h-[2px] bg-amber-400 absolute animate-[bounce_1.8s_infinite] shadow-lg shadow-amber-400/50"></div>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-neutral-900/90 text-amber-400 px-3 py-1 rounded-full font-black tracking-widest mt-5 transition-all shadow-md">
                    Scanning active viewport...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inactive Standby Screen */}
            {!isActive && (
              <div className="text-center p-6 space-y-3 z-10">
                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
                  <CameraOff size={24} />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-neutral-300 text-sm">Optical Feed Terminated</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-normal">
                    Click "Start QR Camera" to engage real-time scanning feed. Make sure to allow system camera permissions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Permission Errors */}
          {permissionError && (
            <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 text-rose-900 flex gap-3 text-xs">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
              <p className="leading-relaxed font-bold">
                {permissionError}
              </p>
            </div>
          )}

          {/* Success messages container */}
          {successScannedMsg && (
            <div className="bg-emerald-500 text-white rounded-2xl p-4 flex gap-3 items-center text-xs shadow-lg font-bold animate-bounce">
              <Check className="shrink-0 text-white" size={18} />
              <p className="leading-normal flex-1">
                {successScannedMsg}
              </p>
              <button onClick={() => setSuccessScannedMsg(null)} className="text-white hover:opacity-85">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Active Profile Info / Quick Emulator triggers side panel */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          
          {/* Decoded customer result view */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 flex-1 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">
                Scanned Profile Details
              </h4>

              {activeCustomer ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/50 flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {activeCustomer.tier}
                      </span>
                      <h5 className="font-extrabold text-neutral-800 text-lg leading-normal">
                        {activeCustomer.name}
                      </h5>
                      <p className="font-mono text-xs text-neutral-500">
                        📱 Phone: {activeCustomer.phone}
                      </p>
                    </div>
                    <div className="bg-neutral-900 text-white p-3 rounded-2xl text-center shadow-sm">
                      <span className="block text-[8px] tracking-widest text-neutral-400 font-bold leading-none uppercase">POINTS</span>
                      <span className="text-sm font-black font-mono">⭐ {activeCustomer.points}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-bold text-neutral-500 block uppercase text-[10px]">Preferred Recipe / Taste Habit:</span>
                      <p className="font-semibold text-neutral-800 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/30 italic">
                        "{activeCustomer.favoriteDrink || 'Regular Drink Not Logged'}"
                      </p>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-neutral-500 block uppercase text-[10px]">Birthdate:</span>
                      <p className="font-bold text-neutral-800">{activeCustomer.dob || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400 italic space-y-2">
                  <UserCheck className="mx-auto text-neutral-300" size={32} />
                  <p className="text-xs">
                    No active scan discovered yet. Point the camera or click a simulator preset profile below.
                  </p>
                </div>
              )}
            </div>

            {activeCustomer && (
              <button
                onClick={() => {
                  setActiveCustomer(null);
                  playBeep(450, 0.1);
                }}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} /> Clear Loaded Profile
              </button>
            )}
          </div>

          {/* Quick Emulator selection panel */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 space-y-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-amber-500 animate-pulse" /> Sandbox Card Simulator
              </h4>
              <p className="text-[10px] text-neutral-400">
                Click a preset to quickly simulate scanner camera decode of a physical loyalty QR barcode (great for headless test workflows):
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSimulatedCardScan(c)}
                  className={`p-2 rounded-xl text-left border text-xs font-bold transition-all relative flex flex-col justify-between h-14 ${
                    activeCustomer?.id === c.id 
                      ? 'bg-amber-50/50 border-amber-300 text-amber-950 shadow-sm' 
                      : 'bg-neutral-50 hover:bg-neutral-100/50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <span className="text-[9px] text-neutral-400 block font-mono truncate">Code: "{c.id}"</span>
                  <span className="font-black text-neutral-800 font-sans truncate">{c.name}</span>
                  {activeCustomer?.id === c.id && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white p-0.5 rounded-full">
                      <Check size={8} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
