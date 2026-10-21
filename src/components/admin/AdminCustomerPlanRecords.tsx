import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  MessageSquare,
  Truck,
  Eye,
  Send,
  User,
  Phone,
  Building2,
  X,
  Clock,
  CheckCircle2,
  Check,
  XCircle,
  Bot,
  FileText,
} from 'lucide-react';
import { SavedPlanRecord, PlanChatMessage, Customer } from '../../types';

type PlanAuditStatus = 'pending' | 'approved' | 'rejected';

const getPlanAuditStatus = (plan: SavedPlanRecord): PlanAuditStatus => {
  if (plan.planAuditStatus) return plan.planAuditStatus;
  if (plan.orderStatus === 'shipping' || plan.orderStatus === 'delivered' || plan.orderStatus === 'completed') {
    return 'approved';
  }
  return 'pending';
};

interface AdminCustomerPlanRecordsProps {
  plans: SavedPlanRecord[];
  customers: Customer[];
  onUpdatePlan: (plan: SavedPlanRecord) => void;
  onDeletePlan?: (planId: string) => void;
  onConvertToTemplate?: (plan: SavedPlanRecord) => void;
  onNavigateToCustomer?: (customerName: string, customerPhone?: string) => void;
}

export const AdminCustomerPlanRecords: React.FC<AdminCustomerPlanRecordsProps> = ({
  plans,
  onUpdatePlan,
}) => {
  // Search strictly by customer phone and community name
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Plan for Modals
  const [activeChatPlan, setActiveChatPlan] = useState<SavedPlanRecord | null>(null);
  const [activeBomPlan, setActiveBomPlan] = useState<SavedPlanRecord | null>(null);
  const [activeLogisticsPlan, setActiveLogisticsPlan] = useState<SavedPlanRecord | null>(null);
  const [auditFilter, setAuditFilter] = useState<'all' | PlanAuditStatus>('all');
  const [auditPlan, setAuditPlan] = useState<SavedPlanRecord | null>(null);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditFeedback, setAuditFeedback] = useState('');

  // New Chat Message Input State (in Chat Drawer)
  const [newChatContent, setNewChatContent] = useState('');

  const stats = useMemo(() => {
    const total = plans.length;
    const pendingAudit = plans.filter((p) => getPlanAuditStatus(p) === 'pending').length;
    return { total, pendingAudit };
  }, [plans]);

  // Filtered plans: strictly 客户手机号; 小区名称搜索 (不存在状态筛选)
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (auditFilter !== 'all' && getPlanAuditStatus(plan) !== auditFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const phoneStr = (plan.customerPhone || '17696180841').toLowerCase();
        const matchPhone = phoneStr.includes(q);
        const matchComm = (plan.communityName || '').toLowerCase().includes(q);
        if (!matchPhone && !matchComm) {
          return false;
        }
      }
      return true;
    });
  }, [auditFilter, plans, searchQuery]);

  const openAuditModal = (plan: SavedPlanRecord, action: 'approve' | 'reject') => {
    setAuditPlan(plan);
    setAuditAction(action);
    setAuditFeedback(
      action === 'approve'
        ? '方案清单、点位与预算已核验通过，可进入招商经理报价与履约流程。'
        : '方案信息需补充，请客户确认后重新提交审核。',
    );
  };

  const handleConfirmAudit = () => {
    if (!auditPlan) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const approved = auditAction === 'approve';
    const timeline = auditPlan.logisticsInfo?.timeline || [
      {
        status: 'contact_sales',
        stepNumber: 1,
        title: '1. 客户提交方案',
        description: '客户已提交方案与设备清单',
        time: auditPlan.createdAt,
        done: true,
      },
    ];
    const hasAuditNode = timeline.some((node) => node.stepNumber === 2);
    const nextTimeline = hasAuditNode
      ? timeline.map((node) =>
          node.stepNumber === 2
            ? {
                ...node,
                title: approved ? '2. 方案审核通过' : '2. 方案审核驳回',
                description: auditFeedback,
                time: now,
                done: true,
                active: false,
              }
            : node,
        )
      : [
          ...timeline,
          {
            status: 'reviewing',
            stepNumber: 2,
            title: approved ? '2. 方案审核通过' : '2. 方案审核驳回',
            description: auditFeedback,
            time: now,
            done: true,
            active: false,
          },
        ];

    onUpdatePlan({
      ...auditPlan,
      planAuditStatus: approved ? 'approved' : 'rejected',
      planAuditFeedback: auditFeedback,
      planAuditReviewer: '卫科帆',
      planAuditedAt: now,
      orderStatus: approved ? 'reviewing' : 'contact_sales',
      orderStatusLabel: approved ? '审核通过，待招商经理报价' : '审核驳回，待客户修改',
      logisticsInfo: auditPlan.logisticsInfo
        ? { ...auditPlan.logisticsInfo, timeline: nextTimeline }
        : auditPlan.logisticsInfo,
    });
    setAuditPlan(null);
  };

  // Send message in chat drawer (no sender role dropdown)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatPlan || !newChatContent.trim()) return;

    const newMsg: PlanChatMessage = {
      id: `chat_msg_${Date.now()}`,
      role: 'assistant',
      senderName: 'AI 方案架构师',
      content: newChatContent.trim(),
      timestamp: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };

    const updatedHistory = [...(activeChatPlan.chatHistory || []), newMsg];
    const updatedPlan: SavedPlanRecord = {
      ...activeChatPlan,
      chatHistory: updatedHistory,
      updatedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };

    onUpdatePlan(updatedPlan);
    setActiveChatPlan(updatedPlan);
    setNewChatContent('');
  };

  return (
    <div className="space-y-4 animate-fadeIn text-slate-800">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FolderKanban className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">所有客户的方案记录</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                {stats.total} 份
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              当前待审核 {stats.pendingAudit} 份，列表默认展示全部方案
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter Toolbar (Explicit Search: 客户手机号 / 小区名称) */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs sm:flex-row">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="按客户手机号、小区名称搜索..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {[
            { key: 'pending' as const, label: `待审核 (${stats.pendingAudit})` },
            { key: 'approved' as const, label: '已通过' },
            { key: 'rejected' as const, label: '已驳回' },
            { key: 'all' as const, label: '全部' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAuditFilter(tab.key)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                auditFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Result Count Badge */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <span>当前 <strong className="font-mono text-xs text-slate-900">{filteredPlans.length}</strong> 份</span>
        </div>
      </div>

      {/* 3. Main Plans Table (Enlarged font structure, spacious padding, comprehensive data) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold select-none text-xs">
                <th className="py-2.5 px-3 w-64">方案信息 / 小区</th>
                <th className="py-2.5 px-3 w-40">所属客户</th>
                <th className="py-2.5 px-3 w-32 text-right">造价预估</th>
                <th className="py-2.5 px-3 w-28">方案审核</th>
                <th className="py-2.5 px-3 w-32">履约进度</th>
                <th className="py-2.5 px-3 w-40 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-base text-slate-600">未找到符合条件的方案记录</p>
                    <p className="text-xs text-slate-400 mt-1">请输入正确的客户手机号或小区名称搜索</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const planAuditStatus = getPlanAuditStatus(plan);

                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setActiveChatPlan(plan)}
                    >
                      {/* 1. Plan Title & Community */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                              {plan.title}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500">
                              <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate">{plan.communityName}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">{plan.cityName || '北京'}</span>
                              <span className="text-slate-400">·</span>
                              <span className="shrink-0 font-mono text-slate-400">{plan.createdAt}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <div className="truncate text-sm font-bold text-slate-900">
                            {plan.customerName || '未登记姓名'}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{plan.customerPhone || '17696180841'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. 造价预估 */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono text-sm">
                          <span className="font-black text-blue-600">
                            {plan.totalCostTenThousand}
                          </span>
                          <span className="ml-1 text-[10px] font-bold text-slate-500">万元</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                          ¥{(plan.totalCostYuan || (plan.totalCostTenThousand || 0) * 10000).toLocaleString()}
                        </div>
                      </td>

                      {/* 5. 方案审核 */}
                      <td className="py-2.5 px-3">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                              planAuditStatus === 'approved'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : planAuditStatus === 'rejected'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}
                          >
                            {planAuditStatus === 'approved' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : planAuditStatus === 'rejected' ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {planAuditStatus === 'approved'
                              ? '审核通过'
                              : planAuditStatus === 'rejected'
                                ? '审核驳回'
                                : '待审核'}
                          </span>
                        </div>
                      </td>

                      {/* 7. 履约与物流进度 (No SF tracking string) */}
                      <td className="py-2.5 px-3" onClick={(e) => { e.stopPropagation(); setActiveLogisticsPlan(plan); }}>
                        <div>
                          {plan.orderStatus === 'delivered' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              <span>已签收验收</span>
                            </span>
                          ) : plan.orderStatus === 'shipping' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Truck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                              <span>已发货</span>
                            </span>
                          ) : plan.orderStatus === 'reviewing' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              <span>招商经理审核中</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>待联系招商经理</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 8. 操作 */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button
                            onClick={() => setActiveChatPlan(plan)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="查看与回复客户对话"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveBomPlan(plan)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="查看BOM清单与空间详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveLogisticsPlan(plan)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="查看物流详情"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                          {planAuditStatus !== 'approved' && (
                            <button
                              onClick={() => openAuditModal(plan, 'approve')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="审核通过"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {planAuditStatus !== 'rejected' && (
                            <button
                              onClick={() => openAuditModal(plan, 'reject')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="审核驳回"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Audit Modal */}
      {auditPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                {auditAction === 'approve' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400" />
                )}
                <div>
                  <h3 className="text-sm font-extrabold">
                    {auditAction === 'approve' ? '审核通过方案' : '驳回方案审核'}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">{auditPlan.title}</p>
                </div>
              </div>
              <button
                onClick={() => setAuditPlan(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <span className="text-[10px] text-slate-400">客户</span>
                  <p className="mt-1 font-bold text-slate-900">{auditPlan.customerName || '未登记客户'}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">{auditPlan.customerPhone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">方案信息</span>
                  <p className="mt-1 font-bold text-slate-900">{auditPlan.communityName}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {auditPlan.roomsCount} 个空间 · {auditPlan.deviceCount} 件设备
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                  审核意见
                </label>
                <textarea
                  rows={4}
                  value={auditFeedback}
                  onChange={(event) => setAuditFeedback(event.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                onClick={() => setAuditPlan(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAudit}
                className={`flex-1 rounded-xl py-2 text-xs font-bold text-white cursor-pointer ${
                  auditAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {auditAction === 'approve' ? '确认通过' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Customer Chat History Drawer (Full conversation viewer & reply) */}
      {activeChatPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base text-white">
                      {activeChatPlan.customerName} 的沟通对话记录
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                      {activeChatPlan.communityName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
                    <span>手机: {activeChatPlan.customerPhone || '17696180841'}</span>
                    <span>·</span>
                    <span>方案预算: {activeChatPlan.totalCostTenThousand} 万元</span>
                    <span>·</span>
                    <span>设备数: {activeChatPlan.deviceCount || 20} 件</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveChatPlan(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Snapshot Strip */}
            <div className="bg-blue-50/80 border-b border-blue-100 px-5 py-3 flex items-center justify-between text-xs text-blue-900 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-sm">方案: {activeChatPlan.title}</span>
                <span className="text-blue-600 font-mono font-bold text-sm">
                  ¥{(activeChatPlan.totalCostYuan || (activeChatPlan.totalCostTenThousand || 0) * 10000).toLocaleString()}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-white text-blue-700 border border-blue-200">
                {activeChatPlan.orderStatus === 'shipping'
                  ? '已发货'
                  : (activeChatPlan.orderStatusLabel || activeChatPlan.status).replace(/\(顺丰单号:[^)]*\)/g, '').trim()}
              </span>
            </div>

            {/* Chat Messages Stream: 用户在右 (User on right), AI在左 (AI on left) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/60">
              {(!activeChatPlan.chatHistory || activeChatPlan.chatHistory.length === 0) ? (
                <div className="py-20 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-2 opacity-50" />
                  <p className="font-bold text-base text-slate-600">该方案暂无客户沟通记录</p>
                  <p className="text-xs text-slate-400 mt-1">您可以在下方输入框输入跟进内容并实时保存</p>
                </div>
              ) : (
                activeChatPlan.chatHistory.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isSystem = msg.role === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-3">
                        <div className="px-3.5 py-1 rounded-full bg-slate-200/90 text-slate-600 text-xs font-medium max-w-lg text-center">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar: User on right (Blue), AI/Advisor on left (Dark/Emerald) */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-white'
                      }`}>
                        {isUser ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      {/* Bubble: User on right, AI on left */}
                      <div className={`max-w-[78%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center space-x-2 text-xs text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                          <span className="font-bold text-slate-600">{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white shadow-xs rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          {/* Scheme Summary Card if present */}
                          {msg.schemeSummary && (
                            <div className={`mt-3 p-3 rounded-xl border text-xs ${
                              isUser
                                ? 'bg-blue-700/60 border-blue-400 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            } space-y-2`}>
                              <div className="flex items-center justify-between font-bold text-sm">
                                <span>智能方案概览</span>
                                <span>造价: {msg.schemeSummary.totalCostTenThousand} 万元</span>
                              </div>
                              <div className={isUser ? 'text-blue-100' : 'text-slate-600'}>
                                配置设备: {msg.schemeSummary.deviceCount} 件
                              </div>
                              {msg.schemeSummary.highlights && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {msg.schemeSummary.highlights.map((h, i) => (
                                    <span key={i} className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                      isUser ? 'bg-blue-800/80 text-blue-100' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar (NO sender identity selector) */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newChatContent}
                  onChange={(e) => setNewChatContent(e.target.value)}
                  placeholder="输入沟通回复内容..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!newChatContent.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>发送</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. BOM Details Modal */}
      {activeBomPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">【{activeBomPlan.title}】方案配置详情</h3>
                  <p className="text-xs text-slate-400">客户: {activeBomPlan.customerName} · 造价 {activeBomPlan.totalCostTenThousand} 万</p>
                </div>
              </div>
              <button onClick={() => setActiveBomPlan(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-slate-700">
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>
                  <div className="text-xs text-slate-400">核算总造价</div>
                  <div className="font-bold text-blue-600 text-base">{activeBomPlan.totalCostTenThousand} 万元</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">规划空间</div>
                  <div className="font-bold text-slate-800 text-base">{activeBomPlan.roomsCount || activeBomPlan.project?.rooms?.length || 4} 个</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">智能硬件</div>
                  <div className="font-bold text-slate-800 text-base">{activeBomPlan.deviceCount || 20} 件</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">空间清单与智能系统</h4>
                <div className="space-y-2">
                  {(activeBomPlan.project?.rooms || []).map((r, i) => (
                    <div key={r.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.name}</span>
                      <span className="text-slate-600 font-mono text-xs">
                        {r.scheme.enableLighting ? `${r.scheme.lighting?.circuitsCount || 2}路灯控` : '无灯控'}
                        {r.scheme.enableCurtain ? ' · 电动窗帘' : ''}
                        {r.scheme.otherRequirements?.thermostatControl ? ' · 温控面板' : ''}
                        {r.scheme.otherRequirements?.smartLock ? ' · 智能门锁' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveBomPlan(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Logistics Timeline Modal */}
      {activeLogisticsPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">完整方案跟踪记录</h3>
                  <p className="text-xs text-slate-400">方案: {activeLogisticsPlan.title}</p>
                </div>
              </div>
              <button onClick={() => setActiveLogisticsPlan(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-slate-700">
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                <div className="font-bold text-blue-900">
                  收件人: {activeLogisticsPlan.customerName} ({activeLogisticsPlan.customerPhone || '17696180841'})
                </div>
                <div className="text-blue-700 text-xs">
                  派送地址: {activeLogisticsPlan.logisticsInfo?.shippingAddress || `${activeLogisticsPlan.cityName} ${activeLogisticsPlan.communityName}`}
                </div>
                <div className="text-blue-600 text-xs font-mono">
                  履约状态: {activeLogisticsPlan.orderStatus === 'shipping' ? '已发货' : (activeLogisticsPlan.orderStatusLabel || activeLogisticsPlan.status).replace(/\(顺丰单号:[^)]*\)/g, '').trim()}
                </div>
                <div className="text-blue-600 text-xs">
                  方案审核: {getPlanAuditStatus(activeLogisticsPlan) === 'approved' ? '已通过' : getPlanAuditStatus(activeLogisticsPlan) === 'rejected' ? '已驳回' : '待审核'}
                  {activeLogisticsPlan.planAuditFeedback ? ` · ${activeLogisticsPlan.planAuditFeedback}` : ''}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">跟踪记录表格</h4>
                  <span className="text-[10px] text-slate-400">共 {(activeLogisticsPlan.logisticsInfo?.timeline || []).length || 4} 个节点</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">节点</th>
                        <th className="px-3 py-2.5 font-bold">状态</th>
                        <th className="px-3 py-2.5 font-bold">时间</th>
                        <th className="px-3 py-2.5 font-bold">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(activeLogisticsPlan.logisticsInfo?.timeline || [
                        { stepNumber: 1, title: '1. 客户提交采购需求', description: '客户已提交完整方案与清单', time: activeLogisticsPlan.createdAt || '已提交', done: true },
                        { stepNumber: 2, title: '2. 方案与招商经理审核', description: activeLogisticsPlan.planAuditFeedback || '后台审核方案、预算和客户信息', time: activeLogisticsPlan.planAuditedAt || '处理中', done: getPlanAuditStatus(activeLogisticsPlan) !== 'pending' },
                        { stepNumber: 3, title: '3. 设备出库发货', description: '仓库配货后交由承运商配送', time: activeLogisticsPlan.logisticsInfo?.shippingDate || '待发货', done: activeLogisticsPlan.orderStatus === 'shipping' || activeLogisticsPlan.orderStatus === 'delivered' },
                        { stepNumber: 4, title: '4. 签收与上门联调', description: '客户验收设备并完成现场调试', time: activeLogisticsPlan.logisticsInfo?.deliveredDate || '待验收', done: activeLogisticsPlan.orderStatus === 'delivered' },
                      ]).map((node, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-bold text-slate-800">{node.title}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${
                              node.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {node.done ? '已完成' : '待处理'}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono text-[10px] text-slate-500">{node.time}</td>
                          <td className="px-3 py-3 leading-relaxed text-slate-500">{node.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveLogisticsPlan(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
