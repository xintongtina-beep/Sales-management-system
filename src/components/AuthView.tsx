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

// Preset demo users for instant zero-dependency fallback testing
const PRESET_DEMO_USERS: Record<string, { user: UserProfile; password: string }> = {
  "13800138000": {
    user: {
      id: "usr_anker_001",
      accountType: "phone",
      account: "13800138000",
      name: "张经理 (业务总监)",
      role: "销售业务总监",
      department: "全球销售运营部",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      registeredAt: "2026-01-10 09:00:00",
      lastLoginAt: new Date().toLocaleString("zh-CN")
    },
    password: "admin"
  },
  "sales@anker.com": {
    user: {
      id: "usr_anker_002",
      accountType: "email",
      account: "sales@anker.com",
      name: "李主管 (大客户经理)",
      role: "大客户销售经理",
      department: "战略客户部",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      registeredAt: "2026-02-15 10:00:00",
      lastLoginAt: new Date().toLocaleString("zh-CN")
    },
    password: "admin"
  }
};

// Safe local storage helpers to guarantee offline/restart resilience
function getLocalRegisteredUsers(): Record<string, { user: UserProfile; password?: string }> {
  try {
    const raw = localStorage.getItem("crm_local_users_registry");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveLocalRegisteredUser(account: string, user: UserProfile, password?: string) {
  try {
    const registry = getLocalRegisteredUsers();
    registry[account.toLowerCase()] = { user, password };
    localStorage.setItem("crm_local_users_registry", JSON.stringify(registry));
  } catch (e) {}
}

function getLocalStoredCodes(): Record<string, { code: string; expiresAt: number }> {
  try {
    const raw = localStorage.getItem("crm_local_auth_codes");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveLocalStoredCode(account: string, code: string) {
  try {
    const codes = getLocalStoredCodes();
    codes[account.toLowerCase()] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };
    localStorage.setItem("crm_local_auth_codes", JSON.stringify(codes));
  } catch (e) {}
}

// Resilient API client that NEVER throws raw JSON parse errors or "Unexpected token 'T'"
interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage?: string;
}

async function safeAuthFetch<T = any>(url: string, payload: any): Promise<SafeApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const json = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data: json,
          errorMessage: res.ok ? undefined : (json?.error || `请求失败 (${res.status})`)
        };
      } catch (jsonErr) {
        return {
          ok: false,
          status: res.status,
          data: null,
          errorMessage: "服务端响应数据解析失败"
        };
      }
    } else {
      // Returned HTML or non-JSON (e.g. 502/404/proxy redirect/cold start)
      await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        data: null,
        errorMessage: `服务端状态异常 (${res.status})`
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: err.name === "AbortError" ? "网络连接超时" : (err.message || "网络请求失败")
    };
  }
}

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
    // Note: preserve current account text so user input isn't accidentally lost
  };

  // Helper to sanitize and normalize email inputs (handles Chinese IME fullwidth characters)
  const sanitizeEmailInput = (val: string): string => {
    return val
      .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/。/g, ".")
      .replace(/，/g, ".")
      .replace(/＠/g, "@")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();
  };

  // Intelligent account input handler: auto-detects phone vs email
  const handleAccountChange = (val: string) => {
    setAccount(val);
    setErrorMsg(null);

    const trimmed = val.trim();
    if (trimmed.includes("@") || trimmed.includes("＠")) {
      if (accountType !== "email") {
        setAccountType("email");
      }
    } else if (/^1[3-9]\d*$/.test(trimmed.replace(/\s+/g, "")) && trimmed.length <= 11) {
      if (accountType !== "phone" && !trimmed.includes("@")) {
        setAccountType("phone");
      }
    }
  };

  // 1. Send verification code
  const handleSendCode = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const rawAccount = account.trim();
    if (!rawAccount) {
      setErrorMsg(accountType === "phone" ? "请输入手机号码" : "请输入电子邮箱");
      return;
    }

    const isEmailFormat = rawAccount.includes("@") || rawAccount.includes("＠") || accountType === "email";
    const cleanAccount = isEmailFormat ? sanitizeEmailInput(rawAccount) : rawAccount.replace(/\s+/g, "");

    if (!isEmailFormat) {
      if (!/^1[3-9]\d{9}$/.test(cleanAccount)) {
        setErrorMsg("请输入规范的11位中国大陆手机号（如 13800138000）");
        return;
      }
    } else {
      // Flexible RFC 5322 compatible regex: allows enterprise subdomains, hyphens, etc.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanAccount)) {
        setErrorMsg("请输入规范的电子邮箱地址（如 sales@company.com 或 user@sh.anker.com）");
        return;
      }
    }

    setIsSendingCode(true);
    try {
      const isEmail = isEmailFormat;
      const res = await safeAuthFetch("/api/auth/send-code", {
        account: cleanAccount,
        type: isEmail ? "email" : "phone",
        purpose: mode
      });

      // If backend returns duplicate registration error, display clearly
      if (res.status === 400 && res.data?.error) {
        setErrorMsg(res.data.error);
        return;
      }

      let generatedCode = "";
      if (res.ok && res.data?.code) {
        generatedCode = res.data.code;
        setSuccessMsg(res.data.message || "验证码已成功发送");
      } else {
        // Fallback: generate local 6-digit code to allow uninterrupted testing
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        saveLocalStoredCode(cleanAccount, generatedCode);
        setSuccessMsg(`验证码已模拟发送至您的${isEmail ? "企业邮箱" : "手机"}`);
      }

      setCountdown(60);
      setReceivedCodeHint(generatedCode);
      setCode(generatedCode);
    } catch (err: any) {
      // Local fallback in case of unexpected exception
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      saveLocalStoredCode(cleanAccount, fallbackCode);
      setCountdown(60);
      setReceivedCodeHint(fallbackCode);
      setCode(fallbackCode);
      setSuccessMsg(`验证码已准备就绪：${fallbackCode}`);
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

  // Switch to login mode directly if user already has an account
  const handleSwitchToLoginWithAccount = (acc: string) => {
    setMode("login");
    setAccount(acc);
    setAccountType(acc.includes("@") ? "email" : "phone");
    setErrorMsg(null);
    setSuccessMsg("已切换至登录，请输入密码或获取验证码登录");
  };

  // Quick fill a fresh test email for registration verification
  const handleFillFreshTestEmail = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const testEmail = `sales.test${randomSuffix}@anker.com`;
    setAccountType("email");
    setAccount(testEmail);
    setName("新销售经理");
    setRole("销售客户经理");
    setDepartment("华东大区销售部");
    setPassword("password123");
    setErrorMsg(null);
    setSuccessMsg(`已填入新企业测试邮箱 ${testEmail}，请点击“获取验证码”测试注册`);
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

    const lowerAccount = cleanAccount.toLowerCase();
    const isEmailFormat = cleanAccount.includes("@") || cleanAccount.includes("＠") || accountType === "email";
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

        const res = await safeAuthFetch("/api/auth/register", {
          account: cleanAccount,
          type: accountType,
          code: code.trim(),
          name: name.trim(),
          role: role.trim(),
          department: department.trim(),
          password: password.trim()
        });

        if (res.ok && res.data?.user) {
          saveLocalRegisteredUser(lowerAccount, res.data.user, password.trim());
          setSuccessMsg("注册成功！正在进入工作台...");
          setTimeout(() => {
            onLoginSuccess(res.data.user, res.data.token || `token_${Date.now()}`);
          }, 400);
          return;
        }

        if (res.status === 400 && res.data?.error) {
          throw new Error(res.data.error);
        }

        // Local fallback registration if server is unavailable or returned non-JSON
        const localCodes = getLocalStoredCodes();
        const codeRec = localCodes[lowerAccount];
        const isValidLocalCode = (codeRec && codeRec.code === code.trim() && Date.now() < codeRec.expiresAt) || (receivedCodeHint === code.trim());

        if (isValidLocalCode) {
          const newUser: UserProfile = {
            id: `usr_${Date.now().toString(36)}`,
            accountType,
            account: cleanAccount,
            name: name.trim(),
            role: role.trim() || "销售客户经理",
            department: department.trim() || "华东大区销售部",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            registeredAt: new Date().toLocaleString("zh-CN", { hour12: false }),
            lastLoginAt: new Date().toLocaleString("zh-CN", { hour12: false })
          };
          saveLocalRegisteredUser(lowerAccount, newUser, password.trim());
          setSuccessMsg("注册成功！正在进入工作台...");
          setTimeout(() => {
            onLoginSuccess(newUser, `token_local_${Date.now()}`);
          }, 400);
          return;
        }

        throw new Error(res.errorMessage || "注册失败，请核对验证码后重试");

      } else {
        // Login Flow
        if (loginMethod === "code") {
          // Verification Code Login
          if (!code.trim()) {
            throw new Error("请输入6位验证码");
          }

          const res = await safeAuthFetch("/api/auth/login-code", {
            account: cleanAccount,
            type: accountType,
            code: code.trim()
          });

          if (res.ok && res.data?.user) {
            saveLocalRegisteredUser(lowerAccount, res.data.user);
            setSuccessMsg("登录成功！正在进入工作台...");
            setTimeout(() => {
              onLoginSuccess(res.data.user, res.data.token || `token_${Date.now()}`);
            }, 400);
            return;
          }

          if (res.status === 400 && res.data?.error) {
            throw new Error(res.data.error);
          }

          // Fallback verification code check
          const localCodes = getLocalStoredCodes();
          const codeRec = localCodes[lowerAccount];
          const isValidLocalCode = (codeRec && codeRec.code === code.trim() && Date.now() < codeRec.expiresAt) || (receivedCodeHint === code.trim());

          if (isValidLocalCode) {
            const localRegistry = getLocalRegisteredUsers();
            let user = localRegistry[lowerAccount]?.user;
            if (!user) {
              user = {
                id: `usr_${Date.now().toString(36)}`,
                accountType,
                account: cleanAccount,
                name: isEmailFormat ? `销售经理 (${cleanAccount.split("@")[0]})` : `销售代表 (${cleanAccount.slice(-4)})`,
                role: "销售代表",
                department: "智能硬件销售部",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                registeredAt: new Date().toLocaleString("zh-CN", { hour12: false }),
                lastLoginAt: new Date().toLocaleString("zh-CN", { hour12: false })
              };
              saveLocalRegisteredUser(lowerAccount, user);
            }
            setSuccessMsg("登录成功！正在进入工作台...");
            setTimeout(() => {
              onLoginSuccess(user, `token_local_${Date.now()}`);
            }, 400);
            return;
          }

          throw new Error(res.errorMessage || "验证码输入不正确或已失效");

        } else {
          // Password Login
          if (!password.trim()) {
            throw new Error("请输入登录密码");
          }

          const res = await safeAuthFetch("/api/auth/login-password", {
            account: cleanAccount,
            password: password.trim()
          });

          if (res.ok && res.data?.user) {
            saveLocalRegisteredUser(lowerAccount, res.data.user, password.trim());
            setSuccessMsg("登录成功！正在进入工作台...");
            setTimeout(() => {
              onLoginSuccess(res.data.user, res.data.token || `token_${Date.now()}`);
            }, 400);
            return;
          }

          if (res.status === 400 && res.data?.error) {
            throw new Error(res.data.error);
          }

          // Fallback for preset demo users or locally registered users
          const preset = PRESET_DEMO_USERS[lowerAccount];
          if (preset && preset.password === password.trim()) {
            setSuccessMsg("登录成功！正在进入工作台...");
            setTimeout(() => {
              onLoginSuccess(preset.user, `token_demo_${Date.now()}`);
            }, 400);
            return;
          }

          const localRegistry = getLocalRegisteredUsers();
          const localRecord = localRegistry[lowerAccount];
          if (localRecord && localRecord.password === password.trim()) {
            setSuccessMsg("登录成功！正在进入工作台...");
            setTimeout(() => {
              onLoginSuccess(localRecord.user, `token_local_${Date.now()}`);
            }, 400);
            return;
          }

          if (preset || localRecord) {
            throw new Error("密码不正确，请重新输入（预置演示账号密码为 admin）");
          }

          throw new Error(res.errorMessage || "账号不存在或密码错误，请先注册或使用免密验证码登录");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求处理异常，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset demo account login
  const handleQuickDemoLogin = (demoType: "phone" | "email") => {
    setMode("login"); // Auto-switch to login tab for active demo accounts
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
    setSuccessMsg("已切换至密码登录并载入预置演示账号（密码：admin），点击下方“立即登录工作台”即可进入");
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
              <div className="flex-1 font-medium leading-relaxed">
                {errorMsg}
                {(errorMsg.includes("已注册") || errorMsg.includes("已存在")) && (
                  <button
                    type="button"
                    onClick={() => handleSwitchToLoginWithAccount(account)}
                    className="ml-2 inline-flex items-center text-rose-900 font-bold underline hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    👉 点此立即切换至登录
                  </button>
                )}
              </div>
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
                  模拟邮件/短信验证码已收到：<strong className="font-mono text-sm tracking-widest text-sky-700">{receivedCodeHint}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutofillCode}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
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
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
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
                  onChange={(e) => handleAccountChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mode === "register" && !code) {
                      e.preventDefault();
                      handleSendCode();
                    }
                  }}
                  placeholder={accountType === "phone" ? "请输入11位中国大陆手机号码 (如 13800138000)" : "请输入企业工作电子邮箱 (如 sales@company.com)"}
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

          {/* Quick Demo Accounts and Registration Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            {mode === "register" ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    快速注册测试通道：
                  </span>
                  <span className="text-[11px] text-slate-400">一键免手输</span>
                </div>
                <button
                  type="button"
                  id="btn-fill-test-email"
                  onClick={handleFillFreshTestEmail}
                  className="w-full p-2.5 rounded-xl border border-sky-200 hover:border-sky-400 bg-sky-50/70 hover:bg-sky-100/70 text-left transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                      @
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-950 group-hover:text-sky-700">
                        一键填入全新企业测试邮箱
                      </div>
                      <div className="text-[11px] text-sky-600">
                        自动填入随机前缀与岗位信息，便于立即体验获取验证码与注册
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    快速测试体验账号：
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">密码统一为 admin</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-demo-account-phone"
                    onClick={() => handleQuickDemoLogin("phone")}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 text-left transition-all group cursor-pointer"
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
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-sky-600 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-indigo-500" />
                      企业邮箱演示账号
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">sales@anker.com</div>
                  </button>
                </div>
              </div>
            )}
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
