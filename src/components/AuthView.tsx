import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  KeyRound,
  Eye,
  EyeOff,
  UserCheck
} from "lucide-react";
import { UserProfile, AppBrandConfig } from "../types";

interface AuthViewProps {
  brandConfig: AppBrandConfig;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  initialMode?: "login" | "register";
}

export default function AuthView({ 
  brandConfig, 
  onLoginSuccess,
  initialMode = "login"
}: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  // Login method: "code" (验证码免密登录) | "password" (密码登录)
  const [loginMethod, setLoginMethod] = useState<"code" | "password">("code");
  // Account type: "phone" | "email"
  const [accountType, setAccountType] = useState<"phone" | "email">("phone");

  // Form states
  const [account, setAccount] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("华东大区销售部");
  const [role, setRole] = useState("销售客户经理");

  // Verification code countdown & feedback
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [receivedCodeHint, setReceivedCodeHint] = useState<string | null>(null);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Clean error when switching mode or tab
  const handleSwitchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCode("");
  };

  const handleSwitchAccountType = (type: "phone" | "email") => {
    setAccountType(type);
    setErrorMsg(null);
    setReceivedCodeHint(null);
    setAccount("");
    setCode("");
  };

  // 1. Send verification code
  const handleSendCode = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanAccount = account.trim();
    if (!cleanAccount) {
      setErrorMsg(accountType === "phone" ? "请输入手机号码" : "请输入电子邮箱");
      return;
    }

    if (accountType === "phone" && !/^1[3-9]\d{9}$/.test(cleanAccount)) {
      setErrorMsg("请输入规范的11位中国大陆手机号（如 13800138000）");
      return;
    }

    if (accountType === "email" && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanAccount)) {
      setErrorMsg("请输入规范的电子邮箱地址（如 sales@company.com）");
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: cleanAccount,
          type: accountType,
          purpose: mode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "获取验证码失败");
      }

      setCountdown(60);
      setSuccessMsg(data.message || "验证码已发送");
      if (data.code) {
        setReceivedCodeHint(data.code);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "网络请求失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  // Quick autofill verification code
  const handleAutofillCode = () => {
    if (receivedCodeHint) {
      setCode(receivedCodeHint);
      setSuccessMsg("已为您自动填入验证码");
    }
  };

  // 2. Submit form (Register or Login)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanAccount = account.trim();
    if (!cleanAccount) {
      setErrorMsg(accountType === "phone" ? "请输入手机号码" : "请输入电子邮箱");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "register") {
        // Registration with Verification Code
        if (!code.trim()) {
          throw new Error("请输入6位验证码");
        }
        if (!name.trim()) {
          throw new Error("请输入您的真实姓名");
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: cleanAccount,
            type: accountType,
            code: code.trim(),
            name: name.trim(),
            role: role.trim(),
            department: department.trim(),
            password: password.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "注册失败");
        }

        setSuccessMsg("注册成功！正在进入工作台...");
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 500);

      } else {
        // Login Flow
        if (loginMethod === "code") {
          // Verification Code Login
          if (!code.trim()) {
            throw new Error("请输入6位验证码");
          }

          const res = await fetch("/api/auth/login-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              account: cleanAccount,
              type: accountType,
              code: code.trim()
            })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "登录失败");
          }

          setSuccessMsg("登录成功！正在进入工作台...");
          setTimeout(() => {
            onLoginSuccess(data.user, data.token);
          }, 400);

        } else {
          // Password Login
          if (!password.trim()) {
            throw new Error("请输入登录密码");
          }

          const res = await fetch("/api/auth/login-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              account: cleanAccount,
              password: password.trim()
            })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "密码登录失败");
          }

          setSuccessMsg("登录成功！正在进入工作台...");
          setTimeout(() => {
            onLoginSuccess(data.user, data.token);
          }, 400);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求处理失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset demo account login
  const handleQuickDemoLogin = (demoType: "phone" | "email") => {
    if (demoType === "phone") {
      setAccountType("phone");
      setAccount("13800138000");
      setLoginMethod("password");
      setPassword("admin");
    } else {
      setAccountType("email");
      setAccount("sales@anker.com");
      setLoginMethod("password");
      setPassword("admin");
    }
    setErrorMsg(null);
    setSuccessMsg("已载入预置演示账号，点击登录即可进入");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4 sm:p-6" id="auth-view-page">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Brand Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-900 p-7 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 mb-3 border border-white/10">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">{brandConfig.name}</h1>
          <p className="text-xs text-slate-300 font-mono mt-1">{brandConfig.subtitle} · 智能营销管理工作台</p>
          
          {/* Mode Switch Pills (登录 vs 注册) */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 mt-5 shadow-inner">
            <button
              type="button"
              id="tab-switch-login"
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              用户登录
            </button>
            <button
              type="button"
              id="tab-switch-register"
              onClick={() => handleSwitchMode("register")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              快速注册新账号
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-7">
          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in" id="auth-error-alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-in fade-in" id="auth-success-alert">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Verification Code Dispatch Hint Banner (Instant Testing Feature) */}
          {receivedCodeHint && (
            <div className="mb-5 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between shadow-2xs animate-in slide-in-from-top-2" id="verification-code-hint-box">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>
                  模拟短信/邮件已收到：<strong className="font-mono text-sm tracking-widest text-sky-700">{receivedCodeHint}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutofillCode}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors"
                id="btn-autofill-verification-code"
              >
                点此自动填入
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selector: Mobile Phone vs Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  {mode === "register" ? "注册方式" : "登录账号"}
                </label>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    id="tab-account-phone"
                    onClick={() => handleSwitchAccountType("phone")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                      accountType === "phone"
                        ? "bg-white text-sky-600 shadow-2xs font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    手机号码
                  </button>
                  <button
                    type="button"
                    id="tab-account-email"
                    onClick={() => handleSwitchAccountType("email")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                      accountType === "email"
                        ? "bg-white text-sky-600 shadow-2xs font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    企业邮箱
                  </button>
                </div>
              </div>

              {/* Account Input Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {accountType === "phone" ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  id="input-auth-account"
                  type={accountType === "phone" ? "tel" : "email"}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={accountType === "phone" ? "请输入11位中国大陆手机号码" : "请输入企业工作电子邮箱"}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            {/* In Login Mode: Choose between Verification Code Login or Password Login */}
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs pt-1 pb-1">
                <span className="text-slate-400">认证方式：</span>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    id="btn-switch-code-login"
                    onClick={() => setLoginMethod("code")}
                    className={`font-semibold transition-colors pb-0.5 border-b-2 ${
                      loginMethod === "code"
                        ? "border-sky-500 text-sky-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    验证码快捷免密登录
                  </button>
                  <button
                    type="button"
                    id="btn-switch-pwd-login"
                    onClick={() => setLoginMethod("password")}
                    className={`font-semibold transition-colors pb-0.5 border-b-2 ${
                      loginMethod === "password"
                        ? "border-sky-500 text-sky-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    密码登录
                  </button>
                </div>
              </div>
            )}

            {/* Verification Code Section (Shown in Register mode OR when Login method is 'code') */}
            {(mode === "register" || (mode === "login" && loginMethod === "code")) && (
              <div>
                <label htmlFor="input-auth-code" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {accountType === "phone" ? "短信验证码" : "邮箱验证码"} <span className="text-rose-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="input-auth-code"
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="请输入6位验证码"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-mono tracking-widest text-slate-900 outline-hidden transition-all"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    id="btn-send-verification-code"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || isSendingCode}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shrink-0 border border-slate-200 flex items-center gap-1.5"
                  >
                    {isSendingCode ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                    ) : countdown > 0 ? (
                      `${countdown}s 后重新发送`
                    ) : (
                      "获取验证码"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Additional Fields for Registration */}
            {mode === "register" && (
              <div className="space-y-3 pt-1 border-t border-slate-100 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="input-reg-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                      真实姓名 <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="input-reg-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="如: 陈明"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-reg-role" className="block text-xs font-bold text-slate-700 mb-1.5">
                      职位角色
                    </label>
                    <select
                      id="input-reg-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden bg-white"
                    >
                      <option value="销售客户经理">销售客户经理</option>
                      <option value="高级销售代表">高级销售代表</option>
                      <option value="大客户业务总监">大客户业务总监</option>
                      <option value="技术支持专家">技术支持专家</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="input-reg-department" className="block text-xs font-bold text-slate-700 mb-1.5">
                    所属部门 / 团队
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-reg-department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="如: 华东大区销售一部"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-reg-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    设置登录密码 <span className="text-slate-400 font-normal">(可选，用于后续密码登录)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="可留空或设置初始密码"
                      className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password input when in Login Mode + password method */}
            {mode === "login" && loginMethod === "password" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="input-login-password" className="text-xs font-bold text-slate-700">
                    登录密码 <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("code")}
                    className="text-[11px] text-sky-600 hover:underline"
                  >
                    忘记密码？用验证码登录
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入登录密码（演示账号默认: admin）"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              id="btn-auth-submit"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>正在处理中...</span>
                </>
              ) : mode === "register" ? (
                <>
                  <span>完成注册并进入系统</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>立即登录工作台</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts for effortless verification */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                快速测试体验账号：
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-account-phone"
                onClick={() => handleQuickDemoLogin("phone")}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-sky-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-sky-500" />
                  手机号演示账号
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">13800138000</div>
              </button>

              <button
                type="button"
                id="btn-demo-account-email"
                onClick={() => handleQuickDemoLogin("email")}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-sky-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-500" />
                  企业邮箱演示账号
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">sales@anker.com</div>
              </button>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="mt-5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>企业级安全加密传输 · 验证码5分钟有效</span>
          </div>
        </div>
      </div>
    </div>
  );
}
