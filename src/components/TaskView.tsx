import React, { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Building2, 
  Calendar, 
  AlertCircle,
  Clock,
  CheckCircle2,
  ListFilter
} from "lucide-react";
import { TodoTask, Customer } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface TaskViewProps {
  todos: TodoTask[];
  customers: Customer[];
  onToggleTodo: (id: string) => void;
  onAddTodo: (todo: TodoTask) => void;
  onDeleteTodo: (id: string) => void;
}

export default function TaskView({ 
  todos, 
  customers, 
  onToggleTodo,
  onAddTodo,
  onDeleteTodo
}: TaskViewProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("high");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredTodos = todos.filter(t => {
    if (filter === "active") return !t.isCompleted;
    if (filter === "completed") return t.isCompleted;
    return true;
  });

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    let customerName = "";
    if (customerId) {
      const c = customers.find(item => item.id === customerId);
      if (c) customerName = c.name;
    }

    onAddTodo({
      id: `todo-${Date.now()}`,
      title,
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      priority,
      dueDate,
      isCompleted: false
    });

    setTitle("");
    setCustomerId("");
    setShowAddForm(false);
  };

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    // High priority first
    const pVal = { high: 3, medium: 2, low: 1 };
    return pVal[b.priority] - pVal[a.priority];
  });

  return (
    <div className="space-y-6" id="task-view-root">
      {/* Filters and Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="task-toolbar">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            全部 ({todos.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "active" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            待处理 ({todos.filter(t => !t.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "completed" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            已完成 ({todos.filter(t => t.isCompleted).length})
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建待办</span>
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100" id="task-list">
        {sortedTodos.map((todo) => (
          <div 
            key={todo.id} 
            id={`task-item-${todo.id}`}
            className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${todo.isCompleted ? "opacity-60" : ""}`}
          >
            <div className="flex items-start space-x-3.5 min-w-0 flex-1">
              {/* Checkbox */}
              <button
                type="button"
                id={`task-check-${todo.id}`}
                onClick={() => onToggleTodo(todo.id)}
                className={`w-5 h-5 rounded-md border shrink-0 transition-colors flex items-center justify-center mt-0.5 ${
                  todo.isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "border-slate-300 hover:border-sky-500 bg-white"
                }`}
              >
                {todo.isCompleted && <span className="text-[10px] font-bold">✓</span>}
              </button>

              <div className="space-y-1 min-w-0 flex-1">
                <p className={`text-xs font-semibold text-slate-800 leading-snug ${todo.isCompleted ? "line-through text-slate-400" : ""}`}>
                  {todo.title}
                </p>
                
                {/* Meta details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[10px] text-slate-400 font-medium">
                  {todo.customerName && (
                    <span className="flex items-center text-slate-500">
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      {todo.customerName}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    截至: {todo.dueDate}
                  </span>
                  {todo.linkedVisitId && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-pink-50 text-pink-500 border border-pink-100">
                      安克录音豆
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Priority tag & Delete button */}
            <div className="flex items-center space-x-3 shrink-0 ml-4">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase leading-none ${
                todo.priority === "high" 
                  ? "bg-rose-50 text-rose-600 border border-rose-100" 
                  : todo.priority === "medium"
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {todo.priority === "high" ? "高" : todo.priority === "medium" ? "中" : "低"}
              </span>

              <button
                onClick={() => onDeleteTodo(todo.id)}
                className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                title="删除待办"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {sortedTodos.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-200" />
            <span>没有找到对应的待处理事项</span>
          </div>
        )}
      </div>

      {/* Add Task Dialog */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="task-add-backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4"
              id="task-add-modal"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">创建销售跟进任务</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateTodo} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">任务标题内容 *</label>
                  <input
                    type="text"
                    required
                    placeholder="如：给小米寄送物性检测样件"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">关联客户 (选填)</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="">未关联特定客户</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">紧急程度 *</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <option value="high">紧急 (高)</option>
                      <option value="medium">一般 (中)</option>
                      <option value="low">普通 (低)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-semibold">要求截止日期 *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 shadow-md"
                  >
                    创建保存
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
