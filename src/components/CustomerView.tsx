import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Building2, 
  Sparkles, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Star,
  UserPlus,
  Edit2,
  Copy,
  MessageSquare
} from "lucide-react";
import { Customer, Contact } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CustomerViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  initialSelectedCustomerId?: string | null;
  onClearFocusCustomerId?: () => void;
}

export default function CustomerView({ 
  customers, 
  onAddCustomer, 
  onUpdateCustomer,
  onDeleteCustomer,
  initialSelectedCustomerId,
  onClearFocusCustomerId
}: CustomerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  // Synchronize initialSelectedCustomerId from outside (e.g. from the map click)
  useEffect(() => {
    if (initialSelectedCustomerId) {
      const found = customers.find(c => c.id === initialSelectedCustomerId);
      if (found) {
        setSelectedCustomer(found);
        // Clear focus so we can navigate around without resetting selectedCustomer repeatedly
        onClearFocusCustomerId?.();
      }
    }
  }, [initialSelectedCustomerId, customers, onClearFocusCustomerId]);

  // Form State
  const [companySearchName, setCompanySearchName] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [formName, setFormName] = useState("");
  const [formCreditCode, setFormCreditCode] = useState("");
  const [formLegalRep, setFormLegalRep] = useState("");
  const [formCapital, setFormCapital] = useState("");
  const [formEstablishDate, setFormEstablishDate] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formScope, setFormScope] = useState("");
  
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formIndustry, setFormIndustry] = useState("消费电子");
  const [formFollowUpCycle, setFormFollowUpCycle] = useState(30);

  // Extra Industrial Mapped Fields & Phase 3 Advanced States
  const [formFormerNames, setFormFormerNames] = useState("无");
  const [formPaidInCapital, setFormPaidInCapital] = useState("");
  const [formCompanyType, setFormCompanyType] = useState("");
  const [formIndustryCategory, setFormIndustryCategory] = useState("");
  const [formRegStatus, setFormRegStatus] = useState("存续");
  const [formRiskTags, setFormRiskTags] = useState<string[]>([]);
  const [formAssociatedEntities, setFormAssociatedEntities] = useState<any[]>([]);
  const [formCompetitors, setFormCompetitors] = useState<string[]>([]);
  const [formChangeLogs, setFormChangeLogs] = useState<any[]>([]);

  // State for multiple contacts in "Add Customer" form
  const [formContacts, setFormContacts] = useState<Omit<Contact, "id">[]>([
    { name: "", title: "", department: "", phone: "", wechat: "", email: "", role: "经办人", closeness: 3 }
  ]);

  // States for adding/editing contact on an existing selected customer
  const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null); // null means adding a new contact
  const [contactFormName, setContactFormName] = useState("");
  const [contactFormTitle, setContactFormTitle] = useState("");
  const [contactFormDept, setContactFormDept] = useState("");
  const [contactFormPhone, setContactFormPhone] = useState("");
  const [contactFormWechat, setContactFormWechat] = useState("");
  const [contactFormEmail, setContactFormEmail] = useState("");
  const [contactFormRole, setContactFormRole] = useState<"决策人" | "影响人" | "使用者" | "经办人">("经办人");
  const [contactFormCloseness, setContactFormCloseness] = useState<number>(3);

  // Search source selection & simulation toggle
  const [searchSource, setSearchSource] = useState<"tianyancha" | "qichacha" | "qixinbao">("tianyancha");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [searchCandidates, setSearchCandidates] = useState<any[]>([]);
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [apiQuotaState, setApiQuotaState] = useState<any>(null);
  const [searchStep, setSearchStep] = useState<"idle" | "candidates" | "selected">("idle");

  // Multi-source automated lookup pipeline
  const handleFetchCommercialInfo = async () => {
    if (!companySearchName.trim()) {
      setAiError("请输入公司名称或统一社会信用代码进行检索");
      return;
    }
    setIsAiLoading(true);
    setAiError("");
    setSearchWarnings([]);
    setSearchCandidates([]);
    setSearchStep("idle");

    try {
      const res = await fetch("/api/enterprise/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: companySearchName,
          source: searchSource,
          simulateFail: simulateFailure
        }),
      });

      if (!res.ok) {
        throw new Error("检索候选企业失败");
      }

      const searchData = await res.json();
      
      if (searchData.warnings && searchData.warnings.length > 0) {
        setSearchWarnings(searchData.warnings);
      }
      if (searchData.quota) {
        setApiQuotaState(searchData.quota);
      }

      const candidates = searchData.candidates || [];
      if (candidates.length === 0) {
        setAiError("🔍 工商库中查无该企业名称。请核对拼写或点此直接“手动录入”业务字段。");
        setSearchStep("idle");
      } else if (candidates.length === 1) {
        // Automatically fetch details if single match
        await handleSelectCandidate(candidates[0]);
      } else {
        setSearchCandidates(candidates);
        setSearchStep("candidates");
      }
    } catch (err) {
      console.error(err);
      setAiError("连接工商数据服务故障。主数据源响应超时，网络无法调通，已自动切换备用源或建议手动填写。");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectCandidate = async (candidate: any) => {
    setIsAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/enterprise/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: candidate.name,
          creditCode: candidate.creditCode,
          source: searchSource,
          simulateFail: simulateFailure
        })
      });

      if (!res.ok) {
        throw new Error("获取企业工商详情失败");
      }

      const detailData = await res.json();
      if (detailData.warnings && detailData.warnings.length > 0) {
        setSearchWarnings(prev => Array.from(new Set([...prev, ...detailData.warnings])));
      }
      if (detailData.quota) {
        setApiQuotaState(detailData.quota);
      }

      const d = detailData.detail;
      if (d) {
        setFormName(d.name || candidate.name);
        setFormCreditCode(d.creditCode || candidate.creditCode || "");
        setFormLegalRep(d.legalRep || candidate.legalRep || "");
        setFormCapital(d.capital || "");
        setFormPaidInCapital(d.paidInCapital || d.capital || "");
        setFormEstablishDate(d.establishDate || "");
        setFormAddress(d.address || "");
        setFormScope(d.scope || "");
        setFormFormerNames(d.formerNames || "无");
        setFormCompanyType(d.companyType || "有限责任公司");
        setFormIndustryCategory(d.industryCategory || "科技推广和应用服务业");
        setFormRegStatus(d.regStatus || "存续");
        
        setFormRiskTags(d.riskTags || []);
        setFormAssociatedEntities(d.associatedEntities || []);
        setFormCompetitors(d.competitors || []);
        setFormChangeLogs(d.changeLogs || []);

        setSearchStep("selected");
      } else {
        throw new Error("查询未返回详情信息");
      }
    } catch (err) {
      console.error(err);
      setAiError("调用接口抓取企业详细工商字段失败。");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit new customer
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validFormContacts = formContacts.filter(c => c.name.trim() !== "");
    if (validFormContacts.length === 0) {
      alert("请至少填写一位联系人姓名与电话！");
      return;
    }
    
    const firstContact = validFormContacts[0];
    if (!formName || !firstContact.name || !firstContact.phone) {
      alert("请填写公司名称并确保首位联系人姓名和电话完整！");
      return;
    }

    const finalContacts: Contact[] = validFormContacts.map((c, idx) => ({
      ...c,
      id: `c-${Date.now()}-${idx}`
    }));

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: formName,
      creditCode: formCreditCode,
      legalRep: formLegalRep,
      capital: formCapital,
      establishDate: formEstablishDate,
      address: formAddress,
      scope: formScope,
      contactPerson: firstContact.name,
      contactPhone: firstContact.phone,
      contactEmail: firstContact.email,
      contacts: finalContacts,
      industry: formIndustry,
      followUpCycle: Number(formFollowUpCycle),
      lastFollowUp: undefined,
      nextFollowUp: new Date(Date.now() + Number(formFollowUpCycle) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "active",
      // Extra fields
      formerNames: formFormerNames,
      paidInCapital: formPaidInCapital,
      companyType: formCompanyType,
      industryCategory: formIndustryCategory,
      regStatus: formRegStatus,
      riskTags: formRiskTags,
      associatedEntities: formAssociatedEntities,
      competitors: formCompetitors,
      changeLogs: formChangeLogs
    };

    onAddCustomer(newCustomer);
    setSelectedCustomer(newCustomer);
    setShowAddModal(false);
    resetForm();
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!contactFormName || !contactFormPhone) {
      alert("请填写联系人姓名和手机号！");
      return;
    }

    const currentContacts = selectedCustomer.contacts && selectedCustomer.contacts.length > 0 
      ? [...selectedCustomer.contacts] 
      : [
          {
            id: "c-default",
            name: selectedCustomer.contactPerson || "首要联系人",
            title: "首要联系人",
            department: "业务部",
            phone: selectedCustomer.contactPhone || "",
            wechat: "—",
            email: selectedCustomer.contactEmail || "",
            role: "经办人" as const,
            closeness: 3
          }
        ];

    let updatedContacts: Contact[] = [];
    if (editingContactId) {
      // Edit mode
      updatedContacts = currentContacts.map(c => 
        c.id === editingContactId 
          ? {
              ...c,
              name: contactFormName,
              title: contactFormTitle,
              department: contactFormDept,
              phone: contactFormPhone,
              wechat: contactFormWechat,
              email: contactFormEmail,
              role: contactFormRole,
              closeness: contactFormCloseness
            }
          : c
      );
    } else {
      // Add mode
      const newContact: Contact = {
        id: `c-${Date.now()}`,
        name: contactFormName,
        title: contactFormTitle,
        department: contactFormDept,
        phone: contactFormPhone,
        wechat: contactFormWechat,
        email: contactFormEmail,
        role: contactFormRole,
        closeness: contactFormCloseness
      };
      updatedContacts = [...currentContacts, newContact];
    }

    const primary = updatedContacts[0];
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      contacts: updatedContacts,
      contactPerson: primary ? primary.name : "",
      contactPhone: primary ? primary.phone : "",
      contactEmail: primary ? primary.email : ""
    };

    onUpdateCustomer(updatedCustomer);
    setSelectedCustomer(updatedCustomer);
    setIsEditingContact(false);
    setEditingContactId(null);
  };

  const handleDeleteContact = (contactId: string) => {
    if (!selectedCustomer) return;
    const currentContacts = selectedCustomer.contacts && selectedCustomer.contacts.length > 0 
      ? selectedCustomer.contacts 
      : [
          {
            id: "c-default",
            name: selectedCustomer.contactPerson || "首要联系人",
            title: "首要联系人",
            department: "业务部",
            phone: selectedCustomer.contactPhone || "",
            wechat: "—",
            email: selectedCustomer.contactEmail || "",
            role: "经办人" as const,
            closeness: 3
          }
        ];
    
    if (currentContacts.length <= 1) {
      alert("每个客户必须保留至少一个联系人！");
      return;
    }

    if (!confirm("确定要删除该联系人吗？")) return;

    const updatedContacts = currentContacts.filter(c => c.id !== contactId);
    const primary = updatedContacts[0];

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      contacts: updatedContacts,
      contactPerson: primary ? primary.name : "",
      contactPhone: primary ? primary.phone : "",
      contactEmail: primary ? primary.email : ""
    };

    onUpdateCustomer(updatedCustomer);
    setSelectedCustomer(updatedCustomer);
  };

  const handleStartEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setContactFormName(contact.name);
    setContactFormTitle(contact.title);
    setContactFormDept(contact.department);
    setContactFormPhone(contact.phone);
    setContactFormWechat(contact.wechat || "");
    setContactFormEmail(contact.email || "");
    setContactFormRole(contact.role);
    setContactFormCloseness(contact.closeness);
    setIsEditingContact(true);
  };

  const handleStartAddContact = () => {
    setEditingContactId(null);
    setContactFormName("");
    setContactFormTitle("");
    setContactFormDept("");
    setContactFormPhone("");
    setContactFormWechat("");
    setContactFormEmail("");
    setContactFormRole("经办人");
    setContactFormCloseness(3);
    setIsEditingContact(true);
  };

  const resetForm = () => {
    setCompanySearchName("");
    setFormName("");
    setFormCreditCode("");
    setFormLegalRep("");
    setFormCapital("");
    setFormFormerNames("无");
    setFormPaidInCapital("");
    setFormCompanyType("");
    setFormIndustryCategory("");
    setFormRegStatus("存续");
    setFormRiskTags([]);
    setFormAssociatedEntities([]);
    setFormCompetitors([]);
    setFormChangeLogs([]);
    setSearchWarnings([]);
    setSearchCandidates([]);
    setSearchStep("idle");
    setFormEstablishDate("");
    setFormAddress("");
    setFormScope("");
    setFormContactPerson("");
    setFormContactPhone("");
    setFormContactEmail("");
    setFormContacts([
      { name: "", title: "", department: "", phone: "", wechat: "", email: "", role: "经办人", closeness: 3 }
    ]);
    setFormIndustry("消费电子");
    setFormFollowUpCycle(30);
    setAiError("");
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === "all" || c.industry === selectedIndustry;
    const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const industries = Array.from(new Set(customers.map(c => c.industry)));

  return (
    <div className="flex h-[calc(100vh-130px)] gap-6" id="customer-view-root">
      {/* Left List Pane */}
      <div className="w-1/2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3" id="customer-toolbar">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-sky-500" />
              <span>客户名录 ({filteredCustomers.length})</span>
            </h3>
            <button
              id="add-customer-btn"
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增客户</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索公司名称/联系人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="all">所有行业</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="all">所有状态</option>
              <option value="active">活跃</option>
              <option value="pending">待定</option>
            </select>
          </div>
        </div>

        {/* Customer List Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2 space-y-1" id="customer-list-container">
          {filteredCustomers.map(customer => {
            const isSelected = selectedCustomer?.id === customer.id;
            return (
              <div
                key={customer.id}
                id={`customer-item-${customer.id}`}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                  isSelected 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-xs truncate max-w-[200px]">
                      {customer.name}
                    </h4>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium leading-none shrink-0 ${
                      isSelected 
                        ? "bg-sky-600/55 text-white" 
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {customer.industry}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] opacity-75">
                    <span className="flex items-center">
                      <User className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                      {customer.contactPerson.split(" ")[0]}
                    </span>
                    <span className="font-mono">{customer.contactPhone}</span>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    customer.status === "active" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {customer.status === "active" ? "活跃" : "待定"}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-400">
              未找到匹配的客户
            </div>
          )}
        </div>
      </div>

      {/* Right Details Pane */}
      <div className="w-1/2 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden" id="customer-details-pane">
        {selectedCustomer ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Detail Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>{selectedCustomer.name}</span>
                </h3>
                <p className="text-xs text-slate-400">系统注册编号：{selectedCustomer.id}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`确认要删除客户 ${selectedCustomer.name} 吗？`)) {
                    onDeleteCustomer(selectedCustomer.id);
                    setSelectedCustomer(customers.filter(c => c.id !== selectedCustomer.id)[0] || null);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                title="删除客户"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              
              {/* Part 1: Industrial & Commercial info (工商注册登记信息) */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>工商注册登记信息</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none">
                    官方核验源
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-1">统一社会信用代码</span>
                    <span className="font-mono text-slate-700 font-medium select-all">{selectedCustomer.creditCode || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">法定代表人</span>
                    <span className="text-slate-700 font-medium">{selectedCustomer.legalRep || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">注册资本</span>
                    <span className="text-slate-700 font-medium">{selectedCustomer.capital || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">成立日期</span>
                    <span className="text-slate-700 font-medium flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      {selectedCustomer.establishDate || "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">注册地址</span>
                  <span className="text-slate-700 font-medium flex items-start">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                    {selectedCustomer.address || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">主营业务范围</span>
                  <p className="text-slate-600 leading-relaxed bg-white p-2 rounded-xl border border-slate-100/60 text-[11px]">
                    {selectedCustomer.scope || "暂无经营范围描述"}
                  </p>
                </div>
              </div>

              {/* Part 2: Multi-Contact Management (联系人管理) */}
              <div className="space-y-3" id="contacts-management-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>联系人管理 ({selectedCustomer.contacts?.length || 1})</span>
                  </span>
                  {!isEditingContact && (
                    <button
                      type="button"
                      onClick={handleStartAddContact}
                      className="flex items-center space-x-1 text-sky-500 hover:text-sky-600 font-semibold text-[10px]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>新增联系人</span>
                    </button>
                  )}
                </div>

                {isEditingContact ? (
                  <form onSubmit={handleSaveContact} className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5 mb-1.5">
                      <span className="font-bold text-slate-800 flex items-center space-x-1">
                        <UserPlus className="w-3 h-3 text-sky-500" />
                        <span>{editingContactId ? "编辑联系人" : "添加联系人"}</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { setIsEditingContact(false); setEditingContactId(null); }}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">姓名 <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="姓名"
                          value={contactFormName}
                          onChange={(e) => setContactFormName(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">职务</label>
                        <input
                          type="text"
                          placeholder="如：采购总监"
                          value={contactFormTitle}
                          onChange={(e) => setContactFormTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">部门</label>
                        <input
                          type="text"
                          placeholder="如：供应链管理部"
                          value={contactFormDept}
                          onChange={(e) => setContactFormDept(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">手机号 <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="手机号"
                          value={contactFormPhone}
                          onChange={(e) => setContactFormPhone(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">微信号</label>
                        <input
                          type="text"
                          placeholder="微信号"
                          value={contactFormWechat}
                          onChange={(e) => setContactFormWechat(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">电子邮箱</label>
                        <input
                          type="email"
                          placeholder="example@corp.com"
                          value={contactFormEmail}
                          onChange={(e) => setContactFormEmail(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">决策角色标记</label>
                        <select
                          value={contactFormRole}
                          onChange={(e) => setContactFormRole(e.target.value as any)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="决策人">决策人</option>
                          <option value="影响人">影响人</option>
                          <option value="使用者">使用者</option>
                          <option value="经办人">经办人</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5 font-semibold">关系亲密度评分</label>
                        <div className="flex items-center space-x-1 py-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              onClick={() => setContactFormCloseness(star)}
                              className={`w-4 h-4 cursor-pointer transition-all ${
                                star <= contactFormCloseness ? "text-amber-400 fill-amber-400" : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200/40">
                      <button
                        type="button"
                        onClick={() => { setIsEditingContact(false); setEditingContactId(null); }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-semibold"
                      >
                        保存联系人
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {((selectedCustomer.contacts && selectedCustomer.contacts.length > 0) 
                      ? selectedCustomer.contacts 
                      : [
                          {
                            id: "c-default",
                            name: selectedCustomer.contactPerson || "首要联系人",
                            title: "商务对接人",
                            department: "采购部",
                            phone: selectedCustomer.contactPhone || "",
                            wechat: "—",
                            email: selectedCustomer.contactEmail || "",
                            role: "经办人" as const,
                            closeness: 3
                          }
                        ]
                    ).map((contact) => {
                      // Custom role badge styling
                      let roleBadgeClass = "";
                      switch (contact.role) {
                        case "决策人":
                          roleBadgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                          break;
                        case "影响人":
                          roleBadgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                          break;
                        case "使用者":
                          roleBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
                          break;
                        case "经办人":
                          roleBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                          break;
                        default:
                          roleBadgeClass = "bg-slate-50 text-slate-600 border-slate-200";
                      }

                      return (
                        <div 
                          key={contact.id} 
                          className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col space-y-2 hover:bg-slate-50 transition-colors relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800 text-xs">{contact.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {contact.title} {contact.department ? `(${contact.department})` : ""}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadgeClass}`}>
                                {contact.role}
                              </span>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 shrink-0 ${
                                      star <= contact.closeness ? "text-amber-400 fill-amber-400" : "text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100/50 text-[10px] text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-700 font-medium">{contact.phone}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-slate-700 font-medium">{contact.wechat || "—"}</span>
                            </span>
                            <span className="flex items-center space-x-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-700 font-medium truncate">{contact.email || "—"}</span>
                            </span>
                          </div>

                          {/* Quick action edit and delete icons */}
                          <div className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1.5 bg-slate-50/95 py-0.5 px-1.5 rounded-md shadow-sm border border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleStartEditContact(contact)}
                              className="p-0.5 text-slate-400 hover:text-sky-500 transition-colors"
                              title="编辑联系人"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                              title="删除联系人"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Part 3: Relationship Lifecycle Settings */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 block">定期回访策略</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/10 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">约定回访周期</span>
                    <span className="font-semibold text-slate-800">{selectedCustomer.followUpCycle} 天 / 次</span>
                  </div>
                  <div className="bg-slate-50/10 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">预定下次跟进日期</span>
                    <span className="font-semibold text-indigo-600 font-mono flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {selectedCustomer.nextFollowUp || "未设定"}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2 p-6">
            <Users className="w-12 h-12 text-slate-200" />
            <span>请在左侧选择一个客户查看详情</span>
          </div>
        )}
      </div>

      {/* Add Customer Dialog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="add-customer-modal-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
              id="add-customer-modal"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>添加客户（支持 AI 工商注册信息自动获取）</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Search Bar with Multi-Source and Automatic Failover Switch */}
                <div className="space-y-4 bg-gradient-to-r from-sky-500/5 to-indigo-500/5 p-4 rounded-2xl border border-sky-100/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sky-100/40">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-sky-500" />
                      <span>中国工商数据官方查验系统</span>
                    </label>
                    {/* Quota Monitors */}
                    <div className="flex items-center space-x-2 text-[9px] text-slate-400">
                      <span>配额使用:</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">天眼查 {apiQuotaState?.tianyancha?.used || 842}/{apiQuotaState?.tianyancha?.limit || 1000}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">企查查 {apiQuotaState?.qichacha?.used || 456}/{apiQuotaState?.qichacha?.limit || 1000}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">启信宝 {apiQuotaState?.qixinbao?.used || 212}/{apiQuotaState?.qixinbao?.limit || 1000}</span>
                    </div>
                  </div>

                  {/* Step 1: Select Search Source (3 Sources with strengths) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block">选择核验数据源：</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div 
                        onClick={() => setSearchSource("tianyancha")}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          searchSource === "tianyancha" 
                            ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-bold text-[10px] block">1. 天眼查 (主数据源)</span>
                        <span className="text-[9px] opacity-80 block truncate">数据覆盖最全（股东、处罚等）</span>
                      </div>
                      <div 
                        onClick={() => setSearchSource("qichacha")}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          searchSource === "qichacha" 
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-bold text-[10px] block">2. 企查查 (备用兜底)</span>
                        <span className="text-[9px] opacity-80 block truncate">股权结构、招投标、司法风险</span>
                      </div>
                      <div 
                        onClick={() => setSearchSource("qixinbao")}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          searchSource === "qixinbao" 
                            ? "bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-bold text-[10px] block">3. 启信宝 (补充验证)</span>
                        <span className="text-[9px] opacity-80 block truncate">关联企业、风险扫描、信用报告</span>
                      </div>
                    </div>
                  </div>

                  {/* Failover and input */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="请输入企业官方注册全称或统一社会信用代码..."
                        value={companySearchName}
                        onChange={(e) => setCompanySearchName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetchCommercialInfo(); } }}
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        disabled={isAiLoading}
                        onClick={handleFetchCommercialInfo}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center space-x-1.5 disabled:bg-slate-300"
                      >
                        {isAiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>查询中...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>检索工商库</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Simulation Fail checkbox (API失败自动切换备用数据源) */}
                    <label className="flex items-center space-x-2 cursor-pointer select-none text-[10px] text-slate-500">
                      <input
                        type="checkbox"
                        checked={simulateFailure}
                        onChange={(e) => setSimulateFailure(e.target.checked)}
                        className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-amber-600 font-medium">⚠️ 模拟该主接口超时/故障 (体验自动秒级切换备用源并输出配额预警)</span>
                    </label>
                  </div>

                  {/* Active Warnings / Routing Failovers */}
                  {searchWarnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 space-y-1">
                      <span className="font-bold flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        智能数据路由中心决策：
                      </span>
                      {searchWarnings.map((warn, i) => (
                        <p key={i} className="pl-4 font-mono leading-tight">{warn}</p>
                      ))}
                    </div>
                  )}

                  {/* Error display */}
                  {aiError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-500 flex items-start space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">数据异常提示：</span>
                        <span>{aiError}</span>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Same-name Candidates choosing list (同名企业展示区分信息) */}
                  {searchStep === "candidates" && searchCandidates.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                      <span className="text-[10px] font-bold text-slate-700 block flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-sky-500" />
                        发现 {searchCandidates.length} 个名称类似的企业，请选择精确的企业：
                      </span>
                      <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                        {searchCandidates.map((cand, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleSelectCandidate(cand)}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block text-xs">{cand.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">信用代码：{cand.creditCode || "无"}</span>
                            </div>
                            <div className="text-right text-[10px]">
                              <span className="block text-slate-600">法人: {cand.legalRep}</span>
                              <span className="text-emerald-600 bg-emerald-50 px-1 rounded text-[8px] font-bold">{cand.regStatus || "存续"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Success Confirmation */}
                  {searchStep === "selected" && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[10px] text-emerald-800 flex items-center space-x-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">官方工商信息对接成功！</span>
                        <span>系统已成功调取 12+ 项官方字段预填至表单。您可直接在下方编辑并补充商务联系人信息。</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <span className="font-bold text-slate-800 border-l-2 border-sky-500 pl-2 block">
                      工商基础信息（可由 AI 填充）
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>公司全称 <span className="text-rose-500">*</span></span>
                          <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据可编辑</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>曾用名</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="若有，曾用名"
                          value={formFormerNames}
                          onChange={(e) => setFormFormerNames(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>统一社会信用代码</span>
                          <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="自动或手动录入"
                          value={formCreditCode}
                          onChange={(e) => setFormCreditCode(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>登记状态</span>
                          <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例：存续 / 在营"
                          value={formRegStatus}
                          onChange={(e) => setFormRegStatus(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>法定代表人</span>
                          <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="自动或手动录入"
                          value={formLegalRep}
                          onChange={(e) => setFormLegalRep(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>企业类型</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例：有限责任公司"
                          value={formCompanyType}
                          onChange={(e) => setFormCompanyType(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>注册资本</span>
                          <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例如: 1000万元人民币"
                          value={formCapital}
                          onChange={(e) => setFormCapital(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>实缴资本</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例如: 800万元人民币"
                          value={formPaidInCapital}
                          onChange={(e) => setFormPaidInCapital(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>成立日期</span>
                          <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                        </label>
                        <input
                          type="date"
                          value={formEstablishDate}
                          onChange={(e) => setFormEstablishDate(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                          <span>行业分类</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">工商数据</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例：软件和信息技术服务业"
                          value={formIndustryCategory}
                          onChange={(e) => setFormIndustryCategory(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">CRM 行业归类</label>
                        <select
                          value={formIndustry}
                          onChange={(e) => setFormIndustry(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg"
                        >
                          <option value="消费电子">消费电子</option>
                          <option value="新能源汽车">新能源汽车</option>
                          <option value="半导体芯片">半导体芯片</option>
                          <option value="智能家居">智能家居</option>
                          <option value="其他制造">其他制造</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                        <span>注册地址</span>
                        <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                      </label>
                      <input
                        type="text"
                        placeholder="企业官方登记地址"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-semibold flex items-center justify-between">
                        <span>经营范围</span>
                        <span className="text-[9px] bg-sky-50 text-sky-600 px-1 py-0.2 rounded font-medium border border-sky-100">工商数据</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="企业主要经营业务内容..."
                        value={formScope}
                        onChange={(e) => setFormScope(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 border-l-2 border-indigo-500 pl-2 block">
                        商务往来联系人名单 (支持关联多个联系人)
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormContacts(prev => [...prev, { name: "", title: "", department: "", phone: "", wechat: "", email: "", role: "经办人", closeness: 3 }])}
                        className="flex items-center space-x-1 text-sky-500 hover:text-sky-600 font-semibold text-[11px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>添加联系人</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formContacts.map((contact, index) => (
                        <div key={index} className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 relative space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                            <span className="font-bold text-slate-700 text-[11px]">
                              联系人 #{index + 1} {index === 0 ? "（首要联系人）" : ""}
                            </span>
                            {formContacts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setFormContacts(prev => prev.filter((_, idx) => idx !== index))}
                                className="text-rose-500 hover:text-rose-600 text-[10px] font-semibold"
                              >
                                删除
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">姓名 <span className="text-rose-500">*</span></label>
                              <input
                                type="text"
                                required
                                placeholder="如：林建国"
                                value={contact.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, name: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">职务</label>
                              <input
                                type="text"
                                placeholder="如：采购总监"
                                value={contact.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, title: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">部门</label>
                              <input
                                type="text"
                                placeholder="如：采购部"
                                value={contact.department}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, department: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">手机号 <span className="text-rose-500">*</span></label>
                              <input
                                type="text"
                                required
                                placeholder="如：13812345678"
                                value={contact.phone}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, phone: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">微信号</label>
                              <input
                                type="text"
                                placeholder="微信"
                                value={contact.wechat}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, wechat: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">电子邮箱</label>
                              <input
                                type="email"
                                placeholder="example@corp.com"
                                value={contact.email}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, email: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">决策角色标记</label>
                              <select
                                value={contact.role}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, role: val } : c));
                                }}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              >
                                <option value="决策人">决策人 (决策层)</option>
                                <option value="影响人">影响人 (管理层/技术)</option>
                                <option value="使用者">使用者 (一线工程师)</option>
                                <option value="经办人">经办人 (采购/经办对接)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-0.5 font-semibold">关系亲密度评分</label>
                              <div className="flex items-center space-x-1 py-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    onClick={() => {
                                      setFormContacts(prev => prev.map((c, idx) => idx === index ? { ...c, closeness: star } : c));
                                    }}
                                    className={`w-4 h-4 cursor-pointer transition-all ${
                                      star <= contact.closeness ? "text-amber-400 fill-amber-400" : "text-slate-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cycle remainder */}
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="text-slate-600 block mb-1 font-semibold">客诉/回访提醒周期 (天)</label>
                      <input
                        type="number"
                        value={formFollowUpCycle}
                        onChange={(e) => setFormFollowUpCycle(Number(e.target.value))}
                        className="w-full sm:w-1/2 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors shadow-md"
                    >
                      确认保存
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
