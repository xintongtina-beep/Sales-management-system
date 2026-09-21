import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  Building2, 
  Sparkles, 
  TrendingUp, 
  User, 
  Phone, 
  Calendar, 
  Compass, 
  Search,
  Filter,
  Package,
  CheckSquare,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { Customer, VisitRecord, SampleRecord, TodoTask } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface MapVisualizationProps {
  customers: Customer[];
  visits: VisitRecord[];
  samples: SampleRecord[];
  todos: TodoTask[];
  onFocusCustomer?: (customerId: string) => void;
}

// Fixed Corporate HQ Coords (Changsha: 112.9823, 28.1941)
const HQ_COORDS = { name: "安克创新总部 (长沙)", lng: 112.9823, lat: 28.1941, type: "hq" };
const SZ_OFFICE = { name: "深圳运营中心", lng: 114.0579, lat: 22.5431, type: "office" };

export default function MapVisualization({
  customers,
  visits,
  samples,
  todos,
  onFocusCustomer
}: MapVisualizationProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [hoveredCust, setHoveredCust] = useState<Customer | null>(null);
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [showHqConnections, setShowHqConnections] = useState(true);

  // Projection logic: maps (lng, lat) to SVG viewbox (0,0) to (600, 400)
  // Eastern/Central China mapping bounding box: Longitude 100 to 125, Latitude 18 to 42
  const project = (lng: number, lat: number) => {
    const minLng = 102;
    const maxLng = 125;
    const minLat = 18;
    const maxLat = 42;

    const x = ((lng - minLng) / (maxLng - minLng)) * 520 + 40;
    // Invert Y because SVG coordinates start at top
    const y = 360 - ((lat - minLat) / (maxLat - minLat)) * 320 + 20;

    return { x, y };
  };

  const hqPos = project(HQ_COORDS.lng, HQ_COORDS.lat);
  const szPos = project(SZ_OFFICE.lng, SZ_OFFICE.lat);

  // Filter customers with coordinates
  const validCustomers = useMemo(() => {
    return customers.map(c => {
      // Ensure everyone has coordinates
      if (!c.coordinates) {
        // Safe auto-assign fallback if newly created customer lacks coords
        const text = (c.name + " " + (c.address || "")).toLowerCase();
        let coords = { lng: 115.0, lat: 30.0 };
        if (text.includes("北京")) coords = { lng: 116.4074, lat: 39.9042 };
        else if (text.includes("深圳")) coords = { lng: 114.0579, lat: 22.5431 };
        else if (text.includes("宁波")) coords = { lng: 121.5497, lat: 29.8683 };
        else if (text.includes("东莞")) coords = { lng: 113.7518, lat: 23.0206 };
        else if (text.includes("上海")) coords = { lng: 121.4737, lat: 31.2304 };
        else if (text.includes("广州")) coords = { lng: 113.2644, lat: 23.1292 };
        else if (text.includes("杭州")) coords = { lng: 120.1551, lat: 30.2741 };
        else if (text.includes("成都")) coords = { lng: 104.0658, lat: 30.5728 };
        else {
          // Semi-randomize in reasonable economic hubs
          coords = {
            lng: Number((112 + Math.random() * 8).toFixed(4)),
            lat: Number((22 + Math.random() * 14).toFixed(4))
          };
        }
        return { ...c, coordinates: coords };
      }
      return c;
    });
  }, [customers]);

  // Filter list
  const filteredCustomers = useMemo(() => {
    return validCustomers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.address || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIndustry = selectedIndustry === "all" || c.industry === selectedIndustry;
      const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
      return matchesSearch && matchesIndustry && matchesStatus;
    });
  }, [validCustomers, searchTerm, selectedIndustry, selectedStatus]);

  // Selected customer object helper
  const activeCustomerObj = useMemo(() => {
    return validCustomers.find(c => c.id === selectedCustId) || null;
  }, [validCustomers, selectedCustId]);

  // Dynamic statistics per customer
  const getCustomerMetrics = (customerId: string) => {
    const custTodos = todos.filter(t => t.customerId === customerId && !t.isCompleted);
    const custSamples = samples.filter(s => s.customerId === customerId);
    const custVisits = visits.filter(v => v.customerId === customerId);
    return {
      todosCount: custTodos.length,
      samplesCount: custSamples.length,
      visitsCount: custVisits.length
    };
  };

  // Region aggregation for heat mapping
  const regionalBreakdown = useMemo(() => {
    let south = 0;
    let east = 0;
    let north = 0;
    let central = 0;

    validCustomers.forEach(c => {
      const lat = c.coordinates?.lat || 30;
      const lng = c.coordinates?.lng || 115;
      
      if (lat > 35) north++;
      else if (lng > 118) east++;
      else if (lat < 24) south++;
      else central++;
    });

    const total = validCustomers.length || 1;

    return [
      { name: "华南大区", count: south, pct: (south / total) * 100, color: "bg-emerald-500", hub: "深圳/东莞" },
      { name: "华东大区", count: east, pct: (east / total) * 100, color: "bg-sky-500", hub: "宁波/上海" },
      { name: "华北大区", count: north, pct: (north / total) * 100, color: "bg-indigo-500", hub: "北京" },
      { name: "华中及西南", count: central, pct: (central / total) * 100, color: "bg-amber-500", hub: "长沙/成都" },
    ];
  }, [validCustomers]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[560px]" id="map-visualization-root">
      
      {/* Map visualizer section */}
      <div className="flex-1 bg-slate-950 p-5 flex flex-col justify-between relative overflow-hidden h-2/3 lg:h-full">
        
        {/* Background visual styling (tech theme lines) */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Top bar settings */}
        <div className="flex items-center justify-between z-10 shrink-0">
          <div className="space-y-0.5">
            <h3 className="text-white font-bold text-xs flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
              <span>智能全国客户地理分布与业务雷达</span>
            </h3>
            <p className="text-[10px] text-slate-400">基于 Lng/Lat 精确坐标投影，实时对齐业务待办与送样流向</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHqConnections(!showHqConnections)}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                showHqConnections 
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/25" 
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              HQ 业务航线: {showHqConnections ? "显示" : "隐藏"}
            </button>
          </div>
        </div>

        {/* Map Stage */}
        <div className="flex-1 w-full relative flex items-center justify-center my-2" id="canvas-map-stage">
          
          <svg 
            viewBox="0 0 600 400" 
            className="w-full h-full max-h-[340px] select-none"
            id="china-business-svg-map"
          >
            {/* Background Grid Lines */}
            <g stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.04" strokeDasharray="3 3">
              {[...Array(12)].map((_, i) => (
                <line key={`x-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" />
              ))}
              {[...Array(8)].map((_, i) => (
                <line key={`y-${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} />
              ))}
            </g>

            {/* Stylized China Coastline Vector Background (Artistic representation for context) */}
            <path
              d="M 280 340 Q 300 330 330 310 T 400 290 T 480 210 T 520 180 T 500 130 T 480 110 T 450 70"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeOpacity="0.3"
            />
            
            {/* Legend inside SVG */}
            <g transform="translate(15, 340)" className="text-[9px]">
              <rect width="110" height="45" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
              <circle cx="12" cy="12" r="4" fill="#0ea5e9" className="animate-pulse" />
              <text x="24" y="15" fill="#94a3b8" className="font-semibold">新能源汽车 (AI/车载)</text>
              <circle cx="12" cy="28" r="4" fill="#ec4899" className="animate-pulse" />
              <text x="24" y="31" fill="#94a3b8" className="font-semibold">消费电子 (控温/散热)</text>
            </g>

            {/* Anker headquarters anchor node */}
            <g transform={`translate(${hqPos.x}, ${hqPos.y})`} id="hq-group">
              {/* Sonar Radar pulse rings */}
              <circle cx="0" cy="0" r="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" className="animate-ping" style={{ animationDuration: "3s" }} />
              <circle cx="0" cy="0" r="8" fill="none" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.8" className="animate-ping" style={{ animationDuration: "1.5s" }} />
              <circle cx="0" cy="0" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="8" y="3" fill="#f59e0b" className="text-[8px] font-bold tracking-wider" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                ANKER HQ
              </text>
            </g>

            {/* Shenzhen Center anchor node */}
            <g transform={`translate(${szPos.x}, ${szPos.y})`} id="sz-office-group">
              <circle cx="0" cy="0" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
              <text x="6" y="-3" fill="#c084fc" className="text-[7px] font-semibold" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                深圳分部
              </text>
            </g>

            {/* Headquarters Connection Lines */}
            {showHqConnections && filteredCustomers.map((c) => {
              if (!c.coordinates) return null;
              const dest = project(c.coordinates.lng, c.coordinates.lat);
              
              // Draw arc curved paths
              const dx = dest.x - hqPos.x;
              const dy = dest.y - hqPos.y;
              const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // bend factor

              const lineStyle = c.status === "active" ? "stroke-sky-500" : "stroke-slate-700";
              const isOverdue = c.nextFollowUp && new Date(c.nextFollowUp) < new Date("2026-07-06");

              return (
                <g key={`link-${c.id}`} opacity="0.6">
                  {/* Arc Path */}
                  <path
                    d={`M ${hqPos.x} ${hqPos.y} A ${dr} ${dr} 0 0 1 ${dest.x} ${dest.y}`}
                    fill="none"
                    className={`${isOverdue ? "stroke-rose-500/30" : "stroke-sky-500/20"}`}
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  {/* Glowing Flow Dot traveling down the line */}
                  <circle r="2" fill={isOverdue ? "#f43f5e" : "#38bdf8"}>
                    <animateMotion
                      path={`M ${hqPos.x} ${hqPos.y} A ${dr} ${dr} 0 0 1 ${dest.x} ${dest.y}`}
                      dur={`${2 + Math.random() * 3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Customer Pins */}
            {filteredCustomers.map((c) => {
              if (!c.coordinates) return null;
              const pos = project(c.coordinates.lng, c.coordinates.lat);
              const isSelected = selectedCustId === c.id;
              const metrics = getCustomerMetrics(c.id);

              // Colors based on Industry
              const pinColor = c.industry === "新能源汽车" ? "#0ea5e9" : "#ec4899"; // sky vs pink
              const activePulse = c.status === "active" ? "animate-pulse" : "";

              return (
                <g
                  key={c.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedCustId(c.id)}
                  onMouseEnter={() => setHoveredCust(c)}
                  onMouseLeave={() => setHoveredCust(null)}
                  id={`svg-pin-${c.id}`}
                >
                  {/* Pulse Ring */}
                  {c.status === "active" && (
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? "14" : "9"}
                      fill="none"
                      stroke={pinColor}
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                      className="animate-ping"
                      style={{ animationDuration: "2.5s" }}
                    />
                  )}

                  {/* Pin Dot Outer */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isSelected ? "8" : "6"}
                    fill={isSelected ? "#ffffff" : pinColor}
                    stroke={isSelected ? pinColor : "#ffffff"}
                    strokeWidth={isSelected ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:scale-125"
                  />

                  {/* Core Inner Point */}
                  {isSelected && (
                    <circle cx="0" cy="0" r="2.5" fill={pinColor} />
                  )}

                  {/* Task Alarm Badge overlay */}
                  {metrics.todosCount > 0 && (
                    <g transform="translate(6, -6)">
                      <circle r="4" fill="#ef4444" />
                      <text cx="0" cy="0" textAnchor="middle" y="2" fill="#ffffff" className="text-[5px] font-extrabold font-mono">
                        {metrics.todosCount}
                      </text>
                    </g>
                  )}

                  {/* Customer Label text */}
                  <text
                    x="10"
                    y="3"
                    fill={isSelected ? "#ffffff" : "#cbd5e1"}
                    className={`text-[8px] font-sans font-bold select-none opacity-80 group-hover:opacity-100 transition-opacity ${
                      isSelected ? "text-sky-400 text-[9px] font-extrabold" : ""
                    }`}
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {c.name.substring(0, 4)}...
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floater dynamic tooltip centered above hovered point */}
          <AnimatePresence>
            {hoveredCust && hoveredCust.coordinates && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                style={{
                  position: "absolute",
                  left: `${project(hoveredCust.coordinates.lng, hoveredCust.coordinates.lat).x}px`,
                  top: `${project(hoveredCust.coordinates.lng, hoveredCust.coordinates.lat).y - 65}px`,
                  transform: "translateX(-50%)"
                }}
                className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl w-56 text-slate-100 pointer-events-none z-20"
                id="svg-map-tooltip"
              >
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-1.5">
                  <span className="font-bold text-[11px] truncate text-white">{hoveredCust.name}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none uppercase ${
                    hoveredCust.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {hoveredCust.status === "active" ? "正常" : "待开发"}
                  </span>
                </div>

                <div className="space-y-1 text-[9px] text-slate-400 font-sans">
                  <p className="truncate">📍 地址：{hoveredCust.address}</p>
                  <p>📊 行业：{hoveredCust.industry}</p>
                  <p className="font-mono">🎯 坐标：{hoveredCust.coordinates.lng.toFixed(3)}, {hoveredCust.coordinates.lat.toFixed(3)}</p>
                  <div className="flex items-center space-x-3 pt-1 border-t border-slate-800/80 mt-1 text-[8px] font-semibold text-sky-400">
                    <span>拜访: {getCustomerMetrics(hoveredCust.id).visitsCount} 次</span>
                    <span>送样: {getCustomerMetrics(hoveredCust.id).samplesCount} 个</span>
                    <span className="text-rose-400">待办: {getCustomerMetrics(hoveredCust.id).todosCount} 个</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar summary details */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-400 shrink-0 z-10 font-sans">
          <span>💡 提示: 悬停定位点查看概览，点击可以调取具体关联数据、物流在途及回访安排</span>
          <span className="text-slate-500">投影模型: 墨卡托简易线性计算 (PRC Scale)</span>
        </div>
      </div>

      {/* Right details controller panel */}
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col h-1/3 lg:h-full overflow-hidden" id="map-control-panel">
        
        {/* Panel Header & Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>智能地图检索</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">检索匹配: {filteredCustomers.length} 家</span>
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索名称或注册省市..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="p-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-none bg-white text-slate-600"
              >
                <option value="all">行业不限</option>
                <option value="消费电子">消费电子</option>
                <option value="新能源汽车">新能源汽车</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-none bg-white text-slate-600"
              >
                <option value="all">状态不限</option>
                <option value="active">正常跟进</option>
                <option value="pending">待开发</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panel main scroll body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          <AnimatePresence mode="wait">
            {activeCustomerObj ? (
              /* Selected Customer Detail Card inside Map widget */
              <motion.div
                key={activeCustomerObj.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 text-xs"
                id="map-selected-customer-details"
              >
                {/* Header title */}
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{activeCustomerObj.name}</h4>
                    <button 
                      onClick={() => setSelectedCustId(null)} 
                      className="text-slate-400 hover:text-slate-600 font-bold px-1 text-[11px]"
                    >
                      返回列表
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{activeCustomerObj.address}</span>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-medium block">回访人/职务:</span>
                    <span className="font-bold text-slate-700 flex items-center">
                      <User className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                      {activeCustomerObj.contactPerson}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-medium block">回访周期/剩余</span>
                    <span className="font-bold text-slate-700 font-mono">
                      {activeCustomerObj.followUpCycle}天 / 
                      {activeCustomerObj.nextFollowUp ? (
                        <span className={new Date(activeCustomerObj.nextFollowUp) < new Date("2026-07-06") ? "text-rose-500" : "text-sky-600"}>
                          {Math.ceil((new Date(activeCustomerObj.nextFollowUp).getTime() - new Date("2026-07-06").getTime()) / (1000 * 60 * 60 * 24))}天
                        </span>
                      ) : "-"}
                    </span>
                  </div>
                  <div className="space-y-0.5 col-span-2 border-t border-slate-200/50 pt-2 mt-1">
                    <span className="text-slate-400 font-medium block">地理精准投影：</span>
                    <span className="font-mono text-[10px] text-indigo-600 flex items-center">
                      <Compass className="w-3 h-3 text-indigo-400 mr-1 shrink-0" />
                      Lng: {activeCustomerObj.coordinates?.lng.toFixed(4)} / Lat: {activeCustomerObj.coordinates?.lat.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Sub tracking module counters */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">业务流通指标</span>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block mb-0.5">到访次数</span>
                      <span className="font-bold font-mono text-slate-800 text-sm">
                        {getCustomerMetrics(activeCustomerObj.id).visitsCount}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block mb-0.5">正在送样</span>
                      <span className="font-bold font-mono text-sky-600 text-sm">
                        {getCustomerMetrics(activeCustomerObj.id).samplesCount}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block mb-0.5">待办执行</span>
                      <span className="font-bold font-mono text-rose-500 text-sm">
                        {getCustomerMetrics(activeCustomerObj.id).todosCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions quick navigation list */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <button
                    onClick={() => onFocusCustomer?.(activeCustomerObj.id)}
                    className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-center flex items-center justify-center space-x-1 hover:bg-slate-800 transition-colors"
                  >
                    <span>跳转至该客户管理档案</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Lists of regions and match summary lists */
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
                id="map-region-list-container"
              >
                {/* 1. Regional Heat mapping bar breakdown */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">
                    全国大区业务热度监控 (Market Heat)
                  </span>

                  <div className="space-y-3">
                    {regionalBreakdown.map((r, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${r.color}`} />
                            {r.name} 
                            <span className="text-[9px] text-slate-400 font-normal ml-1.5">({r.hub})</span>
                          </span>
                          <span className="font-bold text-slate-800">{r.count} 家客户</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${r.color} transition-all duration-500`}
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Customer lists inside widget */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    点击客户快速在地图上定轨定位：
                  </span>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredCustomers.map((c) => {
                      const metrics = getCustomerMetrics(c.id);
                      const isOverdue = c.nextFollowUp && new Date(c.nextFollowUp) < new Date("2026-07-06");

                      return (
                        <div
                          key={c.id}
                          id={`list-item-map-link-${c.id}`}
                          onClick={() => setSelectedCustId(c.id)}
                          className="p-2 border border-slate-100 rounded-xl hover:border-sky-500 hover:bg-sky-500/[0.02] cursor-pointer transition-all flex items-center justify-between text-[11px]"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                            <h5 className="font-bold text-slate-800 truncate pr-2">{c.name}</h5>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                              <span>{c.industry}</span>
                              {isOverdue && (
                                <span className="text-rose-500 font-semibold text-[9px]">● 回访逾期</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 text-[9px] font-semibold text-slate-500 shrink-0">
                            {metrics.todosCount > 0 && (
                              <span className="bg-rose-50 text-rose-600 px-1 py-0.5 rounded border border-rose-100 leading-none">
                                待办:{metrics.todosCount}
                              </span>
                            )}
                            {metrics.samplesCount > 0 && (
                              <span className="bg-sky-50 text-sky-600 px-1 py-0.5 rounded border border-sky-100 leading-none">
                                送样:{metrics.samplesCount}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredCustomers.length === 0 && (
                      <p className="text-slate-400 text-center text-[10px] py-4">无匹配检索客户</p>
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
