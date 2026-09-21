import React, { useState } from "react";
import { Sparkles, Check, RotateCcw, X, Edit3, Building2 } from "lucide-react";
import { AppBrandConfig } from "../types";

interface CustomizeAppNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: AppBrandConfig;
  onSave: (newConfig: AppBrandConfig) => void;
}

const PRESET_NAMES = [
  { name: "销售管家", subtitle: "Anker AI Powered" },
  { name: "智能销售CRM", subtitle: "Enterprise Sales Hub" },
  { name: "商业增长工作台", subtitle: "AI驱动 · 全流程赋能" },
  { name: "安克销售助手", subtitle: "Anker Innovation Sales" },
  { name: "客户与拜访管理系统", subtitle: "智能数字化营销中心" },
  { name: "智赢销售云", subtitle: "SaaS Business Suite" },
];

export default function CustomizeAppNameModal({
  isOpen,
  onClose,
  brandConfig,
  onSave,
}: CustomizeAppNameModalProps) {
  const [name, setName] = useState(brandConfig.name);
  const [subtitle, setSubtitle] = useState(brandConfig.subtitle);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || "销售管家";
    const trimmedSubtitle = subtitle.trim() || "Anker AI Powered";
    onSave({
      name: trimmedName,
      subtitle: trimmedSubtitle,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 450);
  };

  const handleResetDefault = () => {
    setName("销售管家");
    setSubtitle("Anker AI Powered");
  };

  const handleApplyPreset = (preset: { name: string; subtitle: string }) => {
    setName(preset.name);
    setSubtitle(preset.subtitle);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="customize-app-name-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        id="customize-app-name-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">自定义软件名称</h3>
              <p className="text-xs text-slate-500 mt-0.5">个性化配置系统主标题与企业副标识</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
            id="btn-close-app-name-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Live Preview Card */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              效果实时预览 (侧边栏效果)
            </label>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center space-x-3.5 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-sans font-bold tracking-tight text-white text-base leading-tight truncate">
                  {name.trim() || "销售管家"}
                </h4>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  {subtitle.trim() || "Anker AI Powered"}
                </p>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-medium px-2 py-0.5 rounded-full border border-sky-500/30 shrink-0">
                预览
              </span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="input-custom-app-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                软件主名称 <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-custom-app-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="例如：销售管家、智能销售CRM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                required
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>显示于侧边栏顶部及浏览器标签页</span>
                <span>{name.length}/30</span>
              </div>
            </div>

            <div>
              <label htmlFor="input-custom-app-subtitle" className="block text-xs font-bold text-slate-700 mb-1.5">
                副标题 / 企业标识
              </label>
              <input
                id="input-custom-app-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={40}
                placeholder="例如：Anker AI Powered、某某集团销售中心"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>辅助标语或企业版本标识</span>
                <span>{subtitle.length}/40</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                推荐预设方案：
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-slate-500 hover:text-sky-600 flex items-center gap-1 transition-colors"
                id="btn-reset-default-app-name"
              >
                <RotateCcw className="w-3 h-3" />
                恢复默认
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NAMES.map((preset, idx) => {
                const isSelected = name === preset.name && subtitle === preset.subtitle;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-sky-50 text-sky-700 border border-sky-300 font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              id="btn-cancel-custom-name"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5"
              id="btn-save-custom-name"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  已保存
                </>
              ) : (
                "保存并应用"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
