import React, { useState } from 'react';
import { MapPin, Navigation, Coffee, ShieldCheck } from 'lucide-react';

const BRANCH_LOCATIONS = [
  {
    id: "vancouver",
    name: "Kalim Coffee Vancouver (West Coast Hub)",
    address: "1152 Alberni St, Vancouver, BC V6E 1A5, Canada",
    coordinates: "49.2858° N, 123.1244° W",
    phone: "+1 (604) 555-0192",
    hours: "7:00 AM - 9:00 PM",
    embedQuery: "Kalim+Coffee+1152+Alberni+St+Vancouver+BC+V6E+1A5+Canada"
  },
  {
    id: "calgary",
    name: "Kalim Coffee Calgary (Alberta Plains HQ)",
    address: "730 58 Ave SW, Calgary, AB T2H 2B7, Canada",
    coordinates: "50.9996° N, 114.0768° W",
    phone: "+1 (403) 555-0845",
    hours: "8:00 AM - 8:00 PM",
    embedQuery: "730+58+Ave+SW+Calgary+Alberta+Canada"
  }
];

export function StoreMap() {
  const [activeBranch, setActiveBranch] = useState(BRANCH_LOCATIONS[0]);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  const handleOpenInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeBranch.address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full space-y-6">
      {/* Branch Selector Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="p-1.5 bg-yellow-500/10 text-yellow-600 rounded-lg">📍</span>
            Kalim Coffee Branch Locations
          </h3>
          <p className="text-xs text-black/40 mt-1">Our ecosystem of premium coffee shops and fresh roasted bean distribution centers.</p>
        </div>
        <div className="flex bg-black/[0.04] p-1.5 rounded-2xl border border-black/5 gap-1.5 w-full sm:w-auto">
          {BRANCH_LOCATIONS.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBranch(b)}
              className={`flex-1 sm:flex-none px-4 py-2 text-center text-[10px] md:text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
                activeBranch.id === b.id
                  ? 'bg-black text-white shadow-md'
                  : 'text-black/50 hover:text-black/80 hover:bg-black/5'
              }`}
            >
              {b.id === 'vancouver' ? '🌲 Vancouver' : '🌾 Calgary'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Info Card Details */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[28px] border border-black/5 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Currently Viewing
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-black text-base leading-snug">{activeBranch.name}</h4>
              <p className="text-xs text-black/40 mt-2 flex items-start gap-2">
                <MapPin size={14} className="text-black/30 shrink-0 mt-0.5" />
                {activeBranch.address}
              </p>
            </div>

            <div className="pt-2 border-t border-black/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-black/30 font-bold uppercase tracking-wider text-[9px]">Phone</span>
                <span className="font-bold text-black">{activeBranch.phone}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-black/30 font-bold uppercase tracking-wider text-[9px]">Hours</span>
                <span className="font-bold text-emerald-600">{activeBranch.hours}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-black/30 font-bold uppercase tracking-wider text-[9px]">GPS Coordinates</span>
                <span className="font-mono text-[10px] text-black/50">{activeBranch.coordinates}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenInGoogleMaps}
            className="w-full bg-black text-white py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform shadow hover:bg-zinc-900 cursor-pointer"
          >
            <Navigation size={13} />
            Navigate with Google Maps GPS
          </button>
        </div>

        {/* Dynamic Google Maps frame */}
        <div className="lg:col-span-8 bg-neutral-100 rounded-[32px] overflow-hidden border border-black/5 shadow-inner relative h-80 min-h-[320px]">
          {/* Top-Right Control Buttons */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
              className="bg-white/95 backdrop-blur-md hover:bg-white text-black text-[10px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl shadow-md border border-black/5 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Coffee size={13} />
              {mapType === 'standard' ? '🛰️ Satellite View' : '🗺️ Standard View'}
            </button>
          </div>

          <iframe
            key={`${activeBranch.id}-${mapType}`}
            title="Google Maps Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            referrerPolicy="no-referrer"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${activeBranch.embedQuery}&t=${mapType === 'standard' ? 'm' : 'k'}&z=16&output=embed&iwloc=near`}
            className="w-full h-full filter saturate-[0.95]"
          />

          {/* Compass layout indicator watermarker */}
          <div className="absolute left-4 bottom-4 bg-black/85 text-white/90 text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg border border-white/10 select-none backdrop-blur-sm">
            DEFAULT PERSPECTIVE 2D
          </div>
        </div>
      </div>
    </div>
  );
}
