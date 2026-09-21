import React, { useState } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  RefreshCw, 
  Search,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Customer, FollowUpAlert } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface FollowUpViewProps {
  customers: Customer[];
  followUpAlerts: FollowUpAlert[];
  onTriggerCheckIn: (customerId: string, date: string, note: string) => void;
}

export default function FollowUpView({ 
  customers, 
  followUpAlerts,
  onTriggerCheckIn
}: FollowUpViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "overdue" | "due_today" | "upcoming">("all");
  const [checkingInCust, setCheckingInCust] = useState<FollowUpAlert | null>(null);
  const [checkInNote, setCheckInNote] = useState("");

  const filteredAlerts = followUpAlerts.filter(a => {
    const matchesSearch = a.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || a.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkingInCust) return;

    const todayStr = new Date().toISOString().split("T")[0];
    onTriggerCheckIn(checkingInCust.customerId, todayStr, checkInNote);
    
    setCheckingInCust(null);
    setCheckInNote("");
  };

  return (
    <div className="space-y-6" id="followup-view-root">
      {/* Search and stats header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="followup-filters">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索跟进客户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="all">全部提醒</option>
            <option value="overdue">已逾期未回访</option>
            <option value="due_today">今日需回访</option>
            <option value="upcoming">正常跟进中</option>
          </select>
        </div>

        <div className="flex space-x-3 text-xs font-semibold leading-none shrink-0" id="followup-summary-pills">
          <span className="flex items-center bg-rose-50 text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
            已逾期: {followUpAlerts.filter(a => a.status === "overdue").length} 家
          </span>
          <span className="flex items-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl border border-indigo-100">
            正常跟进: {followUpAlerts.filter(a => a.status === "upcoming").length} 家
          </span>
        </div>
      </div>

      {/* Grid of follow-up reminder lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="followup-alerts-grid">
        {filteredAlerts.map((alert) => {
          const isOverdue = alert.status === "overdue";
          const isToday = alert.status === "due_today";

          return (
            <div 
              key={alert.id} 
              className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-200 transition-colors ${
                isOverdue 
                  ? "border-rose-100" 
                  : isToday 
                    ? "border-amber-100 bg-amber-500/[0.01]" 
                    : "border-slate-100"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{alert.customerName}</span>
                    </h4>
                  </div>

                  {isOverdue ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center space-x-0.5 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>已逾期 {Math.abs(alert.daysRemaining)} 天</span>
                    </span>
                  ) : isToday ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center space-x-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>今日到期</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      正常跟进：剩 {alert.daysRemaining} 天
                    </span>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 py-2 border-t border-slate-50 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 block mb-0.5">上次跟进拜访时间</span>
                    <span className="font-semibold text-slate-700 font-mono">{alert.lastFollowUpDate || "无跟进历史"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">预计下次到期时间</span>
                    <span className={`font-semibold font-mono ${isOverdue ? "text-rose-500" : "text-slate-700"}`}>
                      {alert.nextFollowUpDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-medium">约定跟进周期：30天</span>
                <button
                  id={`check-in-btn-${alert.customerId}`}
                  onClick={() => setCheckingInCust(alert)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>记一次回访</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400 col-span-2 flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <span>客户拜访跟进均正常，暂无到期回访事项！</span>
          </div>
        )}
      </div>

      {/* Record Check-in Modal Dialog */}
      <AnimatePresence>
        {checkingInCust && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="checkin-modal-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4"
              id="checkin-modal"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">登记客户日常回访跟进</h3>
                <button onClick={() => setCheckingInCust(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleCheckInSubmit} className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">回访跟进客户</span>
                  <span className="font-bold text-slate-800 text-sm">{checkingInCust.customerName}</span>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">本次回访交流要点与备注 *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="如：今日致电跟进样品测试情况，林总表示发热量大幅改善，他们技术正在出具评估报告，预计下周完成整机封板..."
                    value={checkInNote}
                    onChange={(e) => setCheckInNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg leading-relaxed focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-[10px] text-indigo-600 leading-relaxed font-semibold">
                  💡 注意：点击“确认回访”后，系统将自动把该客户的【上次跟进日期】更新为今天，并根据其回访周期自动将下次回访周期倒计时复位。
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCheckingInCust(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 shadow-md"
                  >
                    确认回访
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
