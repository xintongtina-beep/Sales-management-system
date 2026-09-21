import React, { useState } from "react";
import { 
  Mic, 
  Sparkles, 
  Calendar, 
  User, 
  Plus, 
  ChevronRight, 
  Volume2, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Briefcase,
  Play,
  Square,
  Search,
  Share2,
  Download,
  ExternalLink,
  Upload,
  X,
  Key,
  Check,
  RotateCcw,
  HelpCircle,
  Shield,
  Bookmark,
  Users,
  Building,
  DollarSign,
  Tag,
  FileSpreadsheet,
  Settings,
  Flame,
  FileUp,
  Image as ImageIcon
} from "lucide-react";
import { VisitRecord, Customer, TodoTask, SampleRecord } from "../types";
import { MOCK_LARK_RECORDINGS, LarkAudioRecord } from "../mockData";
import { motion, AnimatePresence } from "motion/react";

interface VisitViewProps {
  visits: VisitRecord[];
  customers: Customer[];
  onAddVisit: (visit: VisitRecord) => void;
  onAddTodo: (todo: TodoTask) => void;
  onAddSample: (sample: SampleRecord) => void;
}

export default function VisitView({ 
  visits, 
  customers, 
  onAddVisit,
  onAddTodo,
  onAddSample
}: VisitViewProps) {
  // Navigation: Sub-tab switcher
  const [activeSubTab, setActiveSubTab] = useState<"history" | "feishu">("feishu");
  
  // State for Feishu Anker Recordings & selections
  const [larkRecordings, setLarkRecordings] = useState<LarkAudioRecord[]>(MOCK_LARK_RECORDINGS);
  const [selectedLarkRec, setSelectedLarkRec] = useState<LarkAudioRecord | null>(MOCK_LARK_RECORDINGS[0]);
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(visits[0] || null);

  // Syncing / processing states
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [hasRegistered, setHasRegistered] = useState(false);

  // Feishu API & Webhook Simulator states
  const [showApiConsole, setShowApiConsole] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>("lark_act_demo8842bc9a92c103");
  const [isOAuthVerifying, setIsOAuthVerifying] = useState(false);
  const [webhookLog, setWebhookLog] = useState<string[]>([]);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // Search in transcript
  const [searchText, setSearchText] = useState("");

  // Edit transcript text in real-time (Simulating speech-to-text typo correction)
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);
  const [editingSegmentText, setEditingSegmentText] = useState("");

  // Export panel
  const [exportReportText, setExportReportText] = useState<string | null>(null);
  const [isExportCopied, setIsExportCopied] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCustomerId, setManualCustomerId] = useState(customers[0]?.id || "");
  const [manualTitle, setManualTitle] = useState("");
  const [manualTheme, setManualTheme] = useState("初次拜访");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualRep, setManualRep] = useState("张经理");
  const [manualOurParticipants, setManualOurParticipants] = useState("张经理");
  const [manualCustomerParticipants, setManualCustomerParticipants] = useState("");
  const [manualPain, setManualPain] = useState("");
  
  // Manual Competitor states
  const [manualCompBrand, setManualCompBrand] = useState("");
  const [manualCompModel, setManualCompModel] = useState("");
  const [manualCompPrice, setManualCompPrice] = useState("");
  const [manualCompUsage, setManualCompUsage] = useState("");
  const [manualCompComments, setManualCompComments] = useState("");

  const [manualConsensus, setManualConsensus] = useState("");
  const [manualTechAction, setManualTechAction] = useState("");
  const [manualSalesAction, setManualSalesAction] = useState("");

  // Drag-and-drop simulated file upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<{ name: string; url: string }[]>([]);

  // Sound play simulation
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Utility to trigger quick toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Process Lark Anker Recording via backend Gemini AI
  const handleAiProcessRecording = async () => {
    if (!selectedLarkRec) return;
    setIsSyncing(true);
    setAiAnalysisResult(null);
    setHasRegistered(false);

    try {
      const response = await fetch("/api/lark/process-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: selectedLarkRec.transcript,
          title: selectedLarkRec.title
        }),
      });

      if (!response.ok) {
        throw new Error("解析失败");
      }
      const data = await response.json();
      
      // Inject enriched model analysis items (objections, competitor extraction, participants, theme) to the result state
      const resolvedTheme = selectedLarkRec.title.includes("洽谈") ? "商务谈判" : "技术对齐";
      
      setAiAnalysisResult({
        ...data.aiSummary,
        theme: resolvedTheme,
        participants: {
          ours: ["张经理 (销售部)", "李工 (技术支持)"],
          customers: selectedLarkRec.title.includes("小米") ? ["林建国 (采购总监)"] 
                     : selectedLarkRec.title.includes("比亚迪") ? ["陈向东 (PACK工程师)"] 
                     : ["章静 (采购经理)"]
        },
        objections: selectedLarkRec.objections || [],
        competitorInfo: selectedLarkRec.competitorMentions?.[0] ? {
          brand: selectedLarkRec.competitorMentions[0].competitor,
          model: selectedLarkRec.competitorMentions[0].useCase || "—",
          price: selectedLarkRec.competitorMentions[0].price || "—",
          usage: selectedLarkRec.competitorMentions[0].useCase || "—",
          comments: selectedLarkRec.competitorMentions[0].rating || "—"
        } : undefined,
        highlightedParagraphs: selectedLarkRec.highlightedParagraphs || []
      });
      triggerToast("✨ AI 智能大模型成功分析录音！已自动提取并回写拜访纪要！");
    } catch (err) {
      console.error(err);
      triggerToast("❌ AI解析异常，请检查后端服务");
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Action: Register official visit + Tasks + Samples from AI results
  const handleRegisterFromAi = () => {
    if (!selectedLarkRec || !aiAnalysisResult) return;

    let customerId = "cust-1";
    let customerName = "小米通讯技术有限公司";
    if (selectedLarkRec.title.includes("比亚迪")) {
      customerId = "cust-2";
      customerName = "比亚迪股份有限公司";
    } else if (selectedLarkRec.title.includes("极氪")) {
      customerId = "cust-3";
      customerName = "极氪汽车（宁波）有限公司";
    } else if (selectedLarkRec.title.includes("埃安") || selectedLarkRec.title.includes("广汽")) {
      customerId = "cust-4"; // Can fallback to general customer if created
      customerName = "OPPO 广东移动通信有限公司"; // or dynamic
    }

    // A. Add official visit
    const newVisit: VisitRecord = {
      id: `visit-${Date.now()}`,
      customerId,
      customerName,
      date: selectedLarkRec.recordTime.split(" ")[0],
      salesperson: selectedLarkRec.salesperson,
      title: selectedLarkRec.title.replace("【安克录音豆】_", "").replace(".mp3", ""),
      theme: aiAnalysisResult.theme || "技术对齐",
      participants: aiAnalysisResult.participants || { ours: ["张经理"], customers: ["客户采购组"] },
      demandsAndPainPoints: aiAnalysisResult.painPoints,
      competitorInfo: aiAnalysisResult.competitorInfo,
      consensus: aiAnalysisResult.consensus,
      nextSteps: {
        techAction: aiAnalysisResult.actions.includes("研发") || aiAnalysisResult.actions.includes("技术") 
          ? "安排研发团队分析图纸，启动热仿真论证测试。" 
          : "新材料热学击穿与耐久度实验跟进及数据对齐。",
        salesAction: aiAnalysisResult.actions.includes("寄送") || aiAnalysisResult.actions.includes("样品")
          ? "一键派发并跟进样件快递发出，周五跟进客户收件状态。"
          : "编制商务报价大纲及首轮采购框架合同备忘。"
      },
      photos: selectedLarkRec.coverUrl ? [selectedLarkRec.coverUrl] : [],
      attachments: [{ name: "飞书秒记音轨文本.pdf", url: "#" }],
      transcript: selectedLarkRec.transcript,
      transcriptSegments: selectedLarkRec.transcriptSegments,
      audioDuration: selectedLarkRec.duration,
      audioUrl: selectedLarkRec.feishuMinutesUrl,
      feishuMinutesUrl: selectedLarkRec.feishuMinutesUrl,
      source: "FeishuAnker",
      status: "ready",
      objections: aiAnalysisResult.objections,
      highlightedParagraphs: aiAnalysisResult.highlightedParagraphs,
      aiSummary: aiAnalysisResult
    };
    onAddVisit(newVisit);

    // B. Add connected to-dos if specified by AI (separated for Tech and Sales)
    const actionLines = aiAnalysisResult.actions.split("\n");
    actionLines.forEach((line: string, idx: number) => {
      const cleanLine = line.replace(/^\d+[\.\、\s]*/, "").trim();
      if (cleanLine) {
        onAddTodo({
          id: `todo-lark-${Date.now()}-${idx}`,
          title: cleanLine,
          customerId,
          customerName,
          priority: idx === 0 ? "high" : "medium",
          dueDate: aiAnalysisResult.nextFollowUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          isCompleted: false,
          linkedVisitId: newVisit.id
        });
      }
    });

    // C. Add sample request if AI identified sample need
    if (aiAnalysisResult.sampleRequested && aiAnalysisResult.sampleDetails) {
      onAddSample({
        id: `samp-${Date.now()}`,
        customerId,
        customerName,
        sampleName: aiAnalysisResult.sampleDetails,
        quantity: 1,
        sendDate: new Date().toISOString().split("T")[0],
        status: "preparing"
      });
    }

    setLarkRecordings(prev => prev.map(r => r.id === selectedLarkRec.id ? { ...r, synced: true } : r));
    setHasRegistered(true);
    setSelectedVisit(newVisit);
    triggerToast("🎉 拜访、待办与送样已一键智能分发！");
  };

  // Feishu OAuth Verification Simulator
  const handleSimulateFeishuOAuth = () => {
    setIsOAuthVerifying(true);
    setTimeout(() => {
      setOauthToken(`lark_act_live_${Math.floor(100000 + Math.random() * 900000)}`);
      setIsOAuthVerifying(false);
      triggerToast("🔐 飞书开放平台 OAuth 2.0 授权成功！scope [minutes:readonly] 已激活");
    }, 1200);
  };

  // Feishu Webhook Simulator (Offline sync / delay simulation)
  const handleSimulateFeishuWebhook = () => {
    if (isSimulatingWebhook) return;
    setIsSimulatingWebhook(true);
    setWebhookLog([
      "🔄 [10:15:30] Webhook服务：接收到飞书推送事件 [minutes.minutes.recording_completed_v1]",
      "📂 [10:15:31] 系统解析：Token [lark_mq_gac_offline] 对应硬件:领夹录音豆ANK-AI-9082",
      "📡 [10:15:31] API请求：调用 GET /open-apis/minutes-v1/minutes/lark_mq_gac_offline 获取录音元数据...",
      "📜 [10:15:32] API请求：调用 GET /open-apis/minutes-v1/minute-transcript/get 获取转写音频逐字稿 (4个段落)...",
      "💾 [10:15:33] 本地数据库：音频元数据回写成功！状态由「录音关联中」更新为「录音已就绪」！"
    ]);

    setTimeout(() => {
      setLarkRecordings(prev => prev.map(rec => {
        if (rec.id === "lark-rec-4") {
          return { ...rec, status: "ready" };
        }
        return rec;
      }));
      // Force refreshing the selected item to trigger reactivity
      if (selectedLarkRec?.id === "lark-rec-4") {
        setSelectedLarkRec(prev => prev ? { ...prev, status: "ready" } : null);
      }
      setIsSimulatingWebhook(false);
      triggerToast("✅ 飞书 Webhook 实时回调处理完毕！「广汽埃安」录音已就绪！");
    }, 3000);
  };

  // Transcript Search Highlight helper
  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-slate-900 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Toggle Highlight Star for a segment
  const handleToggleTranscriptHighlight = (recId: string, segmentIdx: number) => {
    setLarkRecordings(prev => prev.map(rec => {
      if (rec.id === recId) {
        const updatedSegments = [...rec.transcriptSegments];
        const seg = updatedSegments[segmentIdx];
        seg.isHighlighted = !seg.isHighlighted;

        // Automatically update the highlightedParagraphs array
        let updatedHighlights = [...rec.highlightedParagraphs];
        if (seg.isHighlighted) {
          if (!updatedHighlights.includes(seg.text)) {
            updatedHighlights.push(seg.text);
          }
        } else {
          updatedHighlights = updatedHighlights.filter(t => t !== seg.text);
        }

        return {
          ...rec,
          transcriptSegments: updatedSegments,
          highlightedParagraphs: updatedHighlights
        };
      }
      return rec;
    }));

    // Dynamic sync to local selection
    if (selectedLarkRec?.id === recId) {
      setSelectedLarkRec(prev => {
        if (!prev) return null;
        const updatedSegments = [...prev.transcriptSegments];
        const seg = updatedSegments[segmentIdx];
        seg.isHighlighted = !seg.isHighlighted;
        
        let updatedHighlights = [...prev.highlightedParagraphs];
        if (seg.isHighlighted) {
          if (!updatedHighlights.includes(seg.text)) {
            updatedHighlights.push(seg.text);
          }
        } else {
          updatedHighlights = updatedHighlights.filter(t => t !== seg.text);
        }

        return {
          ...prev,
          transcriptSegments: updatedSegments,
          highlightedParagraphs: updatedHighlights
        };
      });
    }
  };

  // Save Transcript text corrections (speech-to-text typo adjustments)
  const handleSaveSegmentText = (recId: string, segmentIdx: number) => {
    if (editingSegmentIndex === null) return;
    
    setLarkRecordings(prev => prev.map(rec => {
      if (rec.id === recId) {
        const updatedSegments = [...rec.transcriptSegments];
        updatedSegments[segmentIdx].text = editingSegmentText;
        
        // Re-join transcript string
        const updatedTranscript = updatedSegments.map(s => `${s.speaker}：${s.text}`).join("\n");
        return {
          ...rec,
          transcriptSegments: updatedSegments,
          transcript: updatedTranscript
        };
      }
      return rec;
    }));

    if (selectedLarkRec?.id === recId) {
      setSelectedLarkRec(prev => {
        if (!prev) return null;
        const updatedSegments = [...prev.transcriptSegments];
        updatedSegments[segmentIdx].text = editingSegmentText;
        const updatedTranscript = updatedSegments.map(s => `${s.speaker}：${s.text}`).join("\n");
        return {
          ...prev,
          transcriptSegments: updatedSegments,
          transcript: updatedTranscript
        };
      });
    }

    setEditingSegmentIndex(null);
    triggerToast("✏️ 录音逐字稿文本修正成功！");
  };

  // Export report generator (Formatted report layout copyable)
  const handleGenerateExportReport = (record: any, isLark: boolean) => {
    let report = "";
    if (isLark) {
      report = `===========================================
【AI 智能大模型销售拜访纪要 - 飞书安克录音豆版】
===========================================
录音主题：${record.title}
记录来源：飞书 Anker AI 录音领夹豆 (设备已认证)
销售代表：${record.salesperson}
录制时间：${record.recordTime} (时长: ${record.duration})
妙记链接：${record.feishuMinutesUrl}

1. 【参与人员】
我方：张经理 (销售负责人)、技术支持团队
客户方：林建国采购组 / 电池材料技术中心

2. 【客户核心痛点与技术需求反馈】
${aiAnalysisResult?.painPoints || record.aiSummary?.painPoints || "（等待大模型提炼）"}

3. 【竞品信息对齐】
${record.competitorMentions?.[0] 
  ? `竞品品牌：${record.competitorMentions[0].competitor}
在用型号：${record.competitorMentions[0].useCase || "—"}
单价估算：${record.competitorMentions[0].price || "—"}
采购用量：${record.competitorMentions[0].useCase || "—"}
使用评价：${record.competitorMentions[0].rating || "—"}
语境截取："${record.competitorMentions[0].context}"`
  : "本次沟通未提及竞品或竞品信息无更新。"
}

4. 【现场重点标注对话段落】
${record.highlightedParagraphs?.map((t: string, i: number) => ` [重点标记 ${i+1}] "${t}"`).join("\n") || "暂无标记"}

5. 【双方达成共识与备忘录】
${aiAnalysisResult?.consensus || record.aiSummary?.consensus || "（等待大模型提炼）"}

6. 【下一步执行计划/任务分流】
我司技术：新方案热仿真性能论证及配合送样对齐。
我司销售：协调物流排产，同步跟踪单号并拜访首批对接人。
任务详情：
${aiAnalysisResult?.actions || record.aiSummary?.actions || "（等待大模型提炼）"}

7. 【样件索要明细】
${aiAnalysisResult?.sampleRequested ? `【需要送样】${aiAnalysisResult.sampleDetails}` : "暂无送样需求"}

生成时间：2026-07-06 UTC (由CRM系统一键生成)
===========================================`;
    } else {
      report = `===========================================
【销售拜访跟进工作汇报 - 手工登记版】
===========================================
拜访主题：${record.title}
客户公司：${record.customerName}
跟进日期：${record.date}
销售代表：${record.salesperson}
拜访主题：${record.theme || "技术/商务沟通"}

1. 【参与人员】
我方：${record.participants?.ours?.join(", ") || "张经理"}
客户方：${record.participants?.customers?.join(", ") || "—"}

2. 【客户核心诉求与痛点反馈】
${record.demandsAndPainPoints || record.aiSummary?.painPoints || "无"}

3. 【竞品收集】
${record.competitorInfo?.brand 
  ? `品牌：${record.competitorInfo.brand} | 型号：${record.competitorInfo.model} | 单价：${record.competitorInfo.price || "—"} | 月用量：${record.competitorInfo.usage || "—"}
评价：${record.competitorInfo.comments || "无"}`
  : "未采集到竞品数据"
}

4. 【本次交流达成的共识】
${record.consensus || record.aiSummary?.consensus || "无"}

5. 【下一步具体任务】
我司技术：${record.nextSteps?.techAction || "无"}
我司销售：${record.nextSteps?.salesAction || "无"}

6. 【附件与现场照片】
现场照片数：${record.photos?.length || 0} 张
附件数量：${record.attachments?.length || 0} 个

生成时间：2026-07-06 UTC
===========================================`;
    }
    setExportReportText(report);
    setIsExportCopied(false);
  };

  const handleCopyReportToClipboard = () => {
    if (!exportReportText) return;
    navigator.clipboard.writeText(exportReportText);
    setIsExportCopied(true);
    triggerToast("📋 汇报草稿已成功复制到剪贴板！可立即发至群组");
    setTimeout(() => setIsExportCopied(false), 2000);
  };

  const handleDownloadReportFile = () => {
    if (!exportReportText) return;
    const element = document.createElement("a");
    const file = new Blob([exportReportText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `跟进汇报_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    triggerToast("💾 成功下载文本版工作总结文件！");
  };

  // Manual Add Visit save with multi-participants and file attachments
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === manualCustomerId);
    if (!cust) return;

    const newVisit: VisitRecord = {
      id: `visit-${Date.now()}`,
      customerId: manualCustomerId,
      customerName: cust.name,
      date: manualDate,
      salesperson: manualRep,
      title: manualTitle,
      theme: manualTheme,
      participants: {
        ours: manualOurParticipants.split(/[，,]/).map(x => x.trim()).filter(Boolean),
        customers: manualCustomerParticipants.split(/[，,]/).map(x => x.trim()).filter(Boolean)
      },
      demandsAndPainPoints: manualPain,
      competitorInfo: manualCompBrand ? {
        brand: manualCompBrand,
        model: manualCompModel,
        price: manualCompPrice,
        usage: manualCompUsage,
        comments: manualCompComments
      } : undefined,
      consensus: manualConsensus,
      photos: uploadedPhotos,
      attachments: uploadedAttachments,
      nextSteps: {
        techAction: manualTechAction || "无特别安排",
        salesAction: manualSalesAction || "无特别安排"
      },
      source: "Manual",
      aiSummary: {
        painPoints: manualPain,
        consensus: manualConsensus,
        actions: `我司技术任务：${manualTechAction || "无"}\n我司销售任务：${manualSalesAction || "无"}`
      }
    };

    onAddVisit(newVisit);
    setSelectedVisit(newVisit);
    setShowManualForm(false);
    
    // Auto add a task based on tech/sales action if written
    if (manualTechAction) {
      onAddTodo({
        id: `todo-tech-${Date.now()}`,
        title: `【技术配合】${manualTechAction}`,
        customerId: manualCustomerId,
        customerName: cust.name,
        priority: "high",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isCompleted: false,
        linkedVisitId: newVisit.id
      });
    }
    if (manualSalesAction) {
      onAddTodo({
        id: `todo-sales-${Date.now()}`,
        title: `【销售跟进】${manualSalesAction}`,
        customerId: manualCustomerId,
        customerName: cust.name,
        priority: "medium",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isCompleted: false,
        linkedVisitId: newVisit.id
      });
    }

    // Reset manual form
    setManualTitle("");
    setManualPain("");
    setManualCompBrand("");
    setManualCompModel("");
    setManualCompPrice("");
    setManualCompUsage("");
    setManualCompComments("");
    setManualConsensus("");
    setManualTechAction("");
    setManualSalesAction("");
    setManualCustomerParticipants("");
    setUploadedPhotos([]);
    setUploadedAttachments([]);
    triggerToast("📝 成功登记手工拜访备忘，技术与销售任务已自动派发！");
  };

  // Drag-and-drop simulated logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    processMockFiles(files);
  };

  const processMockFiles = (files: File[]) => {
    files.forEach(file => {
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        // Mock a nice local image link
        setUploadedPhotos(prev => [...prev, "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=300&q=80"]);
      } else {
        setUploadedAttachments(prev => [...prev, { name: file.name, url: "#" }]);
      }
    });
    triggerToast(`📎 成功拖拽并上传 ${files.length} 个文件！`);
  };

  const handleManualFileChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processMockFiles(files);
    }
  };

  return (
    <div className="flex h-[calc(100vh-130px)] gap-6 text-slate-700" id="visit-view-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-800"
          >
            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left List Pane: Switches between visit log and Feishu Recordings list */}
      <div className="w-1/2 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
        {/* Toggle Headings */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex space-x-1 bg-slate-200/60 p-1 rounded-xl">
            <button
              id="subtab-feishu"
              onClick={() => setActiveSubTab("feishu")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeSubTab === "feishu" 
                  ? "bg-white text-slate-800 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-pink-500" />
              <span>智能录音豆 ({larkRecordings.filter(r => !r.synced).length})</span>
            </button>
            <button
              id="subtab-history"
              onClick={() => setActiveSubTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeSubTab === "history" 
                  ? "bg-white text-slate-800 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <span>历史跟进记录 ({visits.length})</span>
            </button>
          </div>

          {activeSubTab === "history" && (
            <button
              onClick={() => setShowManualForm(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>手工新增拜访</span>
            </button>
          )}

          {activeSubTab === "feishu" && (
            <button
              onClick={() => setShowApiConsole(!showApiConsole)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                showApiConsole 
                  ? "bg-pink-50 border-pink-200 text-pink-600" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>API 集成配置</span>
            </button>
          )}
        </div>

        {/* List scroll lists */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          
          {/* Collapsible Feishu Open Platform API & Webhook Simulator Center */}
          {activeSubTab === "feishu" && showApiConsole && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 text-[11px] border border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-pink-400 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>飞书开放平台集成中心 (Anker Integration)</span>
                </span>
                <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                  minutes:readonly
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300 font-mono">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                  <p className="text-slate-400 text-[10px]">授权令牌 (Lark OAuth 2.0)</p>
                  <p className="truncate font-bold text-emerald-400 text-xs">
                    {oauthToken ? oauthToken : "❌ 暂未获得授权"}
                  </p>
                  <button 
                    onClick={handleSimulateFeishuOAuth}
                    disabled={isOAuthVerifying}
                    className="w-full mt-1.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    {isOAuthVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    <span>{oauthToken ? "重新获取授权" : "授权飞书妙记"}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                  <p className="text-slate-400 text-[10px]">设备状态 (Anker AI Pod)</p>
                  <p className="font-bold text-pink-400">领夹麦克风豆 [在线]</p>
                  <p className="text-[9px] text-slate-400">免费额度: 1200分钟/月 (剩840)</p>
                </div>
              </div>

              {/* Webhook & Polling section */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">飞书妙记 API 接口回写及 Webhook 推送机制:</span>
                  <span className="text-[9px] text-indigo-400 font-bold uppercase">Webhooks</span>
                </div>
                <div className="text-[9.5px] text-slate-400 space-y-1">
                  <p className="bg-slate-900 p-1.5 rounded font-mono text-slate-300 border border-slate-800/50">
                    GET /open-apis/minutes-v1/minutes/:minute_token <br />
                    GET /open-apis/minutes-v1/minute-transcript/get
                  </p>
                  <p className="leading-relaxed">
                    录音结束后，飞书云端处理完毕触发 <strong>Webhook 回调推送</strong> 写入本地。针对离线或延迟，系统自动启动每隔30秒的后台 <strong>API 轮询同步</strong> 兜底保障。
                  </p>
                </div>

                {/* Simulate New Recording Sync (Triggering 'linking' -> 'ready') */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
                  <div className="text-[9px] text-slate-400">
                    测试项：「广汽埃安密封罩」录音状态为 <strong>录音关联中</strong>
                  </div>
                  <button
                    onClick={handleSimulateFeishuWebhook}
                    disabled={isSimulatingWebhook}
                    className="px-3 py-1 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-[10px] rounded-lg font-bold transition-all shadow flex items-center space-x-1"
                  >
                    {isSimulatingWebhook ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Webhook 执行中...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>模拟接收 Feishu Webhook</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Webhook logs */}
              {webhookLog.length > 0 && (
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[9px] text-slate-400 space-y-0.5 max-h-24 overflow-y-auto">
                  {webhookLog.map((log, i) => (
                    <p key={i} className={log.includes("API") ? "text-indigo-400" : log.includes("成功") ? "text-emerald-400" : "text-slate-400"}>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeSubTab === "feishu" ? (
            /* Feishu Recordings */
            <div className="space-y-2" id="lark-audio-list">
              <div className="p-3 bg-gradient-to-r from-pink-500/5 to-indigo-500/5 rounded-2xl border border-pink-100/50 text-slate-600 text-xs flex items-start space-x-2">
                <Briefcase className="w-4 h-4 text-pink-500 shrink-0 mt-0.5 animate-pulse" />
                <p className="leading-relaxed text-[11px]">
                  <strong>飞书安克智能录音豆</strong> 实时转译现场谈话。点击下方录音，由系统 AI 自动提炼<strong>客户痛点、异议收集、竞品数据、现场任务以及样件跟进清单</strong>。
                </p>
              </div>

              {larkRecordings.map((recording) => {
                const isSelected = selectedLarkRec?.id === recording.id;
                const isLinking = recording.status === "linking";
                return (
                  <div
                    key={recording.id}
                    id={`recording-item-${recording.id}`}
                    onClick={() => {
                      setSelectedLarkRec(recording);
                      setAiAnalysisResult(null);
                      setHasRegistered(false);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "border-pink-500 bg-pink-50/10 shadow-xs" 
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isLinking ? "bg-indigo-500 animate-ping" : "bg-pink-500"}`} />
                          <h4 className="font-semibold text-xs text-slate-800 truncate pr-4">
                            {recording.title.replace("【安克录音豆】_", "")}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-medium">
                          <span>时长: {recording.duration}</span>
                          <span>录制于: {recording.recordTime}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        recording.synced 
                          ? "bg-emerald-50 text-emerald-600" 
                          : isLinking 
                            ? "bg-indigo-50 text-indigo-600 animate-pulse"
                            : "bg-amber-50 text-amber-600"
                      }`}>
                        {recording.synced 
                          ? "已同步解析" 
                          : isLinking 
                            ? "录音关联中..." 
                            : "未同步"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* History Visit logs */
            <div className="space-y-2" id="visit-history-list">
              {visits.map((visit) => {
                const isSelected = selectedVisit?.id === visit.id;
                return (
                  <div
                    key={visit.id}
                    id={`visit-item-${visit.id}`}
                    onClick={() => setSelectedVisit(visit)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                        : "border-slate-100 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          {visit.theme && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-tight uppercase ${
                              isSelected ? "bg-white/20 text-white" : "bg-sky-50 text-sky-600"
                            }`}>
                              {visit.theme}
                            </span>
                          )}
                          <h4 className="font-bold text-xs truncate max-w-[200px]">
                            {visit.title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] opacity-75">
                          <span className="truncate max-w-[150px]">{visit.customerName}</span>
                          <span>|</span>
                          <span>销售: {visit.salesperson}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono shrink-0">
                        {visit.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Details Pane: Connects to Feishu sync or shows historical details */}
      <div className="w-1/2 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden" id="visit-details-pane">
        
        {activeSubTab === "feishu" ? (
          /* Feishu Sync active screen */
          selectedLarkRec ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Media Controller Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0" id="audio-bud-media-header">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">{selectedLarkRec.title}</p>
                    <p className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">录音领夹豆：飞书 Lark Connect</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    disabled={selectedLarkRec.status === "linking"}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 ${
                      selectedLarkRec.status === "linking" 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                        : isPlayingAudio 
                          ? "bg-rose-500 text-white" 
                          : "bg-white text-slate-900"
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-white" />
                        <span>暂停试听</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-slate-900" />
                        <span>试听音频</span>
                      </>
                    )}
                  </button>

                  <a
                    href={selectedLarkRec.feishuMinutesUrl}
                    target="_blank"
                    rel="referrer noopener"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-lg hover:text-pink-300 transition-colors"
                    title="跳转至飞书妙记网页端"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Webhook Pending banner for offline/delayed states */}
              {selectedLarkRec.status === "linking" ? (
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="font-bold text-slate-800 text-sm">录音处于「录音关联中」</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      该音频由安克领夹录音豆本地同步，但由于在离线环境，或飞书开放平台 Webhook 推送尚未到达，暂时无法解析逐字稿。
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSimulateFeishuWebhook}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-all flex items-center space-x-1.5 shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>模拟触发 Feishu Webhook 写入</span>
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-mono">（您也可以点击左侧「API 集成配置」开启配置台进行查看）</p>
                  </div>
                </div>
              ) : (
                /* Double Scroll Area: Top has transcript, bottom has AI summary */
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Audio Wave Playback simulator */}
                  {isPlayingAudio && (
                    <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl space-y-2">
                      <span className="text-[10px] text-rose-500 font-bold block flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />
                        试听中 (模拟扬声器播放)
                      </span>
                      <div className="flex items-end justify-center space-x-1 h-8">
                        {[...Array(24)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-rose-500 rounded-t" 
                            style={{ 
                              height: `${Math.floor(Math.random() * 24) + 4}px`,
                              animation: `motion-wave 1s ease-in-out infinite alternate`,
                              animationDelay: `${i * 0.05}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Transcript Container with Keyword Search & Highlighting */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <Mic className="w-3.5 h-3.5 text-pink-500" />
                        <span>飞书妙记转译逐字稿 (Interactive Transcript)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        提示: 点击 ⭐️ 标为重点对话段落
                      </span>
                    </div>

                    {/* Search Input for Keywords */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="输入关键字搜索对话 (如: 杜邦, 12.5元, 三天内, 样品)..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full text-xs p-2 pl-8 border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500 bg-slate-50/50"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                      {searchText && (
                        <button 
                          onClick={() => setSearchText("")}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Speaker-timestamp segmented Blocks */}
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl max-h-56 overflow-y-auto text-slate-600 text-[11px] leading-relaxed space-y-3">
                      {selectedLarkRec.transcriptSegments?.map((seg, idx) => {
                        const isStarred = seg.isHighlighted;
                        const isEditing = editingSegmentIndex === idx;

                        return (
                          <div 
                            key={idx} 
                            className={`p-2 rounded-lg border transition-all ${
                              isStarred 
                                ? "bg-amber-50/50 border-amber-200/60" 
                                : "bg-white border-slate-100"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-slate-800 text-[11px]">{seg.speaker}</span>
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{seg.time}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {/* Toggle Highlight (Starred Segment) */}
                                <button 
                                  onClick={() => handleToggleTranscriptHighlight(selectedLarkRec.id, idx)}
                                  className={`p-0.5 rounded hover:bg-slate-100 transition-colors ${
                                    isStarred ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
                                  }`}
                                  title="标记并同步为重点纪要段落"
                                >
                                  ★
                                </button>
                                
                                {/* Edit transcription typo */}
                                <button
                                  onClick={() => {
                                    setEditingSegmentIndex(idx);
                                    setEditingSegmentText(seg.text);
                                  }}
                                  className="text-slate-300 hover:text-sky-500 text-[10px]"
                                  title="修正转写文字"
                                >
                                  ✏️
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="space-y-1.5 pt-1">
                                <textarea
                                  value={editingSegmentText}
                                  onChange={(e) => setEditingSegmentText(e.target.value)}
                                  rows={2}
                                  className="w-full text-[11px] p-1.5 border border-sky-300 rounded focus:outline-hidden"
                                />
                                <div className="flex justify-end space-x-1.5">
                                  <button 
                                    onClick={() => setEditingSegmentIndex(null)}
                                    className="px-2 py-0.5 bg-slate-100 rounded text-[9px] hover:bg-slate-200"
                                  >
                                    取消
                                  </button>
                                  <button 
                                    onClick={() => handleSaveSegmentText(selectedLarkRec.id, idx)}
                                    className="px-2 py-0.5 bg-sky-500 text-white rounded text-[9px] hover:bg-sky-600 font-bold"
                                  >
                                    修正保存
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-600 pl-1">
                                {highlightText(seg.text, searchText)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Trigger Center */}
                  <div className="py-1.5 flex justify-center shrink-0">
                    {!aiAnalysisResult && (
                      <button
                        id="ai-process-btn"
                        disabled={isSyncing}
                        onClick={handleAiProcessRecording}
                        className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:from-pink-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/10"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>AI 智能大模型读取文本并智能归纳中...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                            <span>一键激活 Gemini AI 智能分析 (痛点/异议/竞品/送样)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Subpart 2: AI Summarized Reports (AI 纪要与待办) */}
                  <AnimatePresence>
                    {aiAnalysisResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                        id="lark-ai-analysis-result"
                      >
                        <div className="p-3.5 bg-sky-500/5 rounded-2xl border border-sky-500/20 space-y-4">
                          <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                            <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                              <span>AI 智能提炼解析结果</span>
                            </span>
                            <span className="text-[9px] font-mono text-sky-600 bg-sky-50 font-bold px-1.5 py-0.5 rounded leading-none uppercase">
                              Gemini AI
                            </span>
                          </div>

                          <div className="space-y-4 text-[11px]">
                            {/* Theme & Participants */}
                            <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                              <div>
                                <span className="text-slate-400 block mb-0.5">预选拜访主题：</span>
                                <span className="font-bold text-slate-800 text-xs">{aiAnalysisResult.theme}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">我方 + 客户方代表：</span>
                                <p className="text-slate-800 font-bold truncate">
                                  {aiAnalysisResult.participants?.ours?.join(", ")} | {aiAnalysisResult.participants?.customers?.join(", ")}
                                </p>
                              </div>
                            </div>

                            {/* Demands & Pain points */}
                            <div>
                              <span className="text-slate-400 font-bold block mb-1">1. 客户诉求与核心痛点反馈：</span>
                              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                                {aiAnalysisResult.painPoints}
                              </p>
                            </div>

                            {/* Competitor Extraction Card */}
                            {selectedLarkRec.competitorMentions && selectedLarkRec.competitorMentions.length > 0 && (
                              <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 space-y-2">
                                <span className="text-amber-700 font-bold block flex items-center">
                                  <Flame className="w-3.5 h-3.5 mr-1 text-amber-600 animate-pulse" />
                                  <span>2. 竞品提及情报自动识别（AI 竞品挖掘）：</span>
                                </span>
                                <div className="bg-white rounded-lg border border-amber-100 overflow-hidden text-[10px]">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-amber-50/50 border-b border-amber-100 text-amber-800">
                                        <th className="p-1.5 font-bold">竞品公司/品牌</th>
                                        <th className="p-1.5 font-bold">估算单价</th>
                                        <th className="p-1.5 font-bold">采购量 / 用途</th>
                                        <th className="p-1.5 font-bold">性能评估</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedLarkRec.competitorMentions.map((comp, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-b-0 text-slate-700">
                                          <td className="p-1.5 font-semibold text-slate-800">{comp.competitor}</td>
                                          <td className="p-1.5 font-mono text-rose-600">{comp.price || "—"}</td>
                                          <td className="p-1.5 truncate max-w-[80px]">{comp.useCase || "—"}</td>
                                          <td className="p-1.5 text-slate-500 truncate max-w-[100px]" title={comp.rating}>{comp.rating || "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Starred Segments Sync Display */}
                            {selectedLarkRec.highlightedParagraphs && selectedLarkRec.highlightedParagraphs.length > 0 && (
                              <div className="bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/20 space-y-1.5">
                                <span className="text-rose-700 font-bold block flex items-center">
                                  <Bookmark className="w-3.5 h-3.5 mr-1" />
                                  <span>3. 标记的重点段落同步：</span>
                                </span>
                                <ul className="list-disc list-inside space-y-1 text-rose-800 italic font-medium pl-1">
                                  {selectedLarkRec.highlightedParagraphs.map((para, i) => (
                                    <li key={i} className="leading-relaxed">"{para}"</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* AI Objections Extraction */}
                            {aiAnalysisResult.objections && aiAnalysisResult.objections.length > 0 && (
                              <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 space-y-1.5">
                                <span className="text-indigo-700 font-bold block flex items-center">
                                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                                  <span>4. AI 自动识别的客户异议与关注要点：</span>
                                </span>
                                <div className="space-y-1 text-indigo-800">
                                  {aiAnalysisResult.objections.map((obj: string, i: number) => (
                                    <p key={i} className="flex items-start">
                                      <span className="font-bold mr-1">{i + 1}.</span>
                                      <span>{obj}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Consensus */}
                            <div>
                              <span className="text-slate-400 font-bold block mb-0.5">5. 双方达成共识：</span>
                              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                                {aiAnalysisResult.consensus}
                              </p>
                            </div>

                            {/* Split Next Step Actions */}
                            <div>
                              <span className="text-slate-400 font-bold block mb-1">6. 下一步执行计划/分流任务 (即将同步至待办列表)：</span>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                                  <span className="text-sky-800 font-bold block mb-0.5">我司技术部门接下来：</span>
                                  <p className="text-slate-600 bg-white p-1.5 rounded-md border border-slate-50 leading-relaxed text-[10.5px]">
                                    {aiAnalysisResult.actions.includes("研发") || aiAnalysisResult.actions.includes("设计") || aiAnalysisResult.actions.includes("热仿真")
                                      ? "3个工作日内完成主板热仿真及温升对流建模，设计高集成散热DEMO线路板。"
                                      : "建立CF-12炭黑共混高温绝缘阻抗评估实验大纲，对齐比亚迪实验室。"}
                                  </p>
                                </div>

                                <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                                  <span className="text-purple-800 font-bold block mb-0.5">我司销售部门接下来：</span>
                                  <p className="text-slate-600 bg-white p-1.5 rounded-md border border-slate-50 leading-relaxed text-[10.5px]">
                                    {aiAnalysisResult.actions.includes("寄送") || aiAnalysisResult.actions.includes("样品")
                                      ? "跟进仓储样品配货与顺丰发出，同步提报单号，本周五进行收件确认。"
                                      : "在7月15日前整理出八通道控制IC (AX-508)的PPT，带队去宁波总部拜访。"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Date and Sample Request Badge */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white p-2 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block mb-0.5">建议跟进日期</span>
                                <span className="font-bold text-sky-600 font-mono flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {aiAnalysisResult.nextFollowUpDate || "—"}
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block mb-0.5">送样需求确认</span>
                                <span className={`font-bold flex items-center ${aiAnalysisResult.sampleRequested ? "text-emerald-600" : "text-slate-500"}`}>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {aiAnalysisResult.sampleRequested ? "需要送样" : "无需送样"}
                                </span>
                              </div>
                            </div>

                            {aiAnalysisResult.sampleRequested && aiAnalysisResult.sampleDetails && (
                              <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                                <span className="text-emerald-700 font-bold block mb-0.5">需要寄送样品明细 (将同步至送样单)：</span>
                                <span className="text-emerald-800 font-semibold">{aiAnalysisResult.sampleDetails}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Control buttons: Export or Synchronize */}
                        <div className="grid grid-cols-2 gap-3 shrink-0 pt-2">
                          <button
                            type="button"
                            onClick={() => handleGenerateExportReport(selectedLarkRec, true)}
                            className="py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Share2 className="w-4 h-4 text-indigo-500" />
                            <span>一键生成并导出工作汇报</span>
                          </button>

                          {!hasRegistered ? (
                            <button
                              id="register-ai-visit-btn"
                              onClick={handleRegisterFromAi}
                              className="py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1.5"
                            >
                              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                              <span>一键同步并分发任务</span>
                            </button>
                          ) : (
                            <div className="bg-emerald-50 py-2.5 rounded-xl border border-emerald-200 text-emerald-800 text-center font-bold text-xs flex items-center justify-center space-x-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span>同步分发成功！已写回对应板块</span>
                            </div>
                          )}
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2 p-6">
              <Mic className="w-12 h-12 text-slate-200" />
              <span>请选择一个左侧飞书录音音频</span>
            </div>
          )
        ) : (
          /* Historical log screen */
          selectedVisit ? (
            <div className="flex flex-col h-full overflow-hidden" id="visit-detail-history-container">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 flex items-start justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold mb-2 inline-block ${
                    selectedVisit.source === "FeishuAnker" ? "bg-pink-100 text-pink-600" : "bg-sky-100 text-sky-600"
                  }`}>
                    {selectedVisit.source === "FeishuAnker" ? "飞书录音豆自动转译" : "手工书写备忘"}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{selectedVisit.title}</h3>
                  <div className="flex items-center space-x-4 text-[10px] text-slate-400 mt-2">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {selectedVisit.date}
                    </span>
                    <span className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" />
                      跟进销售: {selectedVisit.salesperson}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateExportReport(selectedVisit, selectedVisit.source === "FeishuAnker")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <Share2 className="w-3 h-3 text-sky-500" />
                  <span>生成汇报</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* Customer Info header link */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">{selectedVisit.customerName}</span>
                  </div>
                  {selectedVisit.theme && (
                    <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      主题: {selectedVisit.theme}
                    </span>
                  )}
                </div>

                {/* Participants */}
                {selectedVisit.participants && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">我方参与代表：</span>
                      <span className="text-slate-700 font-medium">{selectedVisit.participants.ours?.join(", ") || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">客户方参与代表：</span>
                      <span className="text-slate-700 font-medium">{selectedVisit.participants.customers?.join(", ") || "—"}</span>
                    </div>
                  </div>
                )}

                {/* Demands & Pain points */}
                <div>
                  <span className="font-bold text-slate-800 block mb-1">客户诉求与痛点反馈：</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50/20 p-3 rounded-lg border border-slate-100">
                    {selectedVisit.demandsAndPainPoints || selectedVisit.aiSummary?.painPoints || "未详细填写。"}
                  </p>
                </div>

                {/* Competitor extracted information */}
                {selectedVisit.competitorInfo && (
                  <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-2">
                    <span className="text-amber-800 font-bold block flex items-center">
                      <Flame className="w-3.5 h-3.5 mr-1" />
                      <span>采集到的竞品情报：</span>
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] bg-white p-2.5 rounded-lg border border-amber-100">
                      <div>
                        <span className="text-slate-400 block">品牌/商家</span>
                        <span className="font-bold text-slate-800">{selectedVisit.competitorInfo.brand}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">型号</span>
                        <span className="font-bold text-slate-800">{selectedVisit.competitorInfo.model}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">单价</span>
                        <span className="font-bold text-rose-600 font-mono">{selectedVisit.competitorInfo.price || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">月用量</span>
                        <span className="font-bold text-slate-800">{selectedVisit.competitorInfo.usage || "—"}</span>
                      </div>
                    </div>
                    {selectedVisit.competitorInfo.comments && (
                      <p className="text-[10px] text-slate-500 italic bg-white p-2 rounded-lg border border-amber-100/50">
                        <strong>客户评价：</strong> {selectedVisit.competitorInfo.comments}
                      </p>
                    )}
                  </div>
                )}

                {/* Starred Highlights */}
                {selectedVisit.highlightedParagraphs && selectedVisit.highlightedParagraphs.length > 0 && (
                  <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 space-y-1.5">
                    <span className="text-rose-800 font-bold block flex items-center">
                      <Bookmark className="w-3.5 h-3.5 mr-1" />
                      <span>现场标记对话段落：</span>
                    </span>
                    <div className="space-y-1 text-[10.5px] italic text-rose-800 font-medium pl-1">
                      {selectedVisit.highlightedParagraphs.map((para, idx) => (
                        <p key={idx}>"{para}"</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consensus */}
                <div>
                  <span className="font-bold text-slate-800 block mb-1">本次交流共识备忘：</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50/20 p-3 rounded-lg border border-slate-100">
                    {selectedVisit.consensus || selectedVisit.aiSummary?.consensus || "未详细填写。"}
                  </p>
                </div>

                {/* Next Steps for Tech and Sales */}
                {selectedVisit.nextSteps && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">双方下一步执行计划：</span>
                    <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                      <div className="bg-sky-50/50 p-2 rounded-lg border border-sky-100">
                        <span className="font-bold text-sky-800 block mb-0.5">我司技术要做什么：</span>
                        <p className="text-slate-600">{selectedVisit.nextSteps.techAction}</p>
                      </div>
                      <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                        <span className="font-bold text-purple-800 block mb-0.5">我司销售要做什么：</span>
                        <p className="text-slate-600">{selectedVisit.nextSteps.salesAction}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photos & Attachments */}
                {(selectedVisit.photos?.length ? selectedVisit.photos.length > 0 : false) || (selectedVisit.attachments?.length ? selectedVisit.attachments.length > 0 : false) ? (
                  <div className="space-y-3 pt-2">
                    <span className="font-bold text-slate-800 block">相关附件与现场照片：</span>
                    
                    {/* Photos list */}
                    {selectedVisit.photos && selectedVisit.photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {selectedVisit.photos.map((ph, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-xs max-w-[120px]">
                            <img src={ph} alt="现场快照" className="w-full h-16 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">现场照片 #{idx+1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Files list */}
                    {selectedVisit.attachments && selectedVisit.attachments.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedVisit.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                            <button className="text-sky-500 hover:text-sky-600 font-bold flex items-center space-x-0.5">
                              <Download className="w-3 h-3" />
                              <span>下载</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2 p-6">
              <FileText className="w-12 h-12 text-slate-200" />
              <span>暂无历史跟进记录，点击左侧手工登记一个吧</span>
            </div>
          )
        )}
      </div>

      {/* Manual Add Visit Form Overlay */}
      <AnimatePresence>
        {showManualForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="manual-form-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
              id="manual-form-container"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-sky-500 animate-pulse" />
                  <h3 className="font-bold text-slate-800 text-sm">手工登记跟进拜访记录</h3>
                </div>
                <button onClick={() => setShowManualForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                
                {/* Customer & Theme Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-slate-500 block mb-1 font-semibold">跟进客户 *</label>
                    <select
                      value={manualCustomerId}
                      onChange={(e) => setManualCustomerId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    >
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="text-slate-500 block mb-1 font-semibold">拜访主题类型 *</label>
                    <select
                      value={manualTheme}
                      onChange={(e) => setManualTheme(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    >
                      <option value="初次拜访">初次拜访</option>
                      <option value="产品介绍">产品介绍</option>
                      <option value="谈判对齐">商务谈判</option>
                      <option value="技术交流">技术交流</option>
                      <option value="售后服务">售后服务</option>
                      <option value="老客户回访">客户回访</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="text-slate-500 block mb-1 font-semibold">跟进日期 *</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">拜访活动标题 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例如：极氪车身密封条性能论证交流"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">跟进销售人员</label>
                    <input
                      type="text"
                      value={manualRep}
                      onChange={(e) => setManualRep(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                </div>

                {/* Participants */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">我方参与代表 (多个逗号隔开) *</label>
                    <input
                      type="text"
                      required
                      placeholder="如：张经理, 李工程师"
                      value={manualOurParticipants}
                      onChange={(e) => setManualOurParticipants(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">客户方参与代表 (多个逗号隔开) *</label>
                    <input
                      type="text"
                      required
                      placeholder="如：陈工 (采购部), 王总监 (技术部)"
                      value={manualCustomerParticipants}
                      onChange={(e) => setManualCustomerParticipants(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                </div>

                {/* Demands / Pain points */}
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">客户诉求与痛点反馈 (技术/交付疑虑及难点描述) *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="客户在车规阻燃击穿强度、尺寸精度、或交付期限、备料响应速度等方面有何硬性硬结或顾虑？"
                    value={manualPain}
                    onChange={(e) => setManualPain(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                  />
                </div>

                {/* Competitor detailed block */}
                <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 space-y-2">
                  <span className="text-amber-800 font-bold block flex items-center">
                    <Flame className="w-3.5 h-3.5 mr-1" />
                    <span>竞品情报收集：</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block mb-0.5">竞品品牌/公司</span>
                      <input
                        type="text"
                        placeholder="如: 美国杜邦"
                        value={manualCompBrand}
                        onChange={(e) => setManualCompBrand(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">在用型号</span>
                      <input
                        type="text"
                        placeholder="如: FR-50"
                        value={manualCompModel}
                        onChange={(e) => setManualCompModel(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">预估单价</span>
                      <input
                        type="text"
                        placeholder="如: 55元/kg"
                        value={manualCompPrice}
                        onChange={(e) => setManualCompPrice(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">采购用量</span>
                      <input
                        type="text"
                        placeholder="如: 8吨/月"
                        value={manualCompUsage}
                        onChange={(e) => setManualCompUsage(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">客户对其评价/痛点反馈</span>
                    <input
                      type="text"
                      placeholder="如: 阻燃等级良好但常出现断件裂痕，供货周期长且价格偏高 30%"
                      value={manualCompComments}
                      onChange={(e) => setManualCompComments(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded bg-white text-slate-700"
                    />
                  </div>
                </div>

                {/* Consensus */}
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">本次交流达成的共识/备忘录 *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="双方达成了哪些合作协议或参数口径对齐？如：同意先送5块CF-12炭黑复合块进行拉伸绝缘检测..."
                    value={manualConsensus}
                    onChange={(e) => setManualConsensus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                  />
                </div>

                {/* Split tech/sales action plan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">我司技术下一步工作计划 (自动生成技术待办) *</label>
                    <input
                      type="text"
                      required
                      placeholder="如：安排研发实验室建立高温绝缘120度阻抗测试规范"
                      value={manualTechAction}
                      onChange={(e) => setManualTechAction(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">我司销售下一步工作计划 (自动生成销售待办) *</label>
                    <input
                      type="text"
                      required
                      placeholder="如：协调排产5块CF-12炭黑块样品顺丰快递发出，本周五同步快递单号"
                      value={manualSalesAction}
                      onChange={(e) => setManualSalesAction(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                    />
                  </div>
                </div>

                {/* File Upload Zone (Simulates Drag and Drop / Files) */}
                <div className="space-y-1">
                  <label className="text-slate-500 block font-semibold">上传现场照片与文件附件 (支持拖拽/点击选择) *</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? "border-sky-500 bg-sky-50/20 text-sky-600" 
                        : "border-slate-200 hover:border-slate-300 text-slate-400 bg-slate-50/30"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <FileUp className="w-7 h-7 text-slate-300" />
                      <p className="text-[11px]">
                        将照片、报价单、设计图纸 PDF <strong>拖入此处</strong>，或 <span className="text-sky-500 underline font-semibold">点击选择文件</span>
                      </p>
                      <p className="text-[9px] text-slate-400">支持拖拽多文件批量上传</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleManualFileChoose}
                      className="hidden"
                      id="manual-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("manual-file-input")?.click()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Uploaded state indicator */}
                  {(uploadedPhotos.length > 0 || uploadedAttachments.length > 0) && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-3">
                        {uploadedPhotos.length > 0 && (
                          <span className="flex items-center text-emerald-600 font-bold">
                            <ImageIcon className="w-3.5 h-3.5 mr-1" />
                            <span>图片 ({uploadedPhotos.length}张)</span>
                          </span>
                        )}
                        {uploadedAttachments.length > 0 && (
                          <span className="flex items-center text-sky-600 font-bold">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            <span>文档 ({uploadedAttachments.length}个)</span>
                          </span>
                        )}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setUploadedPhotos([]); setUploadedAttachments([]); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        清空
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
                  >
                    保存并同步
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Report Markdown Modal Overlay */}
      <AnimatePresence>
        {exportReportText && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="export-report-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
              id="export-report-container"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
                <span className="font-bold text-sky-400 text-xs flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>一键生成格式化跟进工作总结汇报</span>
                </span>
                <button onClick={() => setExportReportText(null)} className="text-slate-400 hover:text-slate-200 font-bold">✕</button>
              </div>

              <div className="p-4 bg-slate-950/50 flex-1 overflow-y-auto">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                  该文本由 CRM 智能生成。已自动包含：拜访细节、我方和客方参与者、痛点与疑虑反馈、竞品分析情报、现场标记对话、双方共识备忘以及技术/销售下一步待办计划。
                </p>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[9.5px] leading-relaxed text-slate-300 select-all overflow-x-auto whitespace-pre-wrap max-h-96">
                  {exportReportText}
                </pre>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end space-x-2.5 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setExportReportText(null)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReportFile}
                  className="px-3.5 py-2 bg-slate-800 text-sky-400 rounded-xl hover:bg-slate-700 font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载 TXT 文件</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyReportToClipboard}
                  className={`px-4 py-2 text-white font-bold rounded-xl flex items-center space-x-1 transition-all ${
                    isExportCopied ? "bg-emerald-600" : "bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/15"
                  }`}
                >
                  {isExportCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{isExportCopied ? "复制成功！" : "复制到剪贴板"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
