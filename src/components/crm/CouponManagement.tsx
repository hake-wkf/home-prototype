import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  X,
  Send,
  Users,
  Percent,
  DollarSign,
  Gift,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { CustomerCoupon, Customer } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface CouponManagementProps {
  customers: Customer[];
  onShowToast: (msg: string) => void;
  onRefreshData?: () => void;
}

export const CouponManagement: React.FC<CouponManagementProps> = ({
  customers,
  onShowToast,
  onRefreshData,
}) => {
  const [coupons, setCoupons] = useState<CustomerCoupon[]>(() =>
    AdminStorageManager.getCoupons()
  );
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'amount' | 'discount' | 'voucher'>('all');

  // Create Coupon Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'amount' | 'discount' | 'voucher'>('amount');
  const [value, setValue] = useState('1000');
  const [minSpend, setMinSpend] = useState('20000');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [scope, setScope] = useState('全屋智能方案 / 智能照明 / 窗帘电机与全品类设备');
  const [code, setCode] = useState('CPN' + Math.floor(1000 + Math.random() * 9000));
  const [description, setDescription] = useState('签约全屋智能方案满额立减，可与特惠折扣叠加');

  // Distribute to specific customer modal
  const [distributeCoupon, setDistributeCoupon] = useState<CustomerCoupon | null>(null);
  const [targetCustomerId, setTargetCustomerId] = useState<string>(customers[0]?.id || '');

  const filteredCoupons = coupons.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.applicableScope && c.applicableScope.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCoupon: CustomerCoupon = {
      id: `cpn_${Date.now()}`,
      name: name.trim(),
      type,
      value: parseFloat(value) || 1000,
      minSpend: type === 'voucher' ? 0 : parseFloat(minSpend) || 0,
      validStartDate: startDate,
      validEndDate: endDate,
      status: 'usable',
      applicableScope: scope.trim(),
      code: code.trim() || 'CPN' + Math.floor(1000 + Math.random() * 9000),
      description: description.trim(),
      createdAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };

    AdminStorageManager.addCoupon(newCoupon);
    onShowToast(`优惠券【${newCoupon.name}】已成功创建！`);

    setCoupons(AdminStorageManager.getCoupons());
    setIsCreateModalOpen(false);
    // Reset defaults
    setName('');
    setValue('1000');
    setMinSpend('20000');
    setCode('CPN' + Math.floor(1000 + Math.random() * 9000));
    if (onRefreshData) onRefreshData();
  };

  const handleIssueToCustomer = () => {
    if (!distributeCoupon || !targetCustomerId) return;
    const target = customers.find((c) => c.id === targetCustomerId);
    if (!target) return;

    AdminStorageManager.issueCouponToCustomer(distributeCoupon, targetCustomerId);
    onShowToast(`已向客户【${target.name}】成功发放优惠券【${distributeCoupon.name}】`);
    setDistributeCoupon(null);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-white">优惠券管理与发放中心 (Web端)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            支持在线创建满减券、无门槛抵用券与折扣券，设定使用门槛与有效期，定向发放给指定意向或签约客户。
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>创建优惠券</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {[
              { key: 'all' as const, label: `全部优惠券 (${coupons.length})` },
              { key: 'amount' as const, label: '满减券' },
              { key: 'voucher' as const, label: '抵用代金券' },
              { key: 'discount' as const, label: '折扣券' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索优惠券名称、券码..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Coupons Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCoupons.map((c) => {
          const isDiscount = c.type === 'discount';
          const isVoucher = c.type === 'voucher';

          return (
            <div
              key={c.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    {isDiscount ? (
                      <Percent className="w-5 h-5" />
                    ) : (
                      <DollarSign className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {c.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      券码: {c.code || 'ZHICPN'}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                  {isDiscount ? '折扣券' : isVoucher ? '抵用券' : '满减券'}
                </span>
              </div>

              {/* Value & Threshold */}
              <div className="p-3 bg-gradient-to-r from-rose-50/60 to-amber-50/40 border border-rose-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block">面额优惠</span>
                  <div className="text-rose-600 font-black font-mono">
                    {isDiscount ? (
                      <span className="text-xl">{c.value}折</span>
                    ) : (
                      <>
                        <span className="text-xs font-normal">¥</span>
                        <span className="text-xl">{c.value}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">使用门槛</span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {c.minSpend > 0 ? `满 ¥${c.minSpend} 可用` : '无门槛使用'}
                  </span>
                </div>
              </div>

              {/* Rules & Dates */}
              <div className="space-y-1 text-[11px] text-slate-500">
                <p className="truncate">
                  <span className="text-slate-400">适用: </span>
                  {c.applicableScope || '全屋智能方案全品类'}
                </p>
                <p className="font-mono text-[10px] text-slate-400">
                  有效期限: {c.validStartDate} ~ {c.validEndDate}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center">
                <button
                  onClick={() => {
                    setDistributeCoupon(c);
                    setTargetCustomerId(customers[0]?.id || '');
                  }}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Send className="w-3 h-3 text-emerald-400" />
                  <span>发放给客户</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------------- */}
      {/* Create Coupon Modal (创建优惠券弹窗) */}
      {/* --------------------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold">
                  <Ticket className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm">创建新优惠券</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                  优惠券名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如: 新业主签约专属立减券"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                    优惠券类型
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="amount">满减券 (金额满减)</option>
                    <option value="voucher">无门槛抵用券</option>
                    <option value="discount">折扣券 (百分比折扣)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                    {type === 'discount' ? '折扣力度 (如 8.8折填 8.8)' : '优惠面额 (元)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {type !== 'voucher' && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                    使用门槛金额 (满多少元可用，0为无门槛)
                  </label>
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    placeholder="如: 30000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                    有效起始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                    有效截止日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                  适用范围说明
                </label>
                <input
                  type="text"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                  使用规则与备注
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none leading-relaxed"
                />
              </div>

              </div>

              <div className="pt-2 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>确定创建优惠券</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* Distribute to Single Customer Modal */}
      {/* --------------------------------------------------------------------------- */}
      {distributeCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-sm">发放优惠券至客户</h3>
              </div>
              <button
                onClick={() => setDistributeCoupon(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4.5 space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <span className="text-[10px] text-rose-500 block">待发放优惠券</span>
                <span className="text-sm font-extrabold text-rose-900 block mt-0.5">
                  {distributeCoupon.name}
                </span>
                <span className="text-xs text-rose-700 font-mono font-bold mt-1 block">
                  面值: {distributeCoupon.type === 'discount' ? `${distributeCoupon.value}折` : `¥${distributeCoupon.value}`}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  选择接收客户
                </label>
                <select
                  value={targetCustomerId}
                  onChange={(e) => setTargetCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.community || c.projectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex space-x-2">
              <button
                onClick={() => setDistributeCoupon(null)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleIssueToCustomer}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>确认发放</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
