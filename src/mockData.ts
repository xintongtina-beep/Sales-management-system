import { Customer, VisitRecord, SampleRecord, TodoTask } from "./types";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "小米通讯技术有限公司",
    creditCode: "91110108671717366X",
    legalRep: "王川",
    capital: "320,000万元人民币",
    establishDate: "2010-04-13",
    address: "北京市海淀区西二旗中路33号院小米科技园H栋",
    scope: "开发手机技术、计算机软件及系统集成；销售自产产品；批发电子产品、通信设备并提供售后服务与技术支持等。",
    contactPerson: "林建国",
    contactPhone: "13812345678",
    contactEmail: "linjianguo@xiaomi.com",
    industry: "消费电子",
    lastFollowUp: "2026-06-25",
    followUpCycle: 30, // 30 days
    nextFollowUp: "2026-07-25",
    status: "active",
    coordinates: { lng: 116.4074, lat: 39.9042 },
    contacts: [
      {
        id: "c1-1",
        name: "林建国",
        title: "采购总监",
        department: "采购部",
        phone: "13812345678",
        wechat: "linjg_xiaomi",
        email: "linjianguo@xiaomi.com",
        role: "决策人",
        closeness: 4
      },
      {
        id: "c1-2",
        name: "张婷",
        title: "高级采购经理",
        department: "采购二部",
        phone: "13511223344",
        wechat: "zhangt_xm",
        email: "zhangting@xiaomi.com",
        role: "影响人",
        closeness: 5
      },
      {
        id: "c1-3",
        name: "李飞",
        title: "硬件研发工程师",
        department: "手机研发部",
        phone: "13699887766",
        wechat: "lifei_hw",
        email: "lifei@xiaomi.com",
        role: "使用者",
        closeness: 3
      }
    ]
  },
  {
    id: "cust-2",
    name: "比亚迪股份有限公司",
    creditCode: "91440300192213825D",
    legalRep: "王传福",
    capital: "291,118万元人民币",
    establishDate: "1995-02-10",
    address: "深圳市坪山区比亚迪路3009号",
    scope: "新型电池、电泳涂漆、汽车、电动车及零部件的研发与销售；轨道交通、储能电站的设计、技术开发和系统集成等。",
    contactPerson: "陈向东",
    contactPhone: "13987654321",
    contactEmail: "chen.xiangdong@byd.com",
    industry: "新能源汽车",
    lastFollowUp: "2026-05-10",
    followUpCycle: 60, // 60 days
    nextFollowUp: "2026-07-09", // upcoming alert
    status: "active",
    coordinates: { lng: 114.0579, lat: 22.5431 },
    contacts: [
      {
        id: "c2-1",
        name: "陈向东",
        title: "资深材料工程师",
        department: "电池研发中心",
        phone: "13987654321",
        wechat: "byd_chenxd",
        email: "chen.xiangdong@byd.com",
        role: "影响人",
        closeness: 4
      },
      {
        id: "c2-2",
        name: "陆伟",
        title: "采购总负责人",
        department: "供应链管理部",
        phone: "13722334455",
        wechat: "luwei_byd",
        email: "luwei@byd.com",
        role: "决策人",
        closeness: 2
      },
      {
        id: "c2-3",
        name: "王佳",
        title: "PACK线主管",
        department: "第六事业部",
        phone: "13144556677",
        wechat: "wangjia_pack",
        email: "wangjia@byd.com",
        role: "使用者",
        closeness: 5
      }
    ]
  },
  {
    id: "cust-3",
    name: "极氪汽车（宁波）有限公司",
    creditCode: "91330201MA2J6URD9B",
    legalRep: "安聪慧",
    capital: "500,000万元人民币",
    establishDate: "2021-03-26",
    address: "浙江省宁波市北仑区新碶街道辽河路18号",
    scope: "新能源汽车整车销售；汽车零部件及配件制造；智能车载设备制造；软件开发；信息系统集成服务等。",
    contactPerson: "章静",
    contactPhone: "18611223344",
    contactEmail: "zhangjing@zeekrlife.com",
    industry: "新能源汽车",
    lastFollowUp: "2026-04-01",
    followUpCycle: 90, // 90 days overdue
    nextFollowUp: "2026-06-30", // Overdue follow-up!
    status: "active",
    coordinates: { lng: 121.5497, lat: 29.8683 },
    contacts: [
      {
        id: "c3-1",
        name: "章静",
        title: "采购经理",
        department: "采购部",
        phone: "18611223344",
        wechat: "zeekr_zj",
        email: "zhangjing@zeekrlife.com",
        role: "影响人",
        closeness: 3
      },
      {
        id: "c3-2",
        name: "徐国栋",
        title: "供应链总监",
        department: "供应链规划处",
        phone: "18944556611",
        wechat: "gordon_xu",
        email: "xuguodong@zeekrlife.com",
        role: "决策人",
        closeness: 2
      }
    ]
  },
  {
    id: "cust-4",
    name: "OPPO 广东移动通信有限公司",
    creditCode: "91441900748039757A",
    legalRep: "金乐亲",
    capital: "45,841万元人民币",
    establishDate: "2003-04-11",
    address: "广东省东莞市长安镇乌沙海滨路18号",
    scope: "研发、生产、销售：移动电话及配件、智能电子设备、穿戴式设备、平板电脑、家用电器；系统集成与技术咨询服务。",
    contactPerson: "徐天宇",
    contactPhone: "13544332211",
    contactEmail: "xutianyu@oppo.com",
    industry: "消费电子",
    lastFollowUp: "2026-07-02",
    followUpCycle: 30,
    nextFollowUp: "2026-08-01",
    status: "pending",
    coordinates: { lng: 113.7518, lat: 23.0206 },
    contacts: [
      {
        id: "c4-1",
        name: "徐天宇",
        title: "供应链主管",
        department: "采购管理部",
        phone: "13544332211",
        wechat: "tianyu_oppo",
        email: "xutianyu@oppo.com",
        role: "影响人",
        closeness: 4
      },
      {
        id: "c4-2",
        name: "刘海",
        title: "结构件工程师",
        department: "智能终端事业部",
        phone: "13955667788",
        wechat: "haizi_liu",
        email: "liuhai@oppo.com",
        role: "使用者",
        closeness: 3
      }
    ]
  }
];

export const INITIAL_VISITS: VisitRecord[] = [
  {
    id: "visit-1",
    customerId: "cust-1",
    customerName: "小米通讯技术有限公司",
    date: "2026-06-25",
    salesperson: "张经理",
    title: "小米多合一智能电源主板规格对齐会",
    theme: "产品介绍",
    participants: {
      ours: ["张经理 (销售负责人)", "李工 (资深电源工程师)"],
      customers: ["林建国 (采购总监)", "周技术官 (结构件工程组)"]
    },
    demandsAndPainPoints: "小米采购总监林建国反馈，现有方案在极端重载情况下发热偏高，且PCB占用空间大，急需缩减15%的体积并优化导热性能。对交付周期有顾虑，希望最迟在一周内拿到首个DEMO进行温升试验。",
    competitorInfo: {
      brand: "M公司 (意法半导体代理)",
      model: "ST-PD3.0-V2",
      price: "12.50元",
      usage: "80k/月",
      comments: "发热较低但集成度不高，外围需要5-8个滤波电容，占用PCB面积太大。"
    },
    consensus: "我司承诺在一周内（7月2日前）给出优化布线、高导热材料加持的AX-809 DEMO测试板；小米表示若能将温升控制在75度以内，将批量导入新一代平板充电器产品线。",
    photos: ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80"],
    attachments: [
      { name: "小米智能电源PCB尺寸图.pdf", url: "#" },
      { name: "AX-809热仿真热对流报告V1.1.pdf", url: "#" }
    ],
    nextSteps: {
      techAction: "李工负责在3个工作日内完成主板热仿真模拟，并提交第一版高度集成散热DEMO设计图纸。",
      salesAction: "张经理负责协调库房调拨3套AX-809芯片测试套件，连同白皮书一起在周五寄给小米周工。"
    },
    source: "Manual",
    aiSummary: {
      painPoints: "小米采购总监林建国反馈，现有方案在极端重载情况下发热偏高，且PCB占用空间大，急需缩减15%的体积并优化导热性能。",
      consensus: "我司承诺在一周内（7月2日前）给出优化布线、高导热材料加持的AX-809 DEMO测试板；小米表示若能将温升控制在75度以内，将批量导入新一代平板充电器产品线。",
      actions: "1. 销售经理发起技术论证流程\n2. 研发部在3个工作日内完成热仿真模拟并提交首版散热板图纸",
      nextFollowUpDate: "2026-07-10",
      sampleRequested: false
    }
  },
  {
    id: "visit-2",
    customerId: "cust-2",
    customerName: "比亚迪股份有限公司",
    date: "2026-05-10",
    salesperson: "张经理",
    title: "比亚迪电池PACK轻量化材料首期交流会",
    theme: "技术谈判",
    participants: {
      ours: ["张经理 (销售负责人)", "陈博士 (新材料研发专家)"],
      customers: ["陈向东 (电池PACK部技术总监)", "王工 (PACK结构测试工程师)"]
    },
    demandsAndPainPoints: "比亚迪PACK绝缘上盖对减重有刚性要求，目前工程塑料件密度较大，导致电池组能量密度无法进一步突破上限。陈向东总监担心碳纤维绝缘板在120℃高温环境下的电击穿阻抗以及长期的冲击振动耐久度。",
    competitorInfo: {
      brand: "G公司 (帝人化学)",
      model: "Teijin-PP-GF30",
      price: "18.00元/kg",
      usage: "150吨/月",
      comments: "密度约为1.25 g/cm³，拉伸强度一般，阻燃UL94 V-0但绝缘性能在高温下衰减快。"
    },
    consensus: "向比亚迪提供高强度复合阻燃材料（CF-12）进行前期的实验室物理及电击穿试验与跌落破坏测试，样品要求在5月中旬前寄达坪山基地。",
    photos: ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=300&q=80"],
    attachments: [
      { name: "比亚迪大PACK绝缘上盖结构件图纸.dwg", url: "#" },
      { name: "CF-12炭黑共混高绝缘复合材料物性表.xlsx", url: "#" }
    ],
    nextSteps: {
      techAction: "陈博士负责拟定高温绝缘实验规范表，提前对齐比亚迪实验室的电气性能测试要求。",
      salesAction: "张经理协调仓储下午发出5件 CF-12 阻燃块样，并同步快递单号（顺丰SF142536475899）。"
    },
    source: "Manual",
    aiSummary: {
      painPoints: "PACK绝缘上盖对减重有刚性要求，目前工程塑料件密度较大，导致电池组能量密度无法进一步突破上限。",
      consensus: "向比亚迪提供高强度复合阻燃材料（CF-12）进行前期的实验室物性试验与跌落破坏测试。",
      actions: "1. 寄送 5件 CF-12 规格块样品进行拉伸与绝缘实验；\n2. 5月底前跟进比亚迪材料测试中心出具的初步数据报告。",
      nextFollowUpDate: "2026-05-30",
      sampleRequested: true,
      sampleDetails: "CF-12阻燃复合轻量块 5件"
    }
  }
];

export const INITIAL_SAMPLES: SampleRecord[] = [
  {
    id: "samp-1",
    customerId: "cust-2",
    customerName: "比亚迪股份有限公司",
    sampleName: "CF-12高强度阻燃复合绝缘板 (测试块样)",
    quantity: 5,
    sendDate: "2026-05-12",
    status: "feedback",
    trackingNumber: "SF142536475899",
    feedbackScore: 5,
    feedbackComments: "比亚迪材料工程师陈工反馈：拉伸强度与轻量化程度均超过预期，但绝缘电阻在高温120℃环境下有轻微衰减，整体满足A级标准。"
  },
  {
    id: "samp-2",
    customerId: "cust-1",
    customerName: "小米通讯技术有限公司",
    sampleName: "AX-809 智能电源IC (双芯片高速控温测试套件)",
    quantity: 3,
    sendDate: "2026-07-01",
    status: "shipped",
    trackingNumber: "SF987654321000"
  }
];

export const INITIAL_TODOS: TodoTask[] = [
  {
    id: "todo-1",
    title: "跟进比亚迪CF-12复合绝缘板在高温120度下的绝缘阻抗测试进展",
    customerId: "cust-2",
    customerName: "比亚迪股份有限公司",
    priority: "high",
    dueDate: "2026-07-08",
    isCompleted: false
  },
  {
    id: "todo-2",
    title: "针对小米H栋采购会谈提交新一代热仿真图纸和白皮书",
    customerId: "cust-1",
    customerName: "小米通讯技术有限公司",
    priority: "high",
    dueDate: "2026-07-10",
    isCompleted: false
  },
  {
    id: "todo-3",
    title: "准备给极氪汽车宁波本部的跟进汇报材料，制定挽回计划",
    customerId: "cust-3",
    customerName: "极氪汽车（宁波）有限公司",
    priority: "medium",
    dueDate: "2026-07-15",
    isCompleted: false
  },
  {
    id: "todo-4",
    title: "整理销售二季度送样反馈合格率统计报告",
    priority: "low",
    dueDate: "2026-07-12",
    isCompleted: true
  }
];

// Highly realistic Lark (Feishu) Anker AI Recording Bud simulations
export interface LarkAudioRecord {
  id: string;
  title: string;
  duration: string;
  recordTime: string;
  salesperson: string;
  synced: boolean;
  minuteToken: string;            // 妙记 Token
  createTime: string;             // 创建时间
  owner: string;                  // 妙记所有者
  coverUrl?: string;              // 封面图 URL
  feishuMinutesUrl: string;       // 飞书妙记一键跳转链接
  status: 'linking' | 'ready';    // Webhook状态
  transcript?: string;            // 完整文字稿
  transcriptSegments: { speaker: string; time: string; text: string; isHighlighted?: boolean }[];
  objections: string[];           // AI识别的客户异议与关注点
  competitorMentions: { competitor: string; price?: string; useCase?: string; rating?: string; context: string }[]; // 竞品提及 analysis
  highlightedParagraphs: string[];// 重点段落
}

export const MOCK_LARK_RECORDINGS: LarkAudioRecord[] = [
  {
    id: "lark-rec-1",
    title: "【安克录音豆】_20260706_与小米通讯技术林建国采购高层洽谈.mp3",
    duration: "12分45秒",
    recordTime: "2026-07-06 14:30",
    salesperson: "张经理",
    synced: false,
    minuteToken: "lark_mq_xmi_009831",
    createTime: "2026-07-06 14:45",
    owner: "张经理 (销售部)",
    coverUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
    feishuMinutesUrl: "https://bytedance.feishu.cn/minutes/lark_mq_xmi_009831",
    status: "ready",
    transcript: `销售张经理：林总，下午好。上次您提到智能充电器控温板尺寸有些紧巴，今天我们带了全新的芯片设计架构。
小米林总：张经理，你们来得很及时。我们上周测试了常规控温板，主要问题是，当手机进行120W超极速充电的前5分钟，功率器件温升特别快，直接突破了85度警戒线，导致充电器频繁触发保护而降功率。
销售张经理：明白。其实我们有一款最新的AX-809智能双芯片方案。它内置了自适应动态热调节技术，能够智能感应温升曲线，在前5分钟将多余热量分担至副板。
小米林总：这听起来是个不错的思路。如果是这样，我们需要在3天内拿到测试板，因为我们的结构件设计马上要封板了。
销售张经理：没问题，我们可以寄送3套AX-809电源IC测试套件给你们的硬件工程师试用。一会我把单号录入，并附带热仿真DEMO。
小米林总：太好了！只要测试通过，下个月的年度新品我们首批就计划导入100k订单量。
销售张经理：谢谢林总信任，那我这周五再打电话确认测试反馈，并约时间让我们的研发团队和您线上开一个对接会。`,
    transcriptSegments: [
      { speaker: "销售张经理", time: "00:05", text: "林总，下午好。上次您提到智能充电器控温板尺寸有些紧巴，今天我们带了全新的芯片设计架构。" },
      { speaker: "小米林总", time: "00:48", text: "张经理，你们来得很及时。我们上周测试了常规控温板，主要问题是，当手机进行120W超极速充电的前5分钟，功率器件温升特别快，直接突破了85度警戒线，导致充电器频繁触发保护而降功率。目前在用M公司的 ST-PD3.0-V2 型号，单价大概 12.5 元，一个月大约 80k 颗。这个竞品虽然发热还算可以接受，但是外围滤波电容需要太多，太占PCB尺寸了，搞得我们没办法缩体积！", isHighlighted: true },
      { speaker: "销售张经理", time: "01:55", text: "明白。其实我们有一款最新的AX-809智能双芯片方案。它内置了自适应动态热调节技术，能够智能感应温升曲线，在前5分钟将多余热量分担至副板。" },
      { speaker: "小米林总", time: "02:40", text: "这听起来是个不错的思路。如果是这样，我们需要在3天内拿到测试板，因为我们的结构件设计马上要封板了。这个时间卡得很死，三天内不发货我们就要用备选方案了。", isHighlighted: true },
      { speaker: "销售张经理", time: "03:15", text: "没问题，我们可以寄送3套AX-809电源IC测试套件给你们的硬件工程师试用。一会我把单号录入，并附带热仿真DEMO。" },
      { speaker: "小米林总", time: "04:02", text: "太好了！只要测试通过，下个月的年度新品我们首批就计划导入100k订单量。我们会评估整体成本和测试表现。" },
      { speaker: "销售张经理", time: "04:35", text: "谢谢林总信任，那我这周五再打电话确认测试反馈，并约时间让我们的研发团队和您线上开一个对接会。" }
    ],
    objections: [
      "功率器件在前5分钟超极速充电温升过快，频繁触发85℃警戒保护降功率",
      "交付时间极其紧迫：要求在3天内（封板前）必须收到样品，否则转用备选方案",
      "智能充电器整体体积需要大幅缩减15%，对外围零部件数量敏感"
    ],
    competitorMentions: [
      {
        competitor: "M公司 (STMicroelectronics)",
        price: "12.50元",
        useCase: "ST-PD3.0-V2 芯片，用量约 80k/月",
        rating: "发热可接受但集成度极低",
        context: "目前在用M公司的ST-PD3.0-V2型号，单价大概12.5元，外围滤波电容太多占用空间..."
      }
    ],
    highlightedParagraphs: [
      "当手机进行120W超极速充电的前5分钟，功率器件温升特别快，直接突破了85度警戒线...",
      "我们需要在3天内拿到测试板，因为我们的结构件设计马上要封板了。这个时间卡得很死..."
    ]
  },
  {
    id: "lark-rec-2",
    title: "【安克录音豆】_20260705_比亚迪坪山陈向东PACK减重会议.mp3",
    duration: "18分20秒",
    recordTime: "2026-07-05 10:15",
    salesperson: "张经理",
    synced: false,
    minuteToken: "lark_mq_byd_049811",
    createTime: "2026-07-05 10:30",
    owner: "张经理 (销售部)",
    coverUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
    feishuMinutesUrl: "https://bytedance.feishu.cn/minutes/lark_mq_byd_049811",
    status: "ready",
    transcript: `销售张经理：陈工，对于咱们大PACK外壳减重的课题，今天我带来了碳纤维复合绝缘板 CF-12。
比亚迪陈工：张经理，我们要的不仅是硬度高、阻燃好，还要密度比传统的玻纤复合材料低至少20%。
销售张经理：CF-12完全就是针对这个场景研发的！它的密度只有1.45 g/cm³，拉伸强度却达到380 MPa。阻燃等级是 UL94 V-0。
比亚迪陈工：好，这些指标在理论上是完美的，但必须拿回我们实验室测试。需要寄送5件阻燃复合材料块样进行拉伸与绝缘实验。
销售张经理：我们库房正好有规格块样品，下午我就叫顺丰寄过去，单号我会随时同步。
比亚迪陈工：恩，一般测试周期在10天左右。只要绝缘阻抗在高温120度下不发生严重衰减，咱们就进入下一步商务谈价。下一期跟进会议咱们暂定7月16号。`,
    transcriptSegments: [
      { speaker: "销售张经理", time: "00:05", text: "陈工，对于咱们大PACK外壳减重的课题，今天我带来了碳纤维复合绝缘板 CF-12。" },
      { speaker: "比亚迪陈工", time: "00:42", text: "张经理，我们要的不仅是硬度高、阻燃好，还要密度比传统的玻纤复合材料低至少20%。现在在用G公司的 Teijin-PP-GF30 玻纤PP，每个月 150 吨左右，单价大概 18.00 元/kg。但是这个竞品高温下的拉伸韧性很不理想，绝缘电阻降得太快了！", isHighlighted: true },
      { speaker: "销售张经理", time: "01:50", text: "CF-12完全就是针对这个场景研发的！它的密度只有1.45 g/cm³，拉伸强度却达到380 MPa。阻燃等级是 UL94 V-0。" },
      { speaker: "比亚迪陈工", time: "02:35", text: "好，这些指标在理论上是完美的，但必须拿回我们实验室测试。需要寄送5件阻燃复合材料块样进行拉伸与绝缘实验。高温环境我们要重点模拟车规级120℃烤箱测试，看拉伸物理变色和击穿。要是发生衰减那就绝对不能通过！", isHighlighted: true },
      { speaker: "销售张经理", time: "04:30", text: "我们库房正好有规格块样品，下午我就叫顺丰寄过去，单号我会随时同步。" },
      { speaker: "比亚迪陈工", time: "05:15", text: "恩，一般测试周期在10天左右。只要绝缘阻抗在高温120度下不发生严重衰减，咱们就进入下一步商务谈价。下一期跟进会议咱们暂定7月16号。" }
    ],
    objections: [
      "绝缘阻抗在120℃高温工作环境下是否会发生严重电衰减或击穿",
      "硬度及抗拉伸强度能否承受1.5万次的车规级颠簸与跌落冲击测试"
    ],
    competitorMentions: [
      {
        competitor: "G公司 (帝人化学)",
        price: "18.00元/kg",
        useCase: "Teijin-PP-GF30 玻纤PP，用量 150 吨/月",
        rating: "高温性能衰减明显，震动韧性一般",
        context: "试过G公司的Teijin-PP-GF30，用量150吨，单价18.00元/kg。其绝缘性能在高温衰减快..."
      }
    ],
    highlightedParagraphs: [
      "我们要的不仅是硬度高、阻燃好，还要密度比传统的玻纤复合材料低至少20%...",
      "只要绝缘阻抗在高温120度下不发生严重衰减，咱们就进入下一步商务谈价。下一期暂定7月16号..."
    ]
  },
  {
    id: "lark-rec-3",
    title: "【安克录音豆】_20260703_极氪汽车章静采购回访洽谈.mp3",
    duration: "08分10秒",
    recordTime: "2026-07-03 16:40",
    salesperson: "张经理",
    synced: false,
    minuteToken: "lark_mq_zkr_091124",
    createTime: "2026-07-03 17:00",
    owner: "张经理 (销售部)",
    coverUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
    feishuMinutesUrl: "https://bytedance.feishu.cn/minutes/lark_mq_zkr_091124",
    status: "ready",
    transcript: `销售张经理：章总您好，好久没和您面对面沟通了，这次回访主要想了解下之前送样车机主板控温IC的使用情况。
极氪章总：张经理，其实前段时间样品发给研发，他们试用了下，发现你们的IC发热确实不错，但是目前我们的采购重点发生了一些变化。由于新车机系统进行了架构合并，我们现在需要的是多通道高度集成的控制芯片，而不是单通道控制。
销售张经理：哦，原来是这样。
极氪章总：对，所以之前的样品不适配，我们需要对采购型号重新选型。如果你们有八通道或者十二通道的主板控制IC，可以整理一份汇报PPT，咱们下周再抽空研讨。
销售张经理：没问题章总，非常感谢这个宝贵反馈，这让我们能立刻对齐需求。我会在7月15号前整理出我们八通道控制IC (AX-508)的全部技术汇报PPT，带队去宁波总部拜访您。`,
    transcriptSegments: [
      { speaker: "销售张经理", time: "00:08", text: "章总您好，好久没和您面对面沟通了，这次回访主要想了解下之前送样车机主板控温IC的使用情况。" },
      { speaker: "极氪章总", time: "00:35", text: "张经理，其实前段时间样品发给研发，他们试用了下，发现你们的IC发热确实不错，但是目前我们的采购重点发生了一些变化。由于新车机系统进行了架构合并，我们现在需要的是多通道高度集成的控制芯片，而不是单通道控制。之前用的是德州仪器（TI）的多通道集成IC，单价要 32 元左右，月均需求 40k 颗。但是TI的交期极度不稳定，经常跳票！", isHighlighted: true },
      { speaker: "销售张经理", time: "01:22", text: "哦，原来是这样。" },
      { speaker: "极氪章总", time: "01:40", text: "对，所以之前的样品不适配，我们需要对采购型号重新选型。如果你们有八通道或者十二通道的主板控制IC，可以整理一份汇报PPT，咱们下周再抽空研讨。主要卡在多合一控制上，单通道完全不够用。", isHighlighted: true },
      { speaker: "销售张经理", time: "02:15", text: "没问题章总，非常感谢这个宝贵反馈，这让我们能立刻对齐需求。我会在7月15号前整理出我们八通道控制IC (AX-508)的全部技术汇报PPT，带队去宁波总部拜访您。" }
    ],
    objections: [
      "车机系统合并架构导致单通道控制方案彻底不适配，需要高度集成的多通道方案",
      "竞争对手德州仪器（TI）方案的交期极度不稳定，严重阻碍了量产进度"
    ],
    competitorMentions: [
      {
        competitor: "德州仪器 (TI)",
        price: "32.00元",
        useCase: "多通道集成控温IC，用量约 40k/月",
        rating: "性能和通道集成度极高，但供应链交期经常跳票不稳定",
        context: "之前用德州仪器（TI）多通道芯片，单价要32元左右。但交期太不稳常跳票..."
      }
    ],
    highlightedParagraphs: [
      "新车机系统进行了架构合并，我们现在需要的是多通道高度集成的控制芯片，而不是单通道控制...",
      "如果你们有八通道或者十二通道的主板控制IC，可以整理一份汇报PPT..."
    ]
  },
  {
    id: "lark-rec-4",
    title: "【安克录音豆】_20260707_离线存储音频_广汽埃安车规阻燃检测.mp3",
    duration: "05分30秒",
    recordTime: "2026-07-07 09:30",
    salesperson: "张经理",
    synced: false,
    minuteToken: "lark_mq_gac_offline",
    createTime: "2026-07-07 09:45",
    owner: "张经理 (销售部)",
    coverUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
    feishuMinutesUrl: "https://bytedance.feishu.cn/minutes/lark_mq_gac_offline",
    status: "linking", // 录音关联中
    transcript: `销售张经理：顾工，关于这次广汽埃安第二期密封罩阻燃检测项目，咱们的新版阻燃块各项指标对齐怎么样？
广汽顾工：张经理，我们刚做完初步的灼热丝和针焰测试。结果显示，在750度灼热丝下，材料起燃时间延迟了近4秒，满足了埃安内部的V-0阻燃规范。
销售张经理：太好了！那我们下一步是不是可以推进小批量上车验证？
广汽顾工：对的，现在我们需要50件正样密封罩进行一期台架和颠簸实验。不过测试周期大概要15天，你们先把这50件样品排产出来寄给我们，我们一收到就启动实验。`,
    transcriptSegments: [
      { speaker: "销售张经理", time: "00:05", text: "顾工，关于这次广汽埃安第二期密封罩阻燃检测项目，咱们的新版阻燃块各项指标对齐怎么样？" },
      { speaker: "广汽顾工", time: "00:45", text: "张经理，我们刚做完初步的灼热丝和针焰测试。结果显示，在750度灼热丝下，材料起燃时间延迟了近4秒，满足了埃安内部的V-0阻燃规范。相比起之前在用美国杜邦的FR-50复合粒子（单价55元/kg，用量8吨/月），不仅阻燃效率一致，还便宜了25%！", isHighlighted: true },
      { speaker: "销售张经理", time: "01:50", text: "太好了！那我们下一步是不是可以推进小批量上车验证？" },
      { speaker: "广汽顾工", time: "02:15", text: "对的，现在我们需要50件正样密封罩进行一期台架和颠簸实验。不过测试周期大概要15天，你们先把这50件样品排产出来寄给我们，我们一收到就启动实验。预计下周一我们会排会讨论第一期检验单。", isHighlighted: true }
    ],
    objections: [
      "台架与整车颠簸测试周期长达15天，对项目的开发量产排期形成压力",
      "需要50件高一致性的正样密封罩进行严格的破坏性台架考核"
    ],
    competitorMentions: [
      {
        competitor: "杜邦 (DuPont)",
        price: "55.00元/kg",
        useCase: "FR-50阻燃复合粒子，用量约 8吨/月",
        rating: "阻燃绝缘优质但价格偏高",
        context: "在用美国杜邦的FR-50复合粒子，单价55元/kg，月用8吨。我们的阻燃效率一致，还便宜25%..."
      }
    ],
    highlightedParagraphs: [
      "在750度灼热丝下，材料起燃时间延迟了近4秒，满足了埃安内部的V-0阻燃规范...",
      "现在我们需要50件正样密封罩进行一期台架和颠簸实验。测试周期大概要15天..."
    ]
  }
];
