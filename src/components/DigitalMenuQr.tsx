import React, { useState } from 'react';
import { 
  QrCode, 
  Download, 
  ExternalLink, 
  Smartphone, 
  Coffee, 
  Volume2, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  Printer,
  Copy,
  Info
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
}

interface DigitalMenuQrProps {
  products: Product[];
  websiteUrl: string;
}

export function DigitalMenuQr({ products = [], websiteUrl }: DigitalMenuQrProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('menu');
  const [qrColor, setQrColor] = useState<string>('000000');
  const [copied, setCopied] = useState(false);
  
  // Clean trailing slashes
  const cleanBaseUrl = websiteUrl.replace(/\/$/, "");

  // Generate target URL based on selection
  const targetUrl = React.useMemo(() => {
    if (selectedProduct === 'menu') {
      return `${cleanBaseUrl}/menu`;
    } else if (selectedProduct === 'feedback') {
      return `${cleanBaseUrl}/feedback`;
    } else {
      const prod = products.find(p => p.id === selectedProduct);
      const slug = prod ? prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : selectedProduct;
      return `${cleanBaseUrl}/product/${slug}`;
    }
  }, [selectedProduct, cleanBaseUrl, products]);

  // Public QR Code Generator API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=${qrColor}&data=${encodeURIComponent(targetUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentProductInfo = products.find(p => p.id === selectedProduct);

  return (
    <div className="bg-white rounded-[40px] border border-black/5 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Parameters Form */}
        <div className="flex-1 space-y-6">
          <div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              Marketing Suite
            </span>
            <h3 className="text-2xl font-black tracking-tight text-[#1A1A1A] mt-2">QR Code & Digital Menu Connect</h3>
            <p className="text-xs text-black/40 mt-1">
              Create QR codes to paste on cafe counters, menus, and table tents pointing directly to your website.
            </p>
          </div>

          {/* Selector Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">QR Code Target Location</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedProduct('menu')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                  selectedProduct === 'menu' 
                    ? 'border-black bg-black text-white shadow-sm' 
                    : 'border-black/5 bg-black/5 hover:bg-black/10 text-black/70'
                }`}
              >
                <QrCode size={16} className="mb-1" />
                Full Digital Menu
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct('feedback')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                  selectedProduct === 'feedback' 
                    ? 'border-black bg-black text-white shadow-sm' 
                    : 'border-black/5 bg-black/5 hover:bg-black/10 text-black/70'
                }`}
              >
                <Smartphone size={16} className="mb-1" />
                Customer Feedback
              </button>
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    setSelectedProduct(products[0].id);
                  }
                }}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                  selectedProduct !== 'menu' && selectedProduct !== 'feedback'
                    ? 'border-black bg-black text-white shadow-sm' 
                    : 'border-black/5 bg-black/5 hover:bg-black/10 text-black/70'
                }`}
              >
                <Coffee size={16} className="mb-1" />
                Specific Drink Detail
              </button>
            </div>
          </div>

          {/* Conditional Product Dropdown */}
          {selectedProduct !== 'menu' && selectedProduct !== 'feedback' && (
            <div className="space-y-2 animate-[fadeIn_0.2s_ease-out]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">Select Menu Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-black/5 p-4 rounded-2xl font-bold text-sm border-none appearance-none cursor-pointer focus:ring-1 focus:ring-black"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.category}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Colors Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">Brand Accent Color</label>
            <div className="flex gap-2">
              {[
                { hex: '000000', label: 'Matte Black' },
                { hex: '78350F', label: 'Kalim Brown' },
                { hex: '1E3A8A', label: 'Classic Blue' },
                { hex: '059669', label: 'Fresh Mint' },
              ].map(color => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setQrColor(color.hex)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    qrColor === color.hex 
                      ? 'border-black bg-black text-white shadow-sm' 
                      : 'border-black/5 hover:bg-black/5 text-black'
                  }`}
                >
                  <span 
                    className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" 
                    style={{ backgroundColor: `#${color.hex}` }} 
                  />
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Link Information */}
          <div className="bg-black/5 rounded-3xl p-5 space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1">
              <Info size={12} /> Target URL link connected
            </span>
            <div className="flex items-center justify-between gap-4 font-mono text-xs font-bold text-black/75 break-all max-w-full">
              <span>{targetUrl}</span>
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-white rounded-lg hover:bg-black/10 transition-colors shadow-sm"
                  title="Copy link"
                >
                  {copied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
                <a 
                  href={targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-white rounded-lg hover:bg-black/10 transition-colors shadow-sm text-[#1A1A1A]"
                  title="Test link"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Poster Print Preview (Bento Sign Block) */}
        <div className="w-full lg:w-[320px] bg-gradient-to-b from-[#1E1C1A] to-[#121110] text-white p-6 rounded-[34px] shadow-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          {/* Delicate visual lines for vintage stamp café feel */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800" />
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-amber-500 font-black tracking-widest text-[10px] uppercase">
              <Coffee size={14} /> Kalim Coffee
            </div>
            <h4 className="text-lg font-black tracking-tight font-sans">
              {selectedProduct === 'menu' && "Digital Menu"}
              {selectedProduct === 'feedback' && "Guest Feedback"}
              {selectedProduct !== 'menu' && selectedProduct !== 'feedback' && (currentProductInfo?.name || "Drink Specs")}
            </h4>
            <p className="text-[10px] text-white/40">Scan phone to open dynamic layout</p>
          </div>

          {/* Interactive QR Code Frame */}
          <div className="p-3 bg-white rounded-3xl shadow-inner relative flex items-center justify-center w-48 h-48 group">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-full h-full object-contain select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-3 w-full">
            <p className="text-[10px] leading-relaxed text-white/50 max-w-[220px] mx-auto">
              {selectedProduct === 'menu' && "Browse our freshly brewed beans, custom espresso blends, and local seasonal tea directly on your screen!"}
              {selectedProduct === 'feedback' && "Your coffee experiences matter to us. Scan to leave staff notes or digital praise."}
              {selectedProduct !== 'menu' && selectedProduct !== 'feedback' && (currentProductInfo?.description || "Explore full ingredients, nutritional profiles, and allergen facts on Kalim Coffee Website.")}
            </p>

            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              <a 
                href={qrCodeUrl} 
                download={`Kalim-QR-${selectedProduct}.png`}
                target="_blank"
                rel="noreferrer"
                className="bg-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={12} /> Save QR Image
              </a>
              <button 
                onClick={() => window.print()}
                className="bg-amber-600 hover:bg-amber-700 px-3 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Printer size={12} /> Print Poster
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
