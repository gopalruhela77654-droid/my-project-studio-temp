import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, X, Upload } from 'lucide-react';

interface OrderFormProps {
  onSuccess?: () => void;
  onClose: () => void;
  selectedMainCategory: 'Preset Design' | 'Your Design';
  mainUploadedFile: File | null;
  customImageBase64?: string | null;
  productColor?: string;
  customType?: 'tshirt' | 'mug';
  cartItems?: any[];
  cartTotal?: number;
  onOrderPlaced?: () => void;
}

export default function OrderForm({ 
  onSuccess, 
  onClose, 
  selectedMainCategory, 
  mainUploadedFile,
  customImageBase64: customImageBase64Prop,
  productColor,
  customType,
  cartItems = [],
  cartTotal = 0,
  onOrderPlaced
}: OrderFormProps) {
  const [formData, setFormData] = React.useState({
    'form-name': 'order-submissions',
    'bot-field': '',
    name: '',
    whatsapp: '',
    size: 'M',
    color: productColor || 'White',
    design: '',
    address: '',
    quantity: 1
  });

  const [customDesignFile, setCustomDesignFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (mainUploadedFile) {
      setCustomDesignFile(mainUploadedFile);
    }
  }, [mainUploadedFile]);

  // Set default values depending on shop context
  React.useEffect(() => {
    let designVal = '';
    let defaultQty = 1;

    if (cartItems && cartItems.length > 0) {
      designVal = cartItems.map(item => `${item.name} (${item.quantity}x)`).join(', ');
      defaultQty = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    } else {
      designVal = customType ? `Custom ${customType.charAt(0).toUpperCase() + customType.slice(1)}` : 'AURA-001 Custom Apparel';
    }

    setFormData(prev => ({
      ...prev,
      design: designVal,
      color: productColor || 'White',
      quantity: defaultQty
    }));
  }, [cartItems, customType, productColor]);

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

    // Read attached file in Base64 if available
    let customImageBase64 = customImageBase64Prop || null;
    if (customDesignFile) {
      try {
        customImageBase64 = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(customDesignFile);
        });
      } catch (err) {
        console.error("Failed to read uploaded custom art file:", err);
      }
    }

    try {
      const payload = {
        customerName: formData.name,
        shippingAddress: formData.address,
        contactDetails: formData.whatsapp,
        itemOrdered: formData.design,
        quantity: parseInt(String(formData.quantity || 1), 10) || 1,
        size: formData.size,
        color: formData.color,
        price: cartTotal > 0 ? cartTotal : (customType === 'tshirt' ? 35 : 25),
        customImage: customImageBase64
      };

      const response = await fetch('/api/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data && data.success) {
        setStatus('success');
        if (onOrderPlaced) {
          onOrderPlaced();
        }
        if (onSuccess) onSuccess();
      } else {
        setStatus('error');
      }
    } catch (error: any) {
      console.error("Order transmission failed:", error);
      setStatus('error');
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
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-white animate-fade-in"
      >
        <div className="p-8 md:p-12 overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-cyan-500 mb-3 block font-mono">Design Verification Gate</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-3">Place Draft Order</h2>
            <p className="text-gray-400 max-w-sm mx-auto text-sm">Review parameters below. Your request will be saved as a draft for store review and manual dispatch.</p>
          </div>

          <div className="relative">
            <form 
              name="order-submissions" 
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Full Identity</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Recipient Name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">WhatsApp/Phone</label>
                  <input
                    required
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="e.g. +91 99999 12345"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Base Colorway</label>
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium appearance-none cursor-pointer text-sm text-white"
                  >
                    <option value="White">White Fabric/Ceramic</option>
                    <option value="Black">Black Fabric/Spectra</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Design ID / Content Lineup</label>
                  <input
                    required
                    type="text"
                    name="design"
                    value={formData.design}
                    onChange={handleChange}
                    placeholder="Product identification code"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                </div>

                <div className="md:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Quantity</label>
                  <input
                    required
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Logistics Drop Address (Complete Address + Pincode)</label>
                <textarea
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter complete shipping address including landmarker and pin identification..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-medium resize-none text-sm text-white"
                />
              </div>

              {selectedMainCategory === 'Your Design' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 font-mono">Custom Design Artwork</label>
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
                          <div className="bg-cyan-500/20 p-2.5 rounded-lg flex items-center justify-center">
                            <span className="text-xl leading-none">🎨</span>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.2em] font-mono">Custom Image Attached</span>
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
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white block mb-0.5">Initialize Artwork Import</span>
                          <span className="text-[9px] text-gray-650 uppercase tracking-tighter">PNG, JPG or SVG. Max 10MB.</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {validationError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2.5 px-4 rounded-xl text-center font-bold uppercase tracking-widest font-mono"
                >
                  {validationError}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-cyan-500 text-gray-900 py-4 rounded-2xl font-bold text-base uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4 cursor-pointer font-serif"
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Upload size={18} />
                    </motion.div>
                    Saving Draft...
                  </span>
                ) : (
                  <>
                    Save Order Draft <ArrowRight size={18} />
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
              className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center text-white z-50 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="mb-6 text-cyan-400"
              >
                <CheckCircle2 size={100} strokeWidth={1.5} />
              </motion.div>
              
              <div>
                <h3 className="text-3xl font-serif mb-4 text-cyan-400">Request Received as Draft!</h3>
                <p className="text-gray-300 mb-10 max-w-sm mx-auto text-sm leading-relaxed">
                  Your custom order design has been securely recorded to the database queue. You can review, modify, or manually dispatch to Qikink inside the operator cabin!
                </p>
                
                <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                  <button 
                    onClick={onClose}
                    className="w-full bg-cyan-500 text-gray-950 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:scale-105 transition-transform"
                  >
                    Return to Shop
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
              <h3 className="text-2xl font-serif mb-2">Failed to Save Draft</h3>
              <p className="text-white/70 mb-6">There was an unexpected database error creating your order draft. Please reconfirm inputs.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2 border border-white/20 hover:bg-white/10 rounded-full transition-colors"
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
