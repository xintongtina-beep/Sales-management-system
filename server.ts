import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Graceful JSON parsing error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "请求数据不是有效的 JSON 格式" });
  }
  return next(err);
});

// Initialize Gemini SDK lazily
let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_")) {
      console.warn("⚠️ GEMINI_API_KEY is not set or using placeholder. Running in fallback/mock mode for AI features.");
      return null;
    }
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (err) {
      console.error("❌ Failed to initialize GoogleGenAI client:", err);
      return null;
    }
  }
  return ai;
}

// 7-day in-memory Cache for industrial enterprise searches and details
interface CacheEntry {
  data: any;
  timestamp: number;
}
const enterpriseCache = new Map<string, CacheEntry>();

// API Quota state for the three data sources
const apiQuota = {
  tianyancha: { used: 842, limit: 1000, name: "天眼查" },
  qichacha: { used: 456, limit: 1000, name: "企查查" },
  qixinbao: { used: 212, limit: 1000, name: "启信宝" }
};

// Simulates API failover logic and returns warning logs if failover happened
function handleSourceSelection(preferredSource: string, simulateFail: boolean) {
  let activeSource = preferredSource;
  const warnings: string[] = [];

  if (simulateFail) {
    warnings.push(`⚠️ 主数据源 [${apiQuota[preferredSource as keyof typeof apiQuota]?.name || preferredSource}] 发生网络断连/调用受限 (自动切换故障)`);
    if (preferredSource === "tianyancha") {
      activeSource = "qichacha";
    } else if (preferredSource === "qichacha") {
      activeSource = "qixinbao";
    } else {
      activeSource = "tianyancha";
    }
    warnings.push(`🔄 智能路由自动熔断，并秒级切换到备用数据源 [${apiQuota[activeSource as keyof typeof apiQuota]?.name}] 进行数据抓取`);
  }

  // Increment quota
  const sourceKey = activeSource as keyof typeof apiQuota;
  if (apiQuota[sourceKey]) {
    apiQuota[sourceKey].used += 1;
    if (apiQuota[sourceKey].used / apiQuota[sourceKey].limit >= 0.8) {
      warnings.push(`📊 接口配额警告: 数据源 [${apiQuota[sourceKey].name}] 接口配额已使用 ${apiQuota[sourceKey].used}/${apiQuota[sourceKey].limit} (${Math.round(apiQuota[sourceKey].used / apiQuota[sourceKey].limit * 100)}%)，达到80%阈值！`);
    }
  }

  return { activeSource, warnings };
}

// Enterprise query fuzzy candidates list
app.post("/api/enterprise/search", async (req, res) => {
  const { query, source = "tianyancha", simulateFail = false } = req.body;
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "请输入企业名称或信用代码" });
  }

  const { activeSource, warnings } = handleSourceSelection(source, simulateFail);
  const cacheKey = `search:${query}:${activeSource}`;
  const cached = enterpriseCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < 7 * 24 * 60 * 60 * 1000)) {
    console.log(`⚡ Search cache hit for: ${query}`);
    return res.json({
      candidates: cached.data,
      activeSource,
      warnings,
      cached: true,
      quota: apiQuota
    });
  }

  let candidates: any[] = [];
  const q = query.trim();

  if (q.includes("小米") || q.toLowerCase().includes("xiaomi")) {
    candidates = [
      { name: "小米通讯技术有限公司", creditCode: "91110108671717366X", legalRep: "王川", regStatus: "在营（开业）", address: "北京市海淀区西二旗中路33号院", formerNames: "北京小米通讯技术有限公司" },
      { name: "小米科技有限责任公司", creditCode: "91110108551385082C", legalRep: "雷军", regStatus: "存续", address: "北京市海淀区西二旗中路33号院小米科技园", formerNames: "无" },
      { name: "小米汽车科技有限公司", creditCode: "91110108MA04E3P84C", legalRep: "雷军", regStatus: "存续", address: "北京市北京经济技术开发区环景路18号院", formerNames: "无" }
    ];
  } else if (q.includes("比亚迪") || q.toLowerCase().includes("byd")) {
    candidates = [
      { name: "比亚迪股份有限公司", creditCode: "91440300192213825D", legalRep: "王传福", regStatus: "存续", address: "深圳市坪山区比亚迪路3009号", formerNames: "深圳市比亚迪实业有限公司" },
      { name: "比亚迪汽车工业有限公司", creditCode: "91440300726137688K", legalRep: "王传福", regStatus: "存续", address: "深圳市坪山区龙田街道比亚迪路3009号", formerNames: "无" }
    ];
  } else if (q.includes("极氪") || q.toLowerCase().includes("zeekr")) {
    candidates = [
      { name: "极氪汽车（宁波）有限公司", creditCode: "91330201MA2J6URD9B", legalRep: "安聪慧", regStatus: "存续", address: "浙江省宁波市北仑区新碶街道辽河路18号", formerNames: "无" },
      { name: "浙江极氪智能科技有限公司", creditCode: "91330108MA2JQRE38U", legalRep: "安聪慧", regStatus: "存续", address: "浙江省杭州市滨江区江陵路1760号", formerNames: "无" }
    ];
  } else if (q.includes("腾讯") || q.toLowerCase().includes("tencent")) {
    candidates = [
      { name: "深圳市腾讯计算机系统有限公司", creditCode: "91440300192243685B", legalRep: "马化腾", regStatus: "存续", address: "深圳市南山区粤海街道麻岭社区科技中一路腾讯大厦35层", formerNames: "无" },
      { name: "腾讯科技（深圳）有限公司", creditCode: "91440300715223005T", legalRep: "马化腾", regStatus: "存续", address: "深圳市南山区高新区科技中一路腾讯大厦35-38楼", formerNames: "无" }
    ];
  } else if (q.includes("安克") || q.toLowerCase().includes("anker")) {
    candidates = [
      { name: "安克创新科技股份有限公司", creditCode: "91430100588523315Q", legalRep: "阳萌", regStatus: "存续", address: "湖南省长沙市高新区尖山路39号长沙先进储能产业园", formerNames: "湖南海翼电子商务股份有限公司" },
      { name: "深圳安克创新科技有限公司", creditCode: "9144030034228965XR", legalRep: "阳萌", regStatus: "存续", address: "深圳市南山区西丽街道留仙大道", formerNames: "无" }
    ];
  } else if (q.includes("华为") || q.toLowerCase().includes("huawei")) {
    candidates = [
      { name: "华为技术有限公司", creditCode: "914403001922038216", legalRep: "赵明路", regStatus: "存续", address: "深圳市龙岗区坂田华为总部办公楼", formerNames: "深圳市华为技术有限公司" },
      { name: "华为投资控股有限公司", creditCode: "914403007503370954", legalRep: "赵明路", regStatus: "存续", address: "深圳市龙岗区坂田华为总部办公楼", formerNames: "无" }
    ];
  } else if (q.trim().length >= 2) {
    // Return same-name similar choices for demo purposes
    const cleanName = q.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
    candidates = [
      {
        name: `${cleanName}科技有限公司`,
        creditCode: `91310115MA1K${Math.floor(100000 + Math.random() * 900000)}XX`,
        legalRep: "张华",
        regStatus: "存续",
        address: `中国(上海)自由贸易试验区世纪大道${Math.floor(100 + Math.random() * 900)}号`,
        formerNames: "无"
      },
      {
        name: `${cleanName}（深圳）智能装备有限公司`,
        creditCode: `91440300MA5F${Math.floor(100000 + Math.random() * 900000)}YY`,
        legalRep: "李强",
        regStatus: "在营（开业）",
        address: "深圳市坪山区龙田街道科技园",
        formerNames: `${cleanName}电子部件制造厂`
      }
    ];
  }

  enterpriseCache.set(cacheKey, { data: candidates, timestamp: now });

  return res.json({
    candidates,
    activeSource,
    warnings,
    cached: false,
    quota: apiQuota
  });
});

// Detailed company information query with full 12+ fields and Phase 3 capabilities
app.post("/api/enterprise/detail", async (req, res) => {
  const { companyName, creditCode, source = "tianyancha", simulateFail = false } = req.body;
  if (!companyName) {
    return res.status(400).json({ error: "请输入需要检索的完整企业全称" });
  }

  const { activeSource, warnings } = handleSourceSelection(source, simulateFail);
  const cacheKey = `detail:${companyName}:${activeSource}`;
  const cached = enterpriseCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < 7 * 24 * 60 * 60 * 1000)) {
    console.log(`⚡ Detail cache hit for: ${companyName}`);
    return res.json({
      detail: cached.data,
      activeSource,
      warnings,
      cached: true,
      quota: apiQuota
    });
  }

  const generateMockDetails = (name: string, code?: string) => {
    const isAnker = name.includes("安克") || name.includes("Anker");
    const isBYD = name.includes("比亚迪") || name.includes("BYD");
    const isXiaomi = name.includes("小米") || name.includes("Xiaomi");
    const isZeekr = name.includes("极氪") || name.includes("Zeekr");
    const isTencent = name.includes("腾讯") || name.includes("Tencent");
    const isHuawei = name.includes("华为") || name.includes("Huawei");

    let details = {
      name: name,
      creditCode: code || "91440300MA5FL3HG0X",
      legalRep: "张敏敏",
      capital: "1,500万元人民币",
      paidInCapital: "1,200万元人民币",
      establishDate: "2019-03-24",
      address: "深圳市坪山区龙田街道先进制造产业园B栋3楼",
      scope: "从事半导体核心温控芯片、新型阻燃封装材料、散热模块的自主研发、方案设计与实体销售；电子专用材料研发及测试服务；自营进出口贸易。",
      companyType: "有限责任公司（自然人投资或控股）",
      industryCategory: "科技推广和应用服务业",
      regStatus: "存续（在营、开业、在册）",
      formerNames: "无",
      riskTags: ["经营异常（已移出）", "轻微行政处罚已结案"],
      associatedEntities: [
        { name: `${name}北京分部`, relation: "分支机构", creditCode: "91110108MA998811XX" },
        { name: "深创投高新成长科技投资基金", relation: "战略投资方 (持股15%)", creditCode: "91440300MA556677YY" },
        { name: "智能温感半导体技术研发（苏州）有限公司", relation: "全资子公司 (持股100%)", creditCode: "91320500MA112233ZZ" }
      ],
      competitors: ["安克创新", "绿联科技", "紫米科技"],
      changeLogs: [
        { date: "2024-02-18", type: "注册资本变更", before: "500万元人民币", after: "1,500万元人民币" },
        { date: "2025-05-12", type: "法定代表人变更", before: "王强", after: "张敏敏" }
      ]
    };

    if (isAnker) {
      details = {
        name: "安克创新科技股份有限公司",
        creditCode: "91430100588523315Q",
        legalRep: "阳萌",
        capital: "40,642.593万元人民币",
        paidInCapital: "40,642.593万元人民币",
        establishDate: "2011-12-06",
        address: "湖南省长沙市高新区尖山路39号长沙先进储能产业园1栋",
        scope: "电子产品、智能硬件、充电设备、移动周边、数码产品的研发、设计与销售；软件开发与技术服务；货物及技术进出口等。",
        companyType: "股份有限公司 (上市、自然人投资或控股)",
        industryCategory: "计算机、通信和其他电子设备制造业",
        regStatus: "存续",
        formerNames: "湖南海翼电子商务股份有限公司",
        riskTags: ["暂无行政处罚", "司法仲裁(2条)"],
        associatedEntities: [
          { name: "深圳安克创新科技有限公司", relation: "全资子公司 (100%控股)", creditCode: "9144030034228965XR" },
          { name: "阳萌", relation: "第一大股东 (持股44.5%)", creditCode: "个人证件件" },
          { name: "安克创新（香港）有限公司", relation: "控股境外子公司", creditCode: "1674482" }
        ],
        competitors: ["Baseus倍思", "UGREEN绿联", "ZMI紫米", "品胜电子"],
        changeLogs: [
          { date: "2020-08-24", type: "企业类型变更", before: "其他股份有限公司(非上市)", after: "股份有限公司(上市、自然人投资或控股)" },
          { date: "2022-03-15", type: "注册资本变更", before: "40,111万元", after: "40,642.593万元" }
        ]
      };
    } else if (isBYD) {
      details = {
        name: "比亚迪股份有限公司",
        creditCode: "91440300192213825D",
        legalRep: "王传福",
        capital: "291,118.08万元人民币",
        paidInCapital: "291,118.08万元人民币",
        establishDate: "1995-02-10",
        address: "深圳市坪山区比亚迪路3009号",
        scope: "新型电池、电泳涂漆、汽车、电动车及零部件的研发与销售；轨道交通、储能电站的设计、技术开发和系统集成等。",
        companyType: "股份有限公司（上市、自然人投资或控股）",
        industryCategory: "汽车制造业",
        regStatus: "存续",
        formerNames: "深圳市比亚迪实业有限公司",
        riskTags: ["司法诉讼(中风险)", "环保检测合格已复审"],
        associatedEntities: [
          { name: "比亚迪汽车工业有限公司", relation: "控股子公司 (持股99.8%)", creditCode: "91440300726137688K" },
          { name: "深圳比亚迪锂电池有限公司", relation: "控股子公司 (持股100%)", creditCode: "91440300192329821A" },
          { name: "融捷投资控股集团有限公司", relation: "第二大股东及一致行动人", creditCode: "91440101737523991C" }
        ],
        competitors: ["特斯拉", "蔚来汽车", "理想汽车", "吉利控股"],
        changeLogs: [
          { date: "2021-11-05", type: "章程备案变更", before: "原经营范围细化", after: "新版经营范围细化" },
          { date: "2023-01-10", type: "注册资本变更", before: "291,118万元", after: "291,118.08万元" }
        ]
      };
    } else if (isXiaomi) {
      details = {
        name: "小米通讯技术有限公司",
        creditCode: "91110108671717366X",
        legalRep: "王川",
        capital: "320,000万美元",
        paidInCapital: "320,000万美元",
        establishDate: "2010-04-13",
        address: "北京市海淀区西二旗中路33号院小米科技园H栋",
        scope: "开发手机技术、计算机软件及系统集成；销售自产产品；批发电子产品、通信设备并提供售后服务与技术支持等。",
        companyType: "有限责任公司（外国法人独资）",
        industryCategory: "计算机、通信和其他电子设备制造业",
        regStatus: "在营（开业）",
        formerNames: "北京小米通讯技术有限公司",
        riskTags: ["暂无重大税务异常", "知识产权纠纷(中风险)"],
        associatedEntities: [
          { name: "Xiaomi H.K. Limited", relation: "控股股东 (100%持股)", creditCode: "HK-143229" },
          { name: "小米科技有限责任公司", relation: "兄弟企业/联合管理体", creditCode: "91110108551385082C" },
          { name: "北京小米移动软件有限公司", relation: "控股子公司 (100%持股)", creditCode: "91110108596085532E" }
        ],
        competitors: ["华为技术", "OPPO广东移动通信", "VIVO移动通信", "荣耀终端"],
        changeLogs: [
          { date: "2019-12-02", type: "注册资本变更", before: "240,000万美元", after: "320,000万美元" },
          { date: "2024-03-25", type: "法定代表人变更", before: "雷军", after: "王川" }
        ]
      };
    }

    return details;
  };

  const client = getGeminiClient();

  if (!client) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = generateMockDetails(companyName, creditCode);
    enterpriseCache.set(cacheKey, { data, timestamp: now });
    return res.json({
      detail: data,
      activeSource,
      warnings,
      cached: false,
      quota: apiQuota
    });
  }

  try {
    console.log(`🔍 Querying Gemini Search Grounding for enterprise details: ${companyName}`);
    const prompt = `你是一个中国工商大数据API解析工具。请查阅最新互联网真实数据，查询并返回"${companyName}"（信用代码:${creditCode || '最新'}）的最新且极其详尽的工商注册信息和增值数据。
    你必须按照以下JSON Schema返回，格式需要严密、真实，数据如果包含外币需要换算说明。
    
    12+ 核心工商字段包括：
    - name: 企业官方名称
    - creditCode: 统一社会信用代码 (18位)
    - legalRep: 法定代表人姓名
    - capital: 注册资本 (格式如"X.XX万元人民币"或"X万美元")
    - paidInCapital: 实缴资本 (格式同注册资本)
    - establishDate: 成立日期 (YYYY-MM-DD)
    - address: 详细注册地址
    - scope: 经营范围段落
    - companyType: 企业类型 (如 "有限责任公司(自然人独资)")
    - industryCategory: 行业分类
    - regStatus: 登记状态 (如 "存续", "在营（开业）")
    - formerNames: 曾用名 (若无，请返回 "无")
    
    Phase 3 增值能力数据：
    - riskTags: 风险扫描标签数组 (从经营异常、行政处罚、司法诉讼中归纳，比如 ["司法诉讼(轻微)", "暂无行政处罚"] 或其他真实标签)
    - associatedEntities: 关联企业数组，每个对象包含 name (关联企业名称), relation (关联关系，如控股股东、子公司、分支机构等), creditCode (可选信用代码)
    - competitors: 核心竞品自动识别 (返回3个左右竞品公司的名字，格式为字符串数组)
    - changeLogs: 变更记录数组，每个对象包含 date (变更时间 YYYY-MM-DD), type (变更类型), before (变更前), after (变更后)

    注意：必须查阅互联网真实信息，返回完全合法的 JSON 字符串。
    如果无法查到真实，请根据公司行业智能生成高水准拟真数据。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            creditCode: { type: Type.STRING },
            legalRep: { type: Type.STRING },
            capital: { type: Type.STRING },
            paidInCapital: { type: Type.STRING },
            establishDate: { type: Type.STRING },
            address: { type: Type.STRING },
            scope: { type: Type.STRING },
            companyType: { type: Type.STRING },
            industryCategory: { type: Type.STRING },
            regStatus: { type: Type.STRING },
            formerNames: { type: Type.STRING },
            riskTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            associatedEntities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  relation: { type: Type.STRING },
                  creditCode: { type: Type.STRING }
                },
                required: ["name", "relation"]
              }
            },
            competitors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            changeLogs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  type: { type: Type.STRING },
                  before: { type: Type.STRING },
                  after: { type: Type.STRING }
                },
                required: ["date", "type", "before", "after"]
              }
            }
          },
          required: [
            "name", "creditCode", "legalRep", "capital", "paidInCapital", "establishDate", 
            "address", "scope", "companyType", "industryCategory", "regStatus", "formerNames",
            "riskTags", "associatedEntities", "competitors", "changeLogs"
          ]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      enterpriseCache.set(cacheKey, { data, timestamp: now });
      return res.json({
        detail: data,
        activeSource,
        warnings,
        cached: false,
        quota: apiQuota
      });
    } else {
      throw new Error("Empty details response text from Gemini");
    }
  } catch (err) {
    console.error("❌ Gemini detailed search failed, returning procedurally generated details:", err);
    const data = generateMockDetails(companyName, creditCode);
    return res.json({
      detail: data,
      activeSource,
      warnings,
      cached: false,
      quota: apiQuota
    });
  }
});

// 2. API: Auto-fetch company registration details (工商信息)
app.post("/api/company-info", async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    return res.status(400).json({ error: "请输入公司名称" });
  }

  const client = getGeminiClient();

  // If Gemini client is unavailable or if search fails, use highly realistic mock data generators
  const generateMockCompanyInfo = (name: string) => {
    const isXiaomi = name.includes("小米") || name.toLowerCase().includes("xiaomi");
    const isTencent = name.includes("腾讯") || name.toLowerCase().includes("tencent");
    const isAnker = name.includes("安克") || name.includes("anker");
    const isHuawei = name.includes("华为") || name.toLowerCase().includes("huawei");

    if (isXiaomi) {
      return {
        name: "小米科技有限责任公司",
        creditCode: "91110108551385082C",
        legalRep: "雷军",
        capital: "185,000万元人民币",
        establishDate: "2010-03-03",
        address: "北京市海淀区西二旗中路33号院小米科技园",
        scope: "技术开发、技术咨询、技术服务、技术转让；销售自行开发的产品；计算机系统服务；销售计算机、软件及辅助设备、通信设备、电子产品、家用电器等。"
      };
    } else if (isTencent) {
      return {
        name: "深圳市腾讯计算机系统有限公司",
        creditCode: "91440300192243685B",
        legalRep: "马化腾",
        capital: "6,500万元人民币",
        establishDate: "1998-11-11",
        address: "深圳市南山区粤海街道麻岭社区科技中一路腾讯大厦35层",
        scope: "计算机软、硬件的技术开发、销售；数据库及计算机网络服务；国内商业、物资供销业；互联网信息服务等。"
      };
    } else if (isAnker) {
      return {
        name: "安克创新科技股份有限公司",
        creditCode: "91430100588523315Q",
        legalRep: "阳萌",
        capital: "40,642万元人民币",
        establishDate: "2011-12-06",
        address: "湖南省长沙市高新区尖山路39号长沙先进储能产业园1栋",
        scope: "电子产品、智能硬件、充电设备、移动周边、数码产品的研发、设计与销售；软件开发与技术服务；货物及技术进出口等。"
      };
    } else if (isHuawei) {
      return {
        name: "华为投资控股有限公司",
        creditCode: "914403007503370954",
        legalRep: "赵明",
        capital: "4,401,232.5万元人民币",
        establishDate: "2003-03-14",
        address: "深圳市龙岗区坂田华为总部办公楼",
        scope: "对高科技产业、通信产业等进行投资；自营和代理各类商品及技术的进出口业务；研发、制造、销售通信设备、计算机软硬件等。"
      };
    }

    // Generic realistic mockup
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const codeSuffix = (hash * 17) % 100000;
    const capitalAmount = (hash % 900) + 100;
    const year = 2005 + (hash % 18);
    const month = String((hash % 12) + 1).padStart(2, "0");
    const day = String((hash % 28) + 1).padStart(2, "0");

    return {
      name: name.endsWith("公司") ? name : `${name}科技有限公司`,
      creditCode: `91310115MA1K${codeSuffix}XX`,
      legalRep: ["张伟", "李杰", "刘强", "王刚", "陈林", "赵敏"][hash % 6],
      capital: `${capitalAmount}万元人民币`,
      establishDate: `${year}-${month}-${day}`,
      address: `中国(上海)自由贸易试验区世纪大道${100 + (hash % 1500)}号第${2 + (hash % 30)}层`,
      scope: "从事智能科技、电子科技、网络科技领域内的技术开发、技术服务、技术转让；电子元器件、集成电路、数码产品、软硬件的销售；国内贸易与货物进出口。"
    };
  };

  if (!client) {
    // Return mock data after brief delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.json(generateMockCompanyInfo(companyName));
  }

  try {
    console.log(`🔍 Querying Gemini with Search Grounding for company: ${companyName}`);
    
    const prompt = `你是一个中国工商企业注册信息登记助理。请查阅并给出"${companyName}"的最新工商注册登记信息。
    必须包含以下字段，并必须根据真实搜索结果填写真实数据，如果由于某些原因查询不到真实数值，请给出合情理的代表性假想数值，但格式必须严格正确：
    1. 公司名称 (name) - 官方注册全称
    2. 统一社会信用代码 (creditCode) - 18位信用代码
    3. 法定代表人 (legalRep) - 姓名
    4. 注册资本 (capital) - 格式如 "X万元人民币" 或 "X.XX万元"
    5. 成立日期 (establishDate) - 格式如 "YYYY-MM-DD"
    6. 注册地址 (address) - 详细地址
    7. 经营范围 (scope) - 详细经营范围段落
    
    注意：请查阅最新互联网真实数据进行搜索，并严格以指定的JSON格式返回。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Official company name" },
            creditCode: { type: Type.STRING, description: "18-character unified social credit code" },
            legalRep: { type: Type.STRING, description: "Legal representative name" },
            capital: { type: Type.STRING, description: "Registered capital amount, e.g., '1000万元人民币'" },
            establishDate: { type: Type.STRING, description: "Date of establishment in YYYY-MM-DD format" },
            address: { type: Type.STRING, description: "Registered office address" },
            scope: { type: Type.STRING, description: "Business scope details" },
          },
          required: ["name", "creditCode", "legalRep", "capital", "establishDate", "address", "scope"]
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("Gemini returned empty text response");
    }
  } catch (error) {
    console.error("❌ Gemini API failed for company search, using fallback:", error);
    // Fallback to high quality mock generator
    return res.json(generateMockCompanyInfo(companyName));
  }
});

// 2. API: Process Recording Transcript (安克AI录音豆音频智能转译与摘要分析)
app.post("/api/lark/process-recording", async (req, res) => {
  const { transcript, title } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: "缺失录音文本内容" });
  }

  const client = getGeminiClient();

  const generateLocalSummary = (text: string) => {
    // Generate intelligent-looking mock based on keywords
    const hasSample = text.includes("样") || text.includes("测试");
    const hasContract = text.includes("合同") || text.includes("协议") || text.includes("签约");
    const hasPrice = text.includes("价格") || text.includes("报价") || text.includes("成本");

    let painPoints = "客户希望寻找高性价的产品方案，目前对现有供应商的交付响应速度和技术匹配度有顾虑。";
    let consensus = "双方确定先进行技术可行性对齐，如果测试通过将开展小批量采购。";
    let actions = "1. 提供我司最新技术白皮书和产品规格书；\n2. 安排送样，安排实验室测试评估；\n3. 拟定下一轮商务会谈。";
    let nextFollowUpDate = "2026-07-13";
    let sampleRequested = hasSample;
    let sampleDetails = hasSample ? "需要安排“核心控温主板样品” 2套进行性能测试" : "";

    if (text.includes("智能硬件") || text.includes("安克")) {
      painPoints = "客户当前的智能充电底座方案发热量较大，且接口协议兼容性差，急需升级电源IC和控温协议方案。";
      consensus = "我方推荐双芯片智能控温电源IC（AX-809），客户同意接受我方建议并进行样品测试。";
      actions = "1. 3个工作日内向客户寄送AX-809测试板样品及DEMO演示视频；\n2. 销售代表周五下午致电确认测试进展。";
      nextFollowUpDate = "2026-07-10";
      sampleRequested = true;
      sampleDetails = "AX-809智能控温电源IC测试板 3套";
    } else if (text.includes("新能源") || text.includes("比亚迪") || text.includes("新材料")) {
      painPoints = "客户新一代电池包外壳需要超轻高强度阻燃材料，目前市场上绝缘板重量超标，影响整体能量密度。";
      consensus = "我司推荐的碳纤维复合绝缘板（CF-12）契合轻量化要求，双方决定先进入首轮送样检测流程。";
      actions = "1. 向研发部申请 CF-12 规格块样 5件；\n2. 编制检测标准对齐表格发送给对方工程部；\n3. 10天后跟进检测结果报告。";
      nextFollowUpDate = "2026-07-16";
      sampleRequested = true;
      sampleDetails = "CF-12碳纤维复合阻燃材料块样 5件";
    }

    return {
      painPoints,
      consensus,
      actions,
      nextFollowUpDate,
      sampleRequested,
      sampleDetails
    };
  };

  if (!client) {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulating processing delay
    return res.json({ aiSummary: generateLocalSummary(transcript) });
  }

  try {
    console.log(`🎙️ Summarizing audio transcript with Gemini for: ${title || '客户拜访'}`);
    
    const prompt = `你是一个高水平的销售智能助理。下面是一段由销售代表通过飞书App中的“安克AI录音豆”在客户拜访现场录制并转译出来的沟通内容。
    
    请深入分析这段沟通文本，并提取、总结并输出为以下JSON结构的行动摘要：
    1. 客户痛点/需求 (painPoints) - 描述客户目前面临的业务、技术或管理痛点、真实需求等（详细中文表述）。
    2. 拜访达成共识 (consensus) - 描述本次拜访销售与客户双方达成了哪些一致意见或备忘录。
    3. 下步行动计划 (actions) - 描述销售方或双方下一步具体要做什么，需要序号标明（1, 2, 3...）。
    4. 建议下步跟进时间 (nextFollowUpDate) - 格式如 "YYYY-MM-DD" 的具体日期，根据谈话合理预估。
    5. 是否需要送样 (sampleRequested) - 布尔值 (true/false)，判断客户是否索要了样品或我方同意寄送样品。
    6. 样件详情 (sampleDetails) - 字符串，如果需要送样，说明样品名称、规格或数量。不需要则返回空字符串。

    录音文本：
    """
    ${transcript}
    """`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            painPoints: { type: Type.STRING, description: "Details of customer issues, pain points, or needs identified" },
            consensus: { type: Type.STRING, description: "Consensus or memorandum agreed upon by both parties during the meeting" },
            actions: { type: Type.STRING, description: "Numbered step-by-step next actions for sales reps" },
            nextFollowUpDate: { type: Type.STRING, description: "Recommended next follow-up date in YYYY-MM-DD format" },
            sampleRequested: { type: Type.BOOLEAN, description: "Whether the customer requested or agreed to receive samples" },
            sampleDetails: { type: Type.STRING, description: "Names, models, and quantity of samples if requested, otherwise empty" },
          },
          required: ["painPoints", "consensus", "actions", "nextFollowUpDate", "sampleRequested", "sampleDetails"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({ aiSummary: parsed });
    } else {
      throw new Error("Gemini returned empty text response");
    }
  } catch (err) {
    console.error("❌ Gemini failed to analyze recording transcript, using mock:", err);
    return res.json({ aiSummary: generateLocalSummary(transcript) });
  }
});


// ==========================================
// User Authentication & Verification Code APIs
// ==========================================
interface UserAccount {
  id: string;
  accountType: "phone" | "email";
  account: string;
  name: string;
  role: string;
  department: string;
  password?: string;
  avatar?: string;
  registeredAt: string;
  lastLoginAt: string;
}

interface StoredCode {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  type: "phone" | "email";
  purpose: "register" | "login";
}

const usersDb = new Map<string, UserAccount>();
const codesDb = new Map<string, StoredCode>();
const sessionTokens = new Map<string, string>(); // token -> userId

// Seed default test accounts for quick demo & verification
const seedUserPhone: UserAccount = {
  id: "usr_anker_001",
  accountType: "phone",
  account: "13800138000",
  name: "张经理 (销售业务总监)",
  role: "销售业务总监",
  department: "智能硬件销售一部",
  password: "admin",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  registeredAt: "2026-01-01 09:00:00",
  lastLoginAt: "2026-07-06 08:30:00"
};
usersDb.set("13800138000", seedUserPhone);

const seedUserEmail: UserAccount = {
  id: "usr_anker_002",
  accountType: "email",
  account: "sales@anker.com",
  name: "李主管 (大客户销售经理)",
  role: "大客户销售经理",
  department: "战略客户部",
  password: "admin",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  registeredAt: "2026-02-15 10:00:00",
  lastLoginAt: "2026-07-06 09:15:00"
};
usersDb.set("sales@anker.com", seedUserEmail);

function sanitizeEmail(email: string): string {
  return email
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)) // convert fullwidth ASCII (e.g. ＠ -> @)
    .replace(/。/g, ".")
    .replace(/，/g, ".")
    .replace(/＠/g, "@")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim().replace(/\s+/g, ""));
}

function isValidEmail(email: string): boolean {
  const sanitized = sanitizeEmail(email);
  // Flexible RFC 5322 compatible regex: allows subdomains, hyphens, plus tags, multi-part TLDs (e.g. user@sh.anker.com.cn)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized) && sanitized.length <= 100;
}

function normalizeAccount(account: string, type?: string): string {
  const trimmed = account.trim();
  if (type === "email" || trimmed.includes("@") || trimmed.includes("＠")) {
    return sanitizeEmail(trimmed);
  }
  return trimmed.replace(/\s+/g, "");
}

// 1. Send Verification Code (Phone / Email)
app.post("/api/auth/send-code", (req, res) => {
  const { account, type = "phone", purpose = "login" } = req.body;
  if (!account || typeof account !== "string" || !account.trim()) {
    return res.status(400).json({ error: "请输入手机号或电子邮箱" });
  }

  // Automatically detect account type if user typed email into phone or vice versa
  const actualType = (account.includes("@") || account.includes("＠") || type === "email") ? "email" : "phone";
  const cleanAccount = normalizeAccount(account, actualType);

  // Validate format
  if (actualType === "phone") {
    if (!isValidPhone(cleanAccount)) {
      return res.status(400).json({ error: "请输入正确的11位中国大陆手机号码 (如 13800138000)" });
    }
  } else {
    if (!isValidEmail(cleanAccount)) {
      return res.status(400).json({ error: "请输入规范的电子邮箱地址 (如 user@company.com 或 name@sh.anker.com)" });
    }
  }

  // If registering, check if account is already registered
  if (purpose === "register" && usersDb.has(cleanAccount)) {
    const existing = usersDb.get(cleanAccount);
    return res.status(400).json({ 
      error: `该${actualType === "email" ? "企业邮箱" : "手机号"}（${cleanAccount}）已注册为正式账号（姓名：${existing?.name || "已存在"}），无需重复注册。`,
      isRegistered: true,
      account: cleanAccount,
      type: actualType
    });
  }

  // Cooldown check (60s limit per account)
  const existingCode = codesDb.get(cleanAccount);
  const now = Date.now();
  if (existingCode && now - existingCode.lastSentAt < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - existingCode.lastSentAt)) / 1000);
    return res.status(429).json({ 
      error: `验证码发送过于频繁，请在 ${remainingSeconds} 秒后重新获取`,
      remainingSeconds
    });
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes valid

  codesDb.set(cleanAccount, {
    code,
    expiresAt,
    lastSentAt: now,
    type: actualType,
    purpose: purpose as any
  });

  console.log(`🔑 [AUTH-CODE] Sent ${actualType} verification code to ${cleanAccount}: ${code} (purpose: ${purpose})`);

  return res.json({
    success: true,
    message: `验证码已成功发送至您的${actualType === "phone" ? "手机" : "企业邮箱"}`,
    account: cleanAccount,
    type: actualType,
    code: code, // returned for preview convenience and instant autofill
    expiresIn: 300
  });
});

// 2. Register with Verification Code
app.post("/api/auth/register", (req, res) => {
  const { account, type = "phone", code, name, role, department, password } = req.body;
  
  if (!account || !code || !name) {
    return res.status(400).json({ error: "请填写完整注册信息（账号、验证码、姓名）" });
  }

  const actualType = (account.includes("@") || account.includes("＠") || type === "email") ? "email" : "phone";
  const cleanAccount = normalizeAccount(account, actualType);

  // Validate account format
  if (actualType === "phone" && !isValidPhone(cleanAccount)) {
    return res.status(400).json({ error: "手机号码格式不正确" });
  }
  if (actualType === "email" && !isValidEmail(cleanAccount)) {
    return res.status(400).json({ error: "电子邮箱格式不正确" });
  }

  // Check if account already exists
  if (usersDb.has(cleanAccount)) {
    return res.status(400).json({ 
      error: "该账号已注册，请直接使用验证码或密码登录",
      isRegistered: true,
      account: cleanAccount
    });
  }

  // Check verification code
  const record = codesDb.get(cleanAccount);
  if (!record || record.code !== code.trim()) {
    return res.status(400).json({ error: "验证码输入错误或已失效，请重新输入" });
  }
  if (Date.now() > record.expiresAt) {
    codesDb.delete(cleanAccount);
    return res.status(400).json({ error: "验证码已过期（有效时间5分钟），请重新获取" });
  }

  // Create new user account
  const userId = "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nowStr = new Date().toLocaleString("zh-CN", { hour12: false });
  const newUser: UserAccount = {
    id: userId,
    accountType: actualType,
    account: cleanAccount,
    name: name.trim(),
    role: role?.trim() || "销售客户经理",
    department: department?.trim() || "华东大区销售部",
    password: password?.trim() || "",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    registeredAt: nowStr,
    lastLoginAt: nowStr
  };

  usersDb.set(cleanAccount, newUser);
  codesDb.delete(cleanAccount); // code consumed

  // Generate session token
  const token = "token_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
  sessionTokens.set(token, userId);

  console.log(`✅ User registered successfully: ${newUser.name} (${cleanAccount})`);

  const { password: _, ...safeUser } = newUser;
  return res.json({
    success: true,
    message: "注册成功！已为您自动登录",
    user: safeUser,
    token
  });
});

// 3. Login with Verification Code (免密快捷验证码登录，未注册可自动建立档案)
app.post("/api/auth/login-code", (req, res) => {
  const { account, type = "phone", code } = req.body;

  if (!account || !code) {
    return res.status(400).json({ error: "请输入账号和验证码" });
  }

  const actualType = (account.includes("@") || account.includes("＠") || type === "email") ? "email" : "phone";
  const cleanAccount = normalizeAccount(account, actualType);

  // Validate format
  if (actualType === "phone" && !isValidPhone(cleanAccount)) {
    return res.status(400).json({ error: "手机号码格式不正确" });
  }
  if (actualType === "email" && !isValidEmail(cleanAccount)) {
    return res.status(400).json({ error: "电子邮箱格式不正确" });
  }

  // Verify code
  const record = codesDb.get(cleanAccount);
  if (!record || record.code !== code.trim()) {
    return res.status(400).json({ error: "验证码输入不正确或已失效" });
  }
  if (Date.now() > record.expiresAt) {
    codesDb.delete(cleanAccount);
    return res.status(400).json({ error: "验证码已过期，请重新获取" });
  }

  codesDb.delete(cleanAccount); // code consumed

  let user = usersDb.get(cleanAccount);
  const nowStr = new Date().toLocaleString("zh-CN", { hour12: false });

  if (!user) {
    // Auto register for seamless quick verification code login
    const userId = "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const autoName = actualType === "phone" 
      ? `销售代表 (${cleanAccount.slice(-4)})` 
      : `销售代表 (${cleanAccount.split("@")[0]})`;
    
    user = {
      id: userId,
      accountType: actualType,
      account: cleanAccount,
      name: autoName,
      role: "销售代表",
      department: "智能硬件销售部",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      registeredAt: nowStr,
      lastLoginAt: nowStr
    };
    usersDb.set(cleanAccount, user);
    console.log(`✨ New user auto-created via quick code login: ${user.name} (${cleanAccount})`);
  } else {
    user.lastLoginAt = nowStr;
    console.log(`🔐 Existing user logged in via code: ${user.name} (${cleanAccount})`);
  }

  const token = "token_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
  sessionTokens.set(token, user.id);

  const { password: _, ...safeUser } = user;
  return res.json({
    success: true,
    message: "登录成功",
    user: safeUser,
    token
  });
});

// 4. Login with Password (支持密码登录)
app.post("/api/auth/login-password", (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ error: "请输入账号和密码" });
  }

  const cleanAccount = normalizeAccount(account);
  const user = usersDb.get(cleanAccount);

  if (!user) {
    return res.status(400).json({ error: "账号不存在，请先使用验证码进行注册" });
  }

  if (!user.password || user.password !== password.trim()) {
    return res.status(400).json({ error: "密码错误，或可使用手机/邮箱验证码快捷免密登录" });
  }

  const nowStr = new Date().toLocaleString("zh-CN", { hour12: false });
  user.lastLoginAt = nowStr;

  const token = "token_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
  sessionTokens.set(token, user.id);

  console.log(`🔑 User logged in via password: ${user.name} (${cleanAccount})`);

  const { password: _, ...safeUser } = user;
  return res.json({
    success: true,
    message: "登录成功",
    user: safeUser,
    token
  });
});

// 5. Query Current User Profile
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登录或登录已过期" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const userId = sessionTokens.get(token);
  if (!userId) {
    return res.status(401).json({ error: "会话已失效，请重新登录" });
  }

  // Find user by userId
  let foundUser: UserAccount | null = null;
  for (const user of usersDb.values()) {
    if (user.id === userId) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({ error: "用户不存在" });
  }

  const { password: _, ...safeUser } = foundUser;
  return res.json({ success: true, user: safeUser });
});

// 6. Test / Demo Seed Accounts info
app.get("/api/auth/demo-accounts", (req, res) => {
  return res.json({
    accounts: [
      { type: "phone", account: "13800138000", name: "张经理 (业务总监)", role: "销售业务总监", password: "admin" },
      { type: "email", account: "sales@anker.com", name: "李主管 (大客户经理)", role: "大客户销售经理", password: "admin" }
    ]
  });
});

// Fallback for any unmatched /api routes to guarantee JSON response (never serve HTML)
app.all("/api/*", (req, res) => {
  return res.status(404).json({ error: `API 接口未找到: ${req.method} ${req.path}` });
});

async function bootstrap() {

  // Vite Dev / Prod handlers
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Sales Management Server running on port ${PORT}`);
  });
}

bootstrap();
