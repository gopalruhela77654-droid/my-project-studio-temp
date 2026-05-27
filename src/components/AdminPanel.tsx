import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Cpu, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Check, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
  Phone,
  Layers,
  ShoppingBag,
  DollarSign
} from 'lucide-react';

interface OrderPayload {
  customerName: string;
  shippingAddress: string;
  contactDetails: string;
  itemOrdered: string;
  quantity: number;
  size: string;
  color: string;
  customImage: string | null;
  price: number;
  timestamp: number;
  qikink_status: 'draft' | 'created' | 'failed' | 'queued';
  qikink_order_id?: string | null;
  qikink_errors?: string[];
  qikink_response?: any;
}

interface OrderItem {
  key: string;
  data: OrderPayload;
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'draft' | 'created' | 'failed'>('all');
  
  // Inline editing state
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<OrderPayload>>({});
  
  // Confirming state per order
  const [processingKeys, setProcessingKeys] = React.useState<Record<string, boolean>>({});
  const [successLogs, setSuccessLogs] = React.useState<Record<string, string>>({});
  const [errorLogs, setErrorLogs] = React.useState<Record<string, string[]>>({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching admin logs:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleStartEdit = (item: OrderItem) => {
    setEditingKey(item.key);
    setEditForm({ ...item.data });
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditForm({});
  };

  const handleSaveEdit = async (key: string) => {
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderKey: key,
          ...editForm
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setOrders(prev => prev.map(o => o.key === key ? { ...o, data: data.order } : o));
        setEditingKey(null);
        setEditForm({});
      } else {
        alert("Failed to update: " + data.message);
      }
    } catch (err: any) {
      alert("Error updating draft: " + err.message);
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm("Are you sure you want to delete this order from drafts?")) return;
    try {
      const res = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderKey: key })
      });
      const data = await res.json();
      if (data && data.success) {
        setOrders(prev => prev.filter(o => o.key !== key));
      }
    } catch (err: any) {
      alert("Error deleting order: " + err.message);
    }
  };

  const handleConfirmOrder = async (key: string) => {
    setProcessingKeys(prev => ({ ...prev, [key]: true }));
    setSuccessLogs(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setErrorLogs(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderKey: key })
      });
      
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: text || "Invalid serverside response content" };
      }

      if (data && data.success) {
        setSuccessLogs(prev => ({ 
          ...prev, 
          [key]: `Confirmed! Qikink ID: ${data.order?.qikink_order_id || 'sync_success'}` 
        }));
        // Update local list
        if (data.order) {
          setOrders(prev => prev.map(o => o.key === key ? { ...o, data: data.order } : o));
        } else {
          fetchOrders();
        }
      } else {
        const errorMsgs = data.errors || [data.message || "Failed execution"];
        setErrorLogs(prev => ({ ...prev, [key]: errorMsgs }));
        fetchOrders();
      }
    } catch (err: any) {
      setErrorLogs(prev => ({ ...prev, [key]: [err.message || "Network Timeout Pipeline Error"] }));
    } finally {
      setProcessingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  // Stats calculation
  const totalCount = orders.length;
  const draftCount = orders.filter(o => o.data.qikink_status === 'draft').length;
  const createdCount = orders.filter(o => o.data.qikink_status === 'created').length;
  const failedCount = orders.filter(o => o.data.qikink_status === 'failed').length;

  const filteredOrders = orders.filter(item => {
    const matchesSearch = 
      item.data.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.data.contactDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.data.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.data.itemOrdered.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === 'all' || 
      item.data.qikink_status === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-6xl bg-[#0d0f12] border border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-white"
      >
        {/* Banner header resembling hardware dashboards */}
        <div className="p-6 md:p-8 border-b border-gray-800 bg-[#111419] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Cpu className="animate-pulse" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500 font-mono">Qikink Integration</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-500 font-mono">LIVE LINK</span>
              </div>
              <h2 className="text-2xl font-serif">Order Review & Dispatch Terminal</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchOrders}
              className="p-3 bg-gray-800/80 hover:bg-gray-850 rounded-full border border-gray-700 transition-colors"
              title="Sync Database"
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-800/80 hover:bg-[#1a1e24] border border-gray-700 rounded-full font-medium text-xs uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              Close <X size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-[#0a0d10] border-b border-gray-800 divide-x divide-gray-800/60 font-mono">
          <div className="p-5 text-center">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider mb-1">Total Logs</div>
            <div className="text-2xl font-bold text-gray-250">{totalCount}</div>
          </div>
          <div className="p-5 text-center bg-cyan-500/5">
            <div className="text-[10px] uppercase text-cyan-400 tracking-wider mb-1">Pending Drafts</div>
            <div className="text-2xl font-bold text-cyan-400">{draftCount}</div>
          </div>
          <div className="p-5 text-center bg-emerald-500/5">
            <div className="text-[10px] uppercase text-emerald-400 tracking-wider mb-1">Qikink Synced</div>
            <div className="text-2xl font-bold text-emerald-400">{createdCount}</div>
          </div>
          <div className="p-5 text-center bg-rose-500/5">
            <div className="text-[10px] uppercase text-rose-450 tracking-wider mb-1">Dispatch Blocked</div>
            <div className="text-2xl font-bold text-rose-450">{failedCount}</div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="p-6 bg-[#0c0e12] border-b border-gray-800/60 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-[#12161c] border border-gray-850 rounded-full px-4 py-2 w-full md:max-w-md">
            <Search size={16} className="text-gray-500" />
            <input 
              type="text"
              placeholder="Filter by customer, phone, item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:outline-none focus:ring-0 text-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}><X size={14} className="opacity-50" /></button>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#12161c] rounded-full border border-gray-850">
            {(['all', 'draft', 'created', 'failed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeTab === tab 
                    ? 'bg-cyan-500 text-gray-900 shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-[#090b0d] space-y-6">
          {loading ? (
            <div className="h-60 flex flex-col items-center justify-center text-center opacity-50 font-mono">
              <RefreshCw className="animate-spin mb-3 text-cyan-500" size={32} />
              <span>SCANNING SECURE LEDGER ENGINES...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-850 rounded-2xl p-6">
              <Clock size={40} className="text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-400">No order logs correspond to filter criteria</p>
              <span className="text-xs text-gray-600 mt-1 uppercase font-mono">GATEKEEPER IS PENDING DRAFT ENTRIES</span>
            </div>
          ) : (
            filteredOrders.map(({ key, data: order }) => {
              const isEditing = editingKey === key;
              const isProcessing = !!processingKeys[key];
              const successMsg = successLogs[key];
              const errorArr = errorLogs[key] || order.qikink_errors || [];

              return (
                <div 
                  key={key}
                  className={`border rounded-2xl p-6 transition-all duration-300 ${
                    order.qikink_status === 'created' 
                      ? 'bg-emerald-500/[0.02] border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.02)]' 
                      : order.qikink_status === 'failed'
                      ? 'bg-rose-500/[0.02] border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.02)]'
                      : 'bg-[#12151a] border-gray-850 hover:bg-[#14181e] hover:border-gray-800'
                  }`}
                >
                  {/* Status header */}
                  <div className="flex flex-wrap items-center justify-between mb-5 gap-3 pb-4 border-b border-gray-800/40">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-gray-500">#{key.replace('order_', '')}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(order.timestamp * 1000).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.qikink_status === 'draft' && (
                        <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[9px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 animate-pulse">
                          <Clock size={10} /> DRAFT / PENDING CONFIRMATION
                        </span>
                      )}
                      {order.qikink_status === 'created' && (
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle size={10} /> SYNCED SUCCESS
                        </span>
                      )}
                      {order.qikink_status === 'failed' && (
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-mono font-bold text-rose-450 flex items-center gap-1.5">
                          <AlertTriangle size={10} /> DISPATCH BLOCKED
                        </span>
                      )}
                      {order.qikink_status === 'queued' && (
                        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-mono font-bold text-amber-400 flex items-center gap-1.5 animate-pulse">
                          <Clock size={10} /> OFFLINE QUEUED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body elements */}
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/40 p-5 rounded-xl border border-gray-800 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Customer Fullname</label>
                        <input 
                          type="text"
                          value={editForm.customerName || ''}
                          onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                          className="w-full bg-[#161a20] border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">WhatsApp/Phone Protocol</label>
                        <input 
                          type="text"
                          value={editForm.contactDetails || ''}
                          onChange={(e) => setEditForm({ ...editForm, contactDetails: e.target.value })}
                          className="w-full bg-[#161a20] border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Full Delivery Address + PINCODE</label>
                        <textarea 
                          rows={2}
                          value={editForm.shippingAddress || ''}
                          onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
                          className="w-full bg-[#161a20] border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3 md:col-span-2">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Design Identifier (ID)</label>
                          <input 
                            type="text"
                            value={editForm.itemOrdered || ''}
                            onChange={(e) => setEditForm({ ...editForm, itemOrdered: e.target.value })}
                            className="w-full bg-[#161a20] border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Dimensions / Size</label>
                          <select 
                            value={editForm.size || 'M'}
                            onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                            className="w-full bg-[#161a20] border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Base Colorway</label>
                          <select 
                            value={editForm.color || 'White'}
                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                            className="w-full bg-[#161a20] border border-gray-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="White">White</option>
                            <option value="Black">Black</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-700 hover:bg-white/5 rounded-lg text-xs tracking-wider uppercase font-bold text-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(key)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1 shadow-md"
                        >
                          <Check size={14} /> Preserve Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-4">
                      {/* Customer Info */}
                      <div className="lg:col-span-5 space-y-3.5">
                        <div className="flex items-start gap-3">
                          <User size={15} className="mt-0.5 text-cyan-500" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">Recipient Identity</span>
                            <span className="text-sm font-semibold">{order.customerName}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone size={15} className="mt-0.5 text-cyan-500" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">Communications link</span>
                            <a 
                              href={`https://wa.me/${order.contactDetails.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs hover:text-cyan-400 font-medium underline flex items-center gap-1"
                            >
                              {order.contactDetails} <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin size={15} className="mt-0.5 text-cyan-500" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">Drop Logistics Address</span>
                            <p className="text-xs text-gray-300 leading-relaxed font-sans">{order.shippingAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Product Selection info */}
                      <div className="lg:col-span-4 space-y-3.5 border-t lg:border-t-0 lg:border-l border-gray-800/60 lg:pl-6 pt-4 lg:pt-0">
                        <div className="flex items-start gap-3">
                          <Layers size={15} className="mt-0.5 text-cyan-500" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">AURA Selection Specifications</span>
                            <span className="text-xs font-medium text-gray-200">
                              {order.itemOrdered} (Qty: {order.quantity})
                            </span>
                            <div className="flex gap-2 mt-1.5 font-mono">
                              <span className="px-2 py-0.5 bg-gray-800 rounded text-[9px] font-bold">SIZE: {order.size}</span>
                              <span className="px-2 py-0.5 bg-gray-800 rounded text-[9px] font-bold">BASE: {order.color}</span>
                              <span className="px-2 py-0.5 bg-[#17202d] text-cyan-400 rounded text-[9px] font-bold">${order.price}</span>
                            </div>
                          </div>
                        </div>

                        {order.customImage && (
                          <div className="pt-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono mb-1.5">Artwork Attachment</span>
                            <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center p-1.5">
                              <img src={order.customImage} alt="Custom Art Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Direct actions */}
                      <div className="lg:col-span-3 flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l border-gray-800/60 lg:pl-6 pt-4 lg:pt-0">
                        <div className="space-y-2">
                          {order.qikink_status === 'draft' && (
                            <button
                              onClick={() => handleConfirmOrder(key)}
                              disabled={isProcessing}
                              className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 transition-all text-xs font-bold uppercase tracking-wider text-gray-950 rounded-xl shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5"
                            >
                              {isProcessing ? (
                                <RefreshCw className="animate-spin" size={12} />
                              ) : "⚡ 1-Click Dispatch"}
                            </button>
                          )}
                          
                          {order.qikink_status === 'failed' && (
                            <button
                              onClick={() => handleConfirmOrder(key)}
                              disabled={isProcessing}
                              className="w-full px-4 py-3 bg-rose-500 hover:bg-rose-455 disabled:opacity-50 transition-all text-xs font-bold uppercase tracking-wider text-white rounded-xl flex items-center justify-center gap-1.5"
                            >
                              {isProcessing ? (
                                <RefreshCw className="animate-spin" size={12} />
                              ) : "⚡ Re-attempt Dispatch"}
                            </button>
                          )}

                          {order.qikink_status === 'created' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-center">
                              <span className="text-[9px] block uppercase tracking-wide font-mono mb-0.5">QIKINK CONFIRMED</span>
                              <span className="text-xs font-semibold select-all font-mono break-all">{order.qikink_order_id}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {order.qikink_status !== 'created' && (
                            <button
                              onClick={() => handleStartEdit({ key, data: order })}
                              className="flex-1 px-3 py-2 border border-gray-800 hover:bg-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#9b9fa8] flex items-center justify-center gap-1"
                            >
                              <Edit size={12} /> Edit Details
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(key)}
                            className="px-3 py-2 border border-gray-800 hover:bg-rose-600/10 hover:border-rose-600/30 rounded-lg text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-400 flex items-center justify-center"
                            title="Purge Log"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Logging feed under order */}
                  <AnimatePresence>
                    {successMsg && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl font-mono mt-3"
                      >
                        ✅ {successMsg}
                      </motion.div>
                    )}
                    {errorArr.length > 0 && order.qikink_status !== 'created' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs px-4 py-3 rounded-xl font-mono mt-3 space-y-1 overflow-x-auto"
                      >
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-red-400">
                          <AlertTriangle size={13} /> TRACE DISPATCH BLOCKERS:
                        </div>
                        {errorArr.map((err, errIdx) => (
                          <div key={errIdx} className="text-[11px] leading-relaxed whitespace-pre-wrap border-t border-rose-500/10 pt-1">
                            {errIdx + 1}. {err}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
