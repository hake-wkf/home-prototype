import React, { useState } from 'react';
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
} from 'lucide-react';
import { Customer, FollowUpRecord, SavedPlanRecord, CustomerCoupon, BalanceAuditRequest } from '../../types';
import { CustomerInfoModal } from './CustomerInfoModal';
import { NewFollowUpModal } from './NewFollowUpModal';
import { AssignModal } from './AssignModal';
import { ChangeBalanceModal } from './ChangeBalanceModal';
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
  const [inspectingPlan, setInspectingPlan] = useState<SavedPlanRecord | null>(null);

  // Filter records for this customer
  const customerFollowUps = followUps.filter((f) => f.customerId === customer.id);

  // Customer's reported plans
  const allSavedPlans = AdminStorageManager.getSavedPlans();
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

  // System coupons for grant
  const availableSystemCoupons = AdminStorageManager.getCoupons();

  const custBalance = typeof customer.balance === 'number' ? customer.balance : 26800;
  const custCoupons = customer.coupons || [];

  const handleConvertToIntent = () => {
    const updated: Customer = {
      ...customer,
      status: '意向客户',
      updatedAt: '08-18 16:30',
    };
    onUpdateCustomer(updated);
    onAddFollowUp({
      id: `fu_${Date.now()}`,
      customerId: customer.id,
      time: '2026-08-18 16:30:00',
      method: '更新客户状态',
      matter: `将客户【${customer.name}】状态变更为【意向客户】`,
      result: '客户已有明确全屋智能方案设计意向',
      type: '日志',
      operator: '卫科帆',
    });
  };

  const handleConvertToLost = () => {
    const updated: Customer = {
      ...customer,
      status: '丢单客户',
      followUpStatus: '丢单',
      updatedAt: '08-18 16:30',
    };
    onUpdateCustomer(updated);
    onAddFollowUp({
      id: `fu_${Date.now()}`,
      customerId: customer.id,
      time: '2026-08-18 16:30:00',
      method: '更新客户状态',
      matter: `将客户【${customer.name}】标记为【丢单客户】`,
      result: '客户暂时取消智能装修计划',
      type: '日志',
      operator: '卫科帆',
    });
  };

  const handleAssignConfirm = (targetSalesperson: string, note: string) => {
    const updated: Customer = {
      ...customer,
      salesperson: targetSalesperson,
      assignedBusiness: targetSalesperson,
      updatedAt: '08-18 16:30',
    };
    onUpdateCustomer(updated);
    onAddFollowUp({
      id: `fu_${Date.now()}`,
      customerId: customer.id,
      time: '2026-08-18 16:30:00',
      method: '指派客户',
      matter: `卫科帆 将项目客户[${customer.projectName}] 指派给 ${targetSalesperson}${note ? ` (${note})` : ''}`,
      result: '-',
      type: '日志',
      operator: '卫科帆',
    });
  };

  const handleGrantCouponSubmit = () => {
    const couponToGrant = availableSystemCoupons.find((c) => c.id === selectedGrantCouponId);
    if (!couponToGrant) return;

    AdminStorageManager.issueCouponToCustomer(couponToGrant, customer.id);
    const updatedCustomer = AdminStorageManager.getCustomers().find((c) => c.id === customer.id);
    if (updatedCustomer) {
      onUpdateCustomer(updatedCustomer);
    }
    setIsGrantCouponOpen(false);
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
          <button
            onClick={() => setIsChangeBalanceOpen(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-700" />
            <span>更改余额</span>
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

      {/* Customer Basic Info Summary Card (FEATURE 8: 展示客户信息) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs text-xs space-y-4">
        {/* Top title and badges */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="font-extrabold text-base text-slate-900">{customer.name}</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-orange-50 text-orange-600 border border-orange-200">
                {customer.status}
              </span>
              <span className="text-slate-400 text-xs">|</span>
              <span className="font-bold text-slate-700 text-sm">{customer.projectName}</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                {customer.deliveryStatus}
              </span>
            </div>
            <div className="flex items-center space-x-6 text-slate-500 text-[11px]">
              <div>创建人: <span className="text-slate-700 font-medium">{customer.creator}</span></div>
              <div>创建时间: <span className="text-slate-700 font-mono">{customer.createdAt}</span></div>
              <div>更新时间: <span className="text-slate-700 font-mono">{customer.updatedAt}</span></div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Balance Preview */}
            <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 block">客户已有余额</span>
              <span className="font-black text-slate-900 font-mono text-sm">
                ¥{custBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Quick Coupons Preview */}
            <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-right">
              <span className="text-[10px] text-rose-500 block">已有优惠卷</span>
              <span className="font-black text-rose-600 font-mono text-sm">
                {custCoupons.length} 张
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid (4 columns) */}
        <div className="grid grid-cols-4 gap-y-3.5 gap-x-6 text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">客户电话:</span>
            <span className="text-slate-900 font-mono font-bold">{customer.phone || '暂无'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">客户小区:</span>
            <span className="text-slate-900 font-bold">{customer.community || customer.projectName || '万科翡翠公园'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">商务经理:</span>
            <span className="text-blue-700 font-bold">{customer.assignedBusiness || customer.assignedTo || '王浩'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">对应运营:</span>
            <span className="text-slate-900 font-bold">{customer.assignedOperations || '赵敏 (运营专员)'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">所属地区:</span>
            <span className="text-slate-900 font-medium">{customer.region || '北京-北京-朝阳'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">详细地址:</span>
            <span className="text-slate-900 truncate block font-medium" title={customer.detailAddress}>
              {customer.detailAddress || '北京顺义区大槐树镇'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">客户来源:</span>
            <span className="text-slate-900 font-medium">{customer.source || '上门用户'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">价格等级:</span>
            <span className="text-slate-900 font-medium">{customer.priceGrade || '普通级别'}</span>
          </div>
        </div>

        {/* Customer Custom Notes */}
        {customer.customNotes && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-bold block mb-1">客户手输记录 / 需求备忘:</span>
            <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
              {customer.customNotes}
            </p>
          </div>
        )}
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
              <span>客户已有余额 (¥{custBalance})</span>
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
              <span>申请更改余额</span>
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
                {customerPlans.map((plan) => (
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

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                      <span className="text-slate-400 font-mono">
                        更新: {plan.updatedAt || plan.createdAt}
                      </span>
                      <button
                        onClick={() => setInspectingPlan(plan)}
                        className="text-blue-600 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>查看配置清单</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: 客户已有余额与财务审核流水 */}
        {activeTab === 'balance' && (
          <div className="p-5 space-y-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block font-medium">客户当前账户已有余额</span>
                <div className="text-2xl font-black font-mono text-white">
                  ¥{custBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-400">
                  支持用于全屋智能方案签约款抵扣或设备货款冲抵
                </p>
              </div>

              <button
                onClick={() => setIsChangeBalanceOpen(true)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>申请更改余额</span>
              </button>
            </div>

            {/* Audit History */}
            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-slate-800 block">
                余额变更与财务审核申请记录:
              </span>

              {customerAuditRequests.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  暂无提交至财务审核的余额更改记录
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerAuditRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">
                            原余额 ¥{req.originalBalance} ➔ 申请更改为 ¥{req.targetBalance}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              req.changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            ({req.changeAmount >= 0 ? '+' : ''}¥{req.changeAmount})
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status === 'approved'
                            ? '财务已审核通过 (已生效)'
                            : req.status === 'rejected'
                            ? '财务已驳回'
                            : '待财务审核中'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700">提交备注: </span>
                        {req.remark}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>提交人: {req.applicant} · {req.submittedAt}</span>
                        {req.financeReviewer && (
                          <span>审核人: {req.financeReviewer} ({req.financeReviewedAt})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      <p>范围: {coupon.applicableScope || '全屋智能方案全品类'}</p>
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
          <div className="p-5">
            {customerFollowUps.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">暂无跟进与日志记录</div>
            ) : (
              <div className="space-y-3">
                {customerFollowUps.map((record) => (
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

      {/* --------------------------------------------------------------------------- */}
      {/* Inspect Plan BOM Modal */}
      {/* --------------------------------------------------------------------------- */}
      {inspectingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">{inspectingPlan.title}</h3>
                <p className="text-[11px] text-slate-400">
                  {inspectingPlan.communityName} · {inspectingPlan.roomsCount} 空间 · 预估 ¥{inspectingPlan.totalCostTenThousand}万
                </p>
              </div>
              <button
                onClick={() => setInspectingPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
              <span className="font-extrabold text-slate-800 block">规划空间及配置:</span>
              <div className="space-y-2">
                {inspectingPlan.project?.rooms?.map((room, rIdx) => (
                  <div key={rIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{room.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        照明回路: {room.scheme?.lighting?.circuitsCount || 2}路
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                      <span>{room.scheme?.enableLighting ? '✅ 智能调光' : '❌ 无调光'}</span>
                      <span>{room.scheme?.enableCurtain ? '✅ 电动窗帘' : '❌ 无窗帘'}</span>
                      <span>{room.scheme?.enableOther ? '✅ 人体传感器' : '❌ 无传感器'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setInspectingPlan(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

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
        customerName={customer.name}
        onConfirm={handleAssignConfirm}
      />
    </div>
  );
};
