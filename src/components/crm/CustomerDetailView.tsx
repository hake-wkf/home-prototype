import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Edit,
  UserCheck,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  DollarSign,
  PackageCheck,
  FolderOpen,
  Eye,
  Wallet,
  Ticket,
  FolderHeart,
  Receipt,
  X,
  Send,
  Building2,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Paperclip,
  Gift,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  Customer,
  FollowUpRecord,
  SavedPlanRecord,
  CustomerCoupon,
  BalanceAuditRequest,
  BalanceTransactionRecord,
} from '../../types';
import { CustomerInfoModal } from './CustomerInfoModal';
import { NewFollowUpModal } from './NewFollowUpModal';
import { AssignModal } from './AssignModal';
import { ChangeBalanceModal } from './ChangeBalanceModal';
import { CustomerSubmittedPlansModal } from './CustomerSubmittedPlansModal';
import { AdminStorageManager } from '../../utils/adminStorage';

interface CustomerDetailViewProps {
  customer: Customer;
  followUps: FollowUpRecord[];
  onBack: () => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddFollowUp: (record: FollowUpRecord) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  followUps,
  onBack,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'balance' | 'coupons' | 'followUp'>('plans');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isChangeBalanceOpen, setIsChangeBalanceOpen] = useState(false);
  const [isGrantCouponOpen, setIsGrantCouponOpen] = useState(false);
  const [selectedGrantCouponId, setSelectedGrantCouponId] = useState('');
  const [isSubmittedPlansModalOpen, setIsSubmittedPlansModalOpen] = useState(false);
  const [selectedSubmittedPlanId, setSelectedSubmittedPlanId] = useState<string | null>(null);
  const [balanceKeyword, setBalanceKeyword] = useState('');
  const [balanceTypeFilter, setBalanceTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [followUpKeyword, setFollowUpKeyword] = useState('');
  const [balanceTransactions, setBalanceTransactions] = useState<BalanceTransactionRecord[]>(
    () => AdminStorageManager.getBalanceTransactions(),
  );
  const [allSavedPlans, setAllSavedPlans] = useState<SavedPlanRecord[]>(() =>
    AdminStorageManager.getSavedPlans()
  );

  useEffect(() => {
    const refreshTransactions = () => {
      setBalanceTransactions(AdminStorageManager.getBalanceTransactions());
    };
    window.addEventListener('balance_transactions_updated', refreshTransactions);
    window.addEventListener('customer_balance_updated', refreshTransactions);
    return () => {
      window.removeEventListener('balance_transactions_updated', refreshTransactions);
      window.removeEventListener('customer_balance_updated', refreshTransactions);
    };
  }, []);

  // Filter records for this customer
  const customerFollowUps = followUps.filter((f) => f.customerId === customer.id);
  const filteredCustomerFollowUps = customerFollowUps.filter((record) => {
    if (!followUpKeyword.trim()) return true;
    const query = followUpKeyword.toLowerCase().trim();
    return [
      record.method,
      record.matter,
      record.result,
      record.operator,
      record.time,
      record.contactPerson || '',
      record.contactPhone || '',
    ].some((value) => value.toLowerCase().includes(query));
  });

  // Customer's reported plans
  const customerPlans = allSavedPlans.filter(
    (p) =>
      p.customerPhone === customer.phone ||
      p.customerName === customer.name ||
      (customer.name === '卫科帆' && p.customerName === '卫科帆')
  );

  // Customer's balance audit requests
  const allAuditRequests = AdminStorageManager.getBalanceAuditRequests();
  const customerAuditRequests = allAuditRequests.filter(
    (r) => r.customerId === customer.id || r.customerPhone === customer.phone
  );
  const storedCustomerTransactions = balanceTransactions.filter(
    (transaction) =>
      transaction.customerId === customer.id ||
      transaction.customerPhone === customer.phone,
  );
  const auditDerivedTransactions: BalanceTransactionRecord[] = customerAuditRequests
    .filter((request) => request.status === 'approved')
    .map((request) => ({
      id: `audit_transaction_${request.id}`,
      customerId: request.customerId,
      customerPhone: request.customerPhone,
      title:
        request.accountType === 'deposit'
          ? '合作保证金回款入账'
          : '进货款回款入账',
      note: request.financeNote || request.remark,
      amount: Math.abs(request.changeAmount),
      type: request.changeAmount >= 0 ? 'income' : 'expense',
      accountType: request.accountType === 'deposit' ? 'deposit' : 'purchase',
      time: request.financeReviewedAt || request.submittedAt,
    }));
  const transactionMap = new Map<string, BalanceTransactionRecord>();
  [...auditDerivedTransactions, ...storedCustomerTransactions].forEach((transaction) => {
    const key = `${transaction.type}_${transaction.amount}_${transaction.time.slice(0, 10)}`;
    if (!transactionMap.has(key)) transactionMap.set(key, transaction);
  });
  const customerBalanceTransactions = Array.from(transactionMap.values());
  const filteredBalanceTransactions = customerBalanceTransactions.filter((transaction) => {
    if (balanceTypeFilter !== 'all' && transaction.type !== balanceTypeFilter) return false;
    if (!balanceKeyword.trim()) return true;
    const query = balanceKeyword.toLowerCase().trim();
    return [
      transaction.title,
      transaction.note,
      transaction.time,
      transaction.accountType === 'deposit' ? '合作保证金' : '进货款',
    ].some((value) => value.toLowerCase().includes(query));
  });
  const pendingBalanceRequests = customerAuditRequests.filter(
    (request) => request.status !== 'approved',
  );
  const filteredPendingBalanceRequests = pendingBalanceRequests.filter((request) => {
    const type = request.changeAmount >= 0 ? 'income' : 'expense';
    if (balanceTypeFilter !== 'all' && type !== balanceTypeFilter) return false;
    if (!balanceKeyword.trim()) return true;
    const query = balanceKeyword.toLowerCase().trim();
    return [
      request.remark,
      request.financeNote || '',
      request.submittedAt,
      request.customerName,
      request.customerPhone,
    ].some((value) => value.toLowerCase().includes(query));
  });
  const totalIncome = customerBalanceTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = customerBalanceTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const latestAuditRecord = customerAuditRequests[0];

  // System coupons for grant
  const availableSystemCoupons = AdminStorageManager.getCoupons();

  const custBalance = typeof customer.balance === 'number' ? customer.balance : 26800;
  const custDeposit = customer.cooperationDeposit || 0;
  const custPurchaseBalance = customer.purchaseBalance ?? custBalance;
  const custCoupons = customer.coupons || [];

  const handleAssignConfirm = (business: string, operations: string, note: string) => {
    const updated: Customer = {
      ...customer,
      salesperson: business,
      assignedBusiness: business,
      assignedOperations: operations,
      assignedTo: business,
      updatedAt: '08-18 16:30',
    };
    onUpdateCustomer(updated);
    onAddFollowUp({
      id: `fu_${Date.now()}`,
      customerId: customer.id,
      time: '2026-08-18 16:30:00',
      method: '指派客户',
      matter: `将项目客户[${customer.projectName}] 指派给招商经理【${business}】、运营【${operations}】`,
      result: note || '已完成人员指派',
      type: '日志',
      operator: '卫科帆',
    });
  };

  const handleGrantCouponSubmit = () => {
    const couponToGrant = availableSystemCoupons.find((c) => c.id === selectedGrantCouponId);
    if (!couponToGrant) return;

    AdminStorageManager.issueCouponToCustomer(couponToGrant, customer.id, 'customer-detail');
    const updatedCustomer = AdminStorageManager.getCustomers().find((c) => c.id === customer.id);
    if (updatedCustomer) {
      onUpdateCustomer(updatedCustomer);
    }
    setIsGrantCouponOpen(false);
  };

  const handlePlanAudit = (plan: SavedPlanRecord, approved: boolean) => {
    const actionLabel = approved ? '通过' : '驳回';
    if (!window.confirm(`确定${actionLabel}方案【${plan.title}】吗？`)) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const updatedPlan: SavedPlanRecord = {
      ...plan,
      planAuditStatus: approved ? 'approved' : 'rejected',
      planAuditFeedback: approved
        ? '方案审核通过，可进入招商经理报价与履约流程。'
        : '方案需修改后重新提交审核。',
      planAuditReviewer: '卫科帆',
      planAuditedAt: now,
      orderStatus: approved ? 'reviewing' : 'contact_sales',
      orderStatusLabel: approved ? '审核通过，待招商经理报价' : '审核驳回，待客户修改',
      updatedAt: now,
    };
    AdminStorageManager.saveSingleSavedPlan(updatedPlan);
    setAllSavedPlans(AdminStorageManager.getSavedPlans());
  };

  const handleApproveCustomer = () => {
    if (customer.auditStatus === 'approved') return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16);
    const updated: Customer = {
      ...customer,
      auditStatus: 'approved',
      auditFeedback: '客户资料审核通过，已进入招商经理与运营跟进。',
      auditTime: now,
      auditorName: '卫科帆',
      assignedBusiness: customer.assignedBusiness || customer.assignedTo || customer.salesperson || '王浩',
      assignedOperations: customer.assignedOperations || '赵敏',
      assignedTo: customer.assignedBusiness || customer.assignedTo || customer.salesperson || '王浩',
      updatedAt: now,
    };
    onAddFollowUp({
      id: `fu_approve_${Date.now()}`,
      customerId: customer.id,
      time: now,
      method: '客户审核通过',
      matter: `客户【${customer.name}】资料审核通过`,
      result: '已进入招商经理与运营跟进',
      type: '日志',
      operator: '卫科帆',
    });
    onUpdateCustomer(updated);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Header / Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回我的客户列表</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>客户详情: {customer.name}</span>
            <span className="text-xs font-normal text-slate-400 font-mono">({customer.phone})</span>
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {customer.auditStatus === 'approved' ? (
            <span className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已审核通过
            </span>
          ) : (
            <button
              onClick={handleApproveCustomer}
              className="flex items-center space-x-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>通过审核</span>
            </button>
          )}

          <button
            onClick={() => setIsChangeBalanceOpen(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-700" />
            <span>资金账户设置</span>
          </button>

          <button
            onClick={() => {
              setSelectedGrantCouponId(availableSystemCoupons[0]?.id || '');
              setIsGrantCouponOpen(true);
            }}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5 text-rose-600" />
            <span>发放优惠券</span>
          </button>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>编辑信息</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>指派人员</span>
          </button>

          <button
            onClick={() => onDeleteCustomer(customer.id)}
            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>删除</span>
          </button>
        </div>
      </div>

      {/* Customer Personal Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs shadow-2xs">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900">客户个人信息</h2>
          {customer.auditStatus === 'approved' && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              已审核通过
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-400">客户名称</span>
            <span className="mt-1 block font-bold text-slate-900">{customer.name}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-400">联系方式</span>
            <span className="mt-1 block font-mono font-bold text-slate-900">{customer.phone || '暂无'}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-400">备注信息</span>
            <span className="mt-1 block leading-relaxed text-slate-700">
              {customer.remark || customer.customNotes || '暂无备注'}
            </span>
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-xs font-extrabold text-slate-900">经销商档案</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">合同签约时间</span>
              <span className="mt-1 block font-mono font-bold text-slate-800">
                {customer.contractStartDate || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">合同结束时间</span>
              <span className="mt-1 block font-mono font-bold text-slate-800">
                {customer.contractEndDate || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">经营品牌</span>
              <span className="mt-1 block font-bold text-slate-800">
                {customer.operationBrands || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">年度出货</span>
              <span className="mt-1 block font-bold text-slate-800">
                {customer.annualShipment || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">年销量</span>
              <span className="mt-1 block font-bold text-slate-800">
                {customer.annualSales || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">店面面积</span>
              <span className="mt-1 block font-bold text-slate-800">
                {customer.storeArea || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">公司人员</span>
              <span className="mt-1 block font-bold text-slate-800">
                {customer.companyStaff || '未填写'}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] text-slate-400">业务范围</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {(customer.businessScopes || []).length > 0 ? (
                  customer.businessScopes!.map((scope) => (
                    <span
                      key={scope}
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700"
                    >
                      {scope}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">未填写</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
                <Gift className="h-3.5 w-3.5" />
                赠送内容
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                {customer.giftDescription || '暂无赠送内容'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <Paperclip className="h-3.5 w-3.5" />
                合同附件
              </div>
              {(customer.contractAttachments || []).length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {customer.contractAttachments!.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      {attachment.name}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-400">暂无合同附件</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Tabs: 客户上报方案记录 / 客户已有余额 / 客户已有优惠券 / 跟进记录 */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'plans'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span>客户上报方案记录 ({customerPlans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('balance')}
              className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'balance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>资金账户 (进货款 ¥{custPurchaseBalance})</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'coupons'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>客户已有优惠卷 ({custCoupons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('followUp')}
              className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'followUp'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>跟进与操作日志 ({customerFollowUps.length})</span>
            </button>
          </div>

          {activeTab === 'followUp' && (
            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建跟进</span>
            </button>
          )}

          {activeTab === 'balance' && (
            <button
              onClick={() => setIsChangeBalanceOpen(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>财务设置资金账户</span>
            </button>
          )}

          {activeTab === 'coupons' && (
            <button
              onClick={() => {
                setSelectedGrantCouponId(availableSystemCoupons[0]?.id || '');
                setIsGrantCouponOpen(true);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>向客户发放券</span>
            </button>
          )}
        </div>

        {/* Tab Content 1: 客户上报方案记录 */}
        {activeTab === 'plans' && (
          <div className="p-5 space-y-3">
            {customerPlans.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <FolderHeart className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">该客户尚未在 App 端上报定制方案记录</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {customerPlans.map((plan) => {
                  const auditStatus =
                    plan.planAuditStatus ||
                    (plan.orderStatus === 'shipping' || plan.orderStatus === 'delivered'
                      ? 'approved'
                      : 'pending');
                  return (
                  <div
                    key={plan.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                          {plan.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          📍 {plan.communityName} · {plan.roomsCount} 空间
                        </p>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                            auditStatus === 'approved'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : auditStatus === 'rejected'
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {auditStatus === 'approved'
                            ? '方案已通过'
                            : auditStatus === 'rejected'
                              ? '方案已驳回'
                              : '方案待审核'}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono text-blue-700">
                          ¥{plan.totalCostTenThousand}万
                        </span>
                        <span className="text-[10px] text-slate-400 block">方案估算</span>
                      </div>
                    </div>

                    {plan.notes && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 line-clamp-2">
                        {plan.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      <span className="text-slate-400 font-mono">
                        更新: {plan.updatedAt || plan.createdAt}
                      </span>
                      <div className="flex items-center gap-2">
                        {auditStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePlanAudit(plan, true)}
                              className="rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            >
                              审核通过
                            </button>
                            <button
                              onClick={() => handlePlanAudit(plan, false)}
                              className="rounded-md bg-rose-50 px-2 py-1 font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                            >
                              驳回
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSubmittedPlanId(plan.id);
                            setIsSubmittedPlansModalOpen(true);
                          }}
                          className="text-blue-600 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>查看完整明细</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: 客户已有余额与财务审核流水 */}
        {activeTab === 'balance' && (
          <div className="p-5 space-y-4">
            {/* Balance Cards */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <span className="text-[10px] font-bold text-amber-700">合作保证金</span>
                <div className="mt-1 font-mono text-2xl font-black text-slate-900">
                  ¥{custDeposit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
                <p className="mt-2 text-[10px] text-amber-700">不可参与下单抵扣，仅作为合作履约保证金。</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <span className="text-[10px] font-bold text-blue-700">进货款余额</span>
                <div className="mt-1 font-mono text-2xl font-black text-slate-900">
                  ¥{custPurchaseBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
                <p className="mt-2 text-[10px] text-blue-700">可用于订单货款抵扣，下单时优先使用此账户。</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                  <p className="text-[9px] font-bold text-emerald-600">累计收入</p>
                  <p className="mt-1 font-mono text-base font-black text-emerald-700">
                    +¥{totalIncome.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                  <p className="text-[9px] font-bold text-rose-600">累计支出</p>
                  <p className="mt-1 font-mono text-base font-black text-rose-700">
                    -¥{totalExpense.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <p className="text-[9px] font-bold text-amber-600">待审核申请</p>
                  <p className="mt-1 font-mono text-base font-black text-amber-700">
                    {pendingBalanceRequests.length} 笔
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">收入与支出流水</h4>
                  <p className="mt-0.5 text-[10px] text-slate-400">包含回款入账、方案下单消费等资金记录</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={balanceKeyword}
                      onChange={(event) => setBalanceKeyword(event.target.value)}
                      placeholder="搜索说明、时间、账户..."
                      className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-[10px] outline-none focus:border-blue-400 focus:bg-white"
                    />
                  </div>
                  <div className="flex rounded-lg bg-slate-100 p-1 text-[10px] font-bold">
                    {[
                      { key: 'all' as const, label: '全部' },
                      { key: 'income' as const, label: '收入' },
                      { key: 'expense' as const, label: '支出' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setBalanceTypeFilter(item.key)}
                        className={`rounded-md px-2 py-1 cursor-pointer ${
                          balanceTypeFilter === item.key
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {filteredBalanceTransactions.length === 0 &&
                filteredPendingBalanceRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-[11px] text-slate-400">
                    暂无符合条件的收支记录
                  </div>
                ) : (
                  <>
                  {filteredBalanceTransactions.map((transaction) => {
                    const isIncome = transaction.type === 'income';
                    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                    return (
                      <div
                        key={transaction.id}
                        className={`rounded-xl border p-3 ${
                          isIncome
                            ? 'border-emerald-100 bg-emerald-50/40'
                            : 'border-rose-100 bg-rose-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">
                                {transaction.title}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500">{transaction.note}</p>
                              <p className="mt-1 font-mono text-[9px] text-slate-400">
                                {transaction.time} · {transaction.accountType === 'deposit' ? '合作保证金' : '进货款'}
                              </p>
                            </div>
                          </div>
                          <span className={`shrink-0 font-mono text-sm font-black ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isIncome ? '+' : '-'}¥{transaction.amount.toLocaleString()}
                          </span>
                        </div>

                        {!isIncome && (
                          <div className="mt-2 rounded-lg border border-rose-100 bg-white px-2.5 py-2">
                            <p className="text-[9px] font-bold text-slate-600">最后一次审核记录</p>
                            {latestAuditRecord ? (
                              <div className="mt-1 flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[10px] text-slate-700">
                                    {latestAuditRecord.financeReviewedAt || latestAuditRecord.submittedAt} ·{' '}
                                    {latestAuditRecord.financeNote || latestAuditRecord.remark}
                                  </p>
                                  <a
                                    href={latestAuditRecord.paymentProofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-[9px] font-bold text-blue-600 hover:underline"
                                  >
                                    查看审核凭证图片
                                  </a>
                                </div>
                                <img
                                  src={latestAuditRecord.paymentProofUrl}
                                  alt="最后一次审核凭证"
                                  className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                                />
                              </div>
                            ) : (
                              <p className="mt-1 text-[10px] text-slate-400">系统自动扣款，暂无财务审核凭证</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredPendingBalanceRequests.map((request) => {
                    const isIncome = request.changeAmount >= 0;
                    const isRejected = request.status === 'rejected';
                    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                    return (
                      <div
                        key={request.id}
                        className={`rounded-xl border p-3 ${
                          isRejected
                            ? 'border-rose-200 bg-rose-50/40'
                            : 'border-amber-200 bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isRejected
                                ? 'bg-rose-100 text-rose-600'
                                : isIncome
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-amber-100 text-amber-600'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-800">
                                  {isIncome ? '回款申请' : '资金扣减申请'}
                                </p>
                                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                                  isRejected
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {isRejected ? '已驳回' : '待财务审核'}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[10px] text-slate-600">
                                {request.financeNote || request.remark}
                              </p>
                              <p className="mt-1 font-mono text-[9px] text-slate-400">
                                {request.financeReviewedAt || request.submittedAt} ·{' '}
                                {request.accountType === 'deposit' ? '合作保证金' : '进货款'}
                              </p>
                            </div>
                          </div>
                          <span className={`shrink-0 font-mono text-sm font-black ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isIncome ? '+' : '-'}¥{Math.abs(request.changeAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 flex items-start justify-between gap-2 rounded-lg border border-white bg-white px-2.5 py-2">
                          <div>
                            <p className="text-[9px] font-bold text-slate-600">财务审核凭证</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {request.financeReviewer
                                ? `${request.financeReviewer} · ${request.financeReviewedAt || ''}`
                                : '等待财务审核'}
                            </p>
                            <a
                              href={request.paymentProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-[9px] font-bold text-blue-600 hover:underline"
                            >
                              查看付款截图
                            </a>
                          </div>
                          <img
                            src={request.paymentProofUrl}
                            alt="付款凭证"
                            className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          />
                        </div>
                      </div>
                    );
                  })}
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab Content 3: 客户已有优惠券 */}
        {activeTab === 'coupons' && (
          <div className="p-5 space-y-3.5">
            {custCoupons.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <Ticket className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">该客户账户暂无优惠券</p>
                <button
                  onClick={() => {
                    setSelectedGrantCouponId(availableSystemCoupons[0]?.id || '');
                    setIsGrantCouponOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  立即为客户发放优惠券
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {custCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-3.5 bg-gradient-to-r from-rose-50/70 to-white border border-rose-200 rounded-2xl space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{coupon.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          券码: {coupon.code || 'ZHICPN'}
                        </span>
                      </div>
                      <div className="text-rose-600 font-black font-mono text-base">
                        {coupon.type === 'discount' ? `${coupon.value}折` : `¥${coupon.value}`}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p>门槛: {coupon.minSpend > 0 ? `满 ¥${coupon.minSpend} 可用` : '无门槛使用'}</p>
                      <p className="font-mono text-slate-400">
                        有效期至: {coupon.validEndDate}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-rose-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        可使用
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: 跟进记录 */}
        {activeTab === 'followUp' && (
          <div className="space-y-3 p-5">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={followUpKeyword}
                onChange={(event) => setFollowUpKeyword(event.target.value)}
                placeholder="搜索跟进内容、操作人、时间、联系人..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>
            {filteredCustomerFollowUps.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">暂无跟进与日志记录</div>
            ) : (
              <div className="space-y-3">
                {filteredCustomerFollowUps.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{record.method}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {record.type}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{record.time}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{record.matter}</p>
                    <span className="text-[10px] text-slate-400 block">操作人: {record.operator}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CustomerSubmittedPlansModal
        isOpen={isSubmittedPlansModalOpen}
        customer={customer}
        submittedPlans={customerPlans}
        initialPlanId={selectedSubmittedPlanId}
        onClose={() => setIsSubmittedPlansModalOpen(false)}
        onUpdatePlan={(updated) => {
          setAllSavedPlans((plans) =>
            plans.map((plan) => (plan.id === updated.id ? updated : plan)),
          );
        }}
      />

      {/* Change Balance Modal */}
      {isChangeBalanceOpen && (
        <ChangeBalanceModal
          isOpen={isChangeBalanceOpen}
          onClose={() => setIsChangeBalanceOpen(false)}
          customer={customer}
          onSuccess={() => {
            const updated = AdminStorageManager.getCustomers().find((c) => c.id === customer.id);
            if (updated) onUpdateCustomer(updated);
          }}
        />
      )}

      {/* Grant Coupon to Customer Modal */}
      {isGrantCouponOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4 text-rose-400" />
                <h3 className="font-extrabold text-sm">为客户发放优惠券</h3>
              </div>
              <button
                onClick={() => setIsGrantCouponOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4.5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block">接收客户</span>
                <span className="font-bold text-slate-900">{customer.name} ({customer.phone})</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  选择发放优惠券模板
                </label>
                <select
                  value={selectedGrantCouponId}
                  onChange={(e) => setSelectedGrantCouponId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                >
                  {availableSystemCoupons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'discount' ? `${c.value}折` : `¥${c.value}`} · 门槛{c.minSpend})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex space-x-2">
              <button
                onClick={() => setIsGrantCouponOpen(false)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleGrantCouponSubmit}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                确认发放
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Info Modal for Editing */}
      <CustomerInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        customer={customer}
        onSave={(updated) => {
          onUpdateCustomer(updated);
          setIsInfoModalOpen(false);
        }}
      />

      {/* New Follow Up Modal */}
      <NewFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        onAddFollowUp={(rec) => {
          onAddFollowUp(rec);
          setIsFollowUpModalOpen(false);
        }}
      />

      {/* Assign Modal */}
      <AssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        customers={[customer]}
        onConfirm={handleAssignConfirm}
      />
    </div>
  );
};
