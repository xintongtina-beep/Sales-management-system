export interface Contact {
  id: string;
  name: string;
  title: string;       // 职务
  department: string;  // 部门
  phone: string;       // 手机号
  wechat?: string;     // 微信号
  email?: string;      // 邮箱
  role: '决策人' | '影响人' | '使用者' | '经办人'; // 决策角色标记 (决策人/影响人/使用者/经办人)
  closeness: number;   // 关系亲密度评分 (1-5星)
}

export interface Customer {
  id: string;
  name: string;
  creditCode?: string;      // 统一社会信用代码
  legalRep?: string;        // 法定代表人
  capital?: string;         // 注册资本
  establishDate?: string;   // 成立日期
  address?: string;         // 注册地址
  scope?: string;           // 经营范围
  contactPerson: string;    // 联系人 (向下兼容/首要联系人姓名)
  contactPhone: string;     // 联系电话 (向下兼容/首要联系人电话)
  contactEmail?: string;    // 邮箱 (向下兼容)
  contacts?: Contact[];     // 关联的多个联系人
  industry: string;         // 行业
  lastFollowUp?: string;    // 上次拜访日期
  followUpCycle: number;    // 回访周期 (天)
  nextFollowUp?: string;    // 下次回访日期
  status: 'active' | 'inactive' | 'pending'; // 客户状态
  coordinates?: {
    lng: number;
    lat: number;
  };
  // 新增 6 个工商/增值字段
  formerNames?: string;     // 曾用名
  paidInCapital?: string;   // 实缴资本
  companyType?: string;     // 企业类型
  industryCategory?: string;// 行业分类
  regStatus?: string;       // 登记状态
  riskTags?: string[];      // 企业风险扫描标签 (经营异常/行政处罚/司法风险)
  associatedEntities?: { name: string; relation: string; creditCode?: string }[]; // 关联企业图谱
  competitors?: string[];   // 竞品自动识别
  changeLogs?: { date: string; type: string; before: string; after: string }[];   // 工商变更动态
}

export interface VisitRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  salesperson: string;
  title: string;
  theme?: string;           // 拜访主题（初次拜访/产品介绍/谈判/售后/回访等）
  participants?: {
    ours: string[];         // 我方参与人员
    customers: string[];    // 客户方参与人员
  };
  demandsAndPainPoints?: string; // 客户诉求与痛点反馈
  competitorInfo?: {
    brand: string;          // 竞品品牌
    model: string;          // 在用型号
    price?: string;         // 单价
    usage?: string;         // 用量
    comments?: string;      // 使用评价
  };
  consensus?: string;       // 本次交流达成的共识/备忘
  photos?: string[];        // 现场照片
  attachments?: { name: string; url: string }[]; // 附件列表
  nextSteps?: {
    techAction: string;     // 我司技术下一步要做什么
    salesAction: string;    // 我司销售下一步要做什么
  };
  
  // AI 录音集成相关字段
  transcript?: string;      // 完整逐字稿
  transcriptSegments?: { speaker: string; time: string; text: string; isHighlighted?: boolean }[]; // 时间戳和发言人逐字段落
  audioDuration?: string;   // 录音时长
  audioUrl?: string;        // 录音文件链接 / 飞书链接
  feishuMinutesUrl?: string;// 飞书妙记跳转链接
  source: 'FeishuAnker' | 'Manual'; // 记录来源
  status?: 'linking' | 'ready'; // 「录音关联中」 | 「录音已就绪」
  objections?: string[];    // AI 自动识别的客户异议与关注要点
  highlightedParagraphs?: string[]; // 标记的重点段落同步
  
  aiSummary?: {
    painPoints: string;     // 客户痛点/需求
    consensus: string;      // 拜访达成的共识
    actions: string;        // 下步行动计划
    nextFollowUpDate?: string; // 建议下步跟进时间
    sampleRequested?: boolean; // 是否需要送样
    sampleDetails?: string;    // 样件详情
  };
}

export interface SampleRecord {
  id: string;
  customerId: string;
  customerName: string;
  sampleName: string;       // 样品名称
  quantity: number;         // 数量
  sendDate: string;         // 送样日期
  status: 'preparing' | 'shipped' | 'received' | 'feedback'; // 准备中/已寄出/已签收/反馈完毕
  trackingNumber?: string;  // 快递单号
  feedbackScore?: number;   // 反馈评分 (1-5)
  feedbackComments?: string;// 客户反馈评语
}

export interface TodoTask {
  id: string;
  title: string;
  customerId?: string;
  customerName?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  isCompleted: boolean;
  linkedVisitId?: string;   // 关联的拜访记录 ID
}

export interface FollowUpAlert {
  id: string;
  customerId: string;
  customerName: string;
  daysRemaining: number;    // 距离下次跟进剩余天数 (负数表示逾期)
  lastFollowUpDate?: string;
  nextFollowUpDate: string;
  status: 'overdue' | 'due_today' | 'upcoming';
}

export interface AppBrandConfig {
  name: string;
  subtitle: string;
}

export interface UserProfile {
  id: string;
  accountType: 'phone' | 'email';
  account: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  registeredAt: string;
  lastLoginAt: string;
}

export interface VerificationCodeRecord {
  code: string;
  account: string;
  type: 'phone' | 'email';
  purpose: 'register' | 'login';
  expiresAt: number;
  lastSentAt: number;
}

