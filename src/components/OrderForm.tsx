import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, X, Upload } from 'lucide-react';

interface OrderFormProps {
  onSuccess?: () => void;
  onClose: () => void;
  selectedMainCategory: 'Preset Design' | 'Your Design';
  mainUploadedFile: File | null;
}

export default function OrderForm({ onSuccess, onClose, selectedMainCategory, mainUploadedFile }: OrderFormProps) {
  const [formData, setFormData] = React.useState({
    'form-name': 'order-submissions',
    'bot-field': '',
    name: '',
    whatsapp: '',
    size: 'M',
    design: '',
    address: '',
  });

  const [customDesignFile, setCustomDesignFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (mainUploadedFile) {
      setCustomDesignFile(mainUploadedFile);
    }
  }, [mainUploadedFile]);

  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomDesignFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValidationError(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic Validation Check
    if (!formData.name || !formData.whatsapp || !formData.address || !formData.design) {
      setValidationError('Please enter correct details in all fields.');
      return;
    }

    setStatus('submitting');
    setValidationError(null);

    try {
      const response = await fetch('/api/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          shippingAddress: formData.address,
          contactDetails: formData.whatsapp,
          itemOrdered: formData.design,
          quantity: 1
        }),
      });

      const data = await response.json();
      if (data && data.success) {
        setStatus('success');
        alert(data.message);
        if (onSuccess) onSuccess();
      } else {
        setStatus('error');
        alert("Transmission Failed: " + (data?.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Order transmission failed:", error);
      setStatus('error');
      alert("Transmission Failed: " + (error?.message || "Connection error."));
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-white"
      >
        <div className="p-8 md:p-12 overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-cyan-500 mb-3 block font-mono">Secure Terminal</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-3">Execute Order</h2>
            <p className="text-gray-400 max-w-sm mx-auto text-sm">Complete the parameters below to finalize your custom acquisition.</p>
          </div>

          <div className="relative">
            {/* Quant Accents */}
            <div className="absolute -top-12 -right-4 p-4 opacity-10 font-mono text-[10px] hidden md:block">
              SYS_AUTH_VERIFIED // 0x4F2A
            </div>

            <form 
              name="order-submissions" 
              method="POST" 
              data-netlify="true" 
              data-netlify-honeypot="bot-field"
              encType="multipart/form-data"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Netlify Hidden Inputs */}
              <input type="hidden" name="form-name" value="order-submissions" />
              <p className="hidden">
                <label>Don’t fill this out: <input name="bot-field" onChange={handleChange} /></label>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Full Identity</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">WhatsApp Protocol</label>
                  <input
                    required
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                  <p className="text-[9px] text-cyan-500/60 uppercase tracking-tighter ml-1 italic">For UPI Payment Confirmation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Dimension (Size)</label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium appearance-none cursor-pointer text-sm text-white"
                  >
                    <option value="S">S - Small</option>
                    <option value="M">M - Medium</option>
                    <option value="L">L - Large</option>
                    <option value="XL">XL - Extra Large</option>
                    <option value="XXL">XXL - Double Extra Large</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Design ID</label>
                  <input
                    required
                    type="text"
                    name="design"
                    value={formData.design}
                    onChange={handleChange}
                    placeholder="e.g. AURA-001"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Logistics (Shipping Address)</label>
                <textarea
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Full address with Pincode..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium resize-none text-sm text-white"
                />
              </div>

              {selectedMainCategory === 'Your Design' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Custom Design (Image)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      name="VIEW_CUSTOM_DESIGN"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {customDesignFile ? (
                      <div className="flex items-center justify-between w-full bg-cyan-500/5 border border-cyan-500/30 rounded-xl px-4 py-4 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="bg-cyan-500/20 p-2.5 rounded-lg flex items-center justify-center animate-pulse">
                            <span className="text-xl leading-none">✅</span>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.2em] font-mono">Design Attached // System Verified</span>
                            <span className="text-xs text-white/90 font-medium truncate max-w-[180px] font-mono opacity-60">
                              {customDesignFile.name.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors px-4 py-2 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 font-mono"
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-gray-800/50 border border-gray-700 border-dashed rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-3 hover:border-cyan-500/50 hover:bg-gray-800/80 transition-all group"
                      >
                        <div className="bg-gray-700/50 p-3 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                          <Upload size={20} className="text-gray-500 group-hover:text-cyan-500" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-white block mb-1">Initialize Upload</span>
                          <span className="text-[9px] text-gray-600 uppercase tracking-tighter">PNG, JPG or SVG. Max 10MB.</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {validationError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: 1, 
                    x: [0, -10, 10, -10, 10, 0] 
                  }}
                  transition={{ duration: 0.4 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-4 rounded-lg text-center font-bold uppercase tracking-widest"
                >
                  {validationError}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-cyan-500 text-gray-900 py-4 rounded-2xl font-bold text-base uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Send size={18} />
                    </motion.div>
                    Processing...
                  </span>
                ) : (
                  <>
                    Confirm Order <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-green-600 flex flex-col items-center justify-center text-white z-50 p-8 text-center overflow-hidden"
            >
              {/* Floating Emojis Background */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: "120%", x: `${Math.random() * 100}%`, opacity: 0 }}
                    animate={{ 
                      y: "-20%", 
                      opacity: [0, 1, 1, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 4, 
                      repeat: Infinity, 
                      delay: Math.random() * 5,
                      ease: "linear"
                    }}
                    className="absolute text-4xl"
                  >
                    {['😊', '✨', '🎉', '👕', '🔥', '💖'][Math.floor(Math.random() * 6)]}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="mb-6 text-white relative z-10"
              >
                <CheckCircle2 size={100} strokeWidth={1.5} />
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-4xl font-serif mb-4 drop-shadow-lg">Order Logged!</h3>
                <p className="text-white/90 mb-10 max-w-xs mx-auto text-lg font-medium">
                  We will contact you on WhatsApp for payment confirmation and final logistics.
                </p>
                
                <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                  <button 
                    onClick={onClose}
                    className="w-full bg-white text-green-600 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95"
                  >
                    Shop More
                  </button>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="text-white/70 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    View Form Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-950 flex flex-col items-center justify-center text-white z-50 p-8 text-center"
            >
              <X size={64} className="mb-4 text-red-500" />
              <h3 className="text-2xl font-serif mb-2">Transmission Failed</h3>
              <p className="text-white/70 mb-6">There was an error logging your order. Please try again.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
