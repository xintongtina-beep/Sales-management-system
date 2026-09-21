import React, { useState } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  Truck, 
  CheckCircle, 
  MessageSquare, 
  Star,
  Users,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { SampleRecord, Customer } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SampleViewProps {
  samples: SampleRecord[];
  customers: Customer[];
  onUpdateSample: (sample: SampleRecord) => void;
  onAddSample: (sample: SampleRecord) => void;
}

export default function SampleView({ 
  samples, 
  customers, 
  onUpdateSample,
  onAddSample
}: SampleViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // New sample state
  const [newCustId, setNewCustId] = useState(customers[0]?.id || "");
  const [newSampleName, setNewSampleName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newTracking, setNewTracking] = useState("");

  // Edit states
  const [editingSample, setEditingSample] = useState<SampleRecord | null>(null);
  const [editStatus, setEditStatus] = useState<any>("preparing");
  const [editTracking, setEditTracking] = useState("");
  const [editScore, setEditScore] = useState(5);
  const [editFeedback, setEditFeedback] = useState("");

  const filteredSamples = samples.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.sampleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || s.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === newCustId);
    if (!cust || !newSampleName) return;

    const newRec: SampleRecord = {
      id: `samp-${Date.now()}`,
      customerId: newCustId,
      customerName: cust.name,
      sampleName: newSampleName,
      quantity: Number(newQuantity),
      sendDate: new Date().toISOString().split("T")[0],
      status: "preparing",
      trackingNumber: newTracking || undefined
    };

    onAddSample(newRec);
    setShowAddForm(false);
    setNewSampleName("");
    setNewQuantity(1);
    setNewTracking("");
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    const updated: SampleRecord = {
      ...editingSample,
      status: editStatus,
      trackingNumber: editTracking || undefined,
      feedbackScore: editStatus === "feedback" ? editScore : undefined,
      feedbackComments: editStatus === "feedback" ? editFeedback : undefined
    };

    onUpdateSample(updated);
    setEditingSample(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">准备中</span>;
      case "shipped":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100">已发货</span>;
      case "received":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">已签收</span>;
      case "feedback":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">反馈完毕</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="sample-view-root">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="sample-filters">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索客户名/样品型号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="all">所有状态</option>
            <option value="preparing">准备中</option>
            <option value="shipped">已寄出</option>
            <option value="received">已签收</option>
            <option value="feedback">反馈完毕</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-sm self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>登记送样</span>
        </button>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="sample-cards-grid">
        {filteredSamples.map((sample) => (
          <div key={sample.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-200 transition-colors">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{sample.sampleName}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{sample.customerName}</span>
                </div>
                {getStatusBadge(sample.status)}
              </div>

              {/* Technical indicators */}
              <div className="grid grid-cols-2 gap-4 py-2 text-[11px] border-t border-slate-50">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>数量: <strong>{sample.quantity}</strong> 套/件</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>送样日: <strong>{sample.sendDate}</strong></span>
                </div>
              </div>

              {/* Shipping Tracking */}
              {sample.trackingNumber ? (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 flex items-center justify-between text-[10px]">
                  <span className="font-medium text-slate-500 flex items-center">
                    <Truck className="w-3.5 h-3.5 mr-1 text-sky-500" />
                    顺丰速运: <strong className="font-mono ml-1 select-all">{sample.trackingNumber}</strong>
                  </span>
                  <span className="text-slate-400 font-medium">在途监控</span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50/20 border border-amber-100/60 rounded-xl text-[10px] text-amber-600 font-medium flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  暂无快递单号
                </div>
              )}

              {/* Feedbacks */}
              {sample.status === "feedback" && (
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      客户质量测试反馈
                    </span>
                    <div className="flex text-amber-400">
                      {[...Array(sample.feedbackScore || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic">{sample.feedbackComments}</p>
                </div>
              )}
            </div>

            {/* Quick Action bar */}
            <div className="pt-3 border-t border-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setEditingSample(sample);
                  setEditStatus(sample.status);
                  setEditTracking(sample.trackingNumber || "");
                  setEditScore(sample.feedbackScore || 5);
                  setEditFeedback(sample.feedbackComments || "");
                }}
                className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center space-x-0.5"
              >
                <span>修改状态 / 录入反馈</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Sample Drawer Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="sample-add-modal-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4"
              id="sample-add-modal"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">登记新增样品寄送单</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateSample} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">选择客户公司 *</label>
                  <select
                    value={newCustId}
                    onChange={(e) => setNewCustId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">样件名称与规格 *</label>
                  <input
                    type="text"
                    required
                    placeholder="如：AX-809 控温板DEMO 2.0"
                    value={newSampleName}
                    onChange={(e) => setNewSampleName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">送样数量 *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">快递单号 (选填)</label>
                    <input
                      type="text"
                      placeholder="顺丰/邮政单号"
                      value={newTracking}
                      onChange={(e) => setNewTracking(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 shadow-md"
                  >
                    确认寄送
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Feedback Modal */}
      <AnimatePresence>
        {editingSample && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="sample-edit-modal-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4"
              id="sample-edit-modal"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">更新样品寄送状态与客户反馈</h3>
                <button onClick={() => setEditingSample(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">当前修改样件</span>
                  <span className="font-bold text-slate-800">{editingSample.sampleName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">送样阶段 *</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <option value="preparing">准备中</option>
                      <option value="shipped">已发货</option>
                      <option value="received">已签收</option>
                      <option value="feedback">反馈完毕 (录入质量评语)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">物流单号</label>
                    <input
                      type="text"
                      placeholder="顺丰快递单号"
                      value={editTracking}
                      onChange={(e) => setEditTracking(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {editStatus === "feedback" && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-fadeIn">
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold">样品评估评分 (1-5 星) *</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditScore(star)}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-500"
                          >
                            <Star className={`w-5 h-5 ${star <= editScore ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold">客户具体质量/技术反馈详情 *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="如：样品测试基本通过，120度高温下漏阻轻微变动，整体物性达标..."
                        value={editFeedback}
                        onChange={(e) => setEditFeedback(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingSample(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 shadow-md"
                  >
                    提交更新
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
