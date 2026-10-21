import React, { useEffect, useState } from 'react';
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
  Pencil,
  Trash2,
  History,
} from 'lucide-react';
import { CustomerCoupon, Customer, CouponIssueRecord } from '../../types';
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
  const [activeTab, setActiveTab] = useState<'coupons' | 'records'>('coupons');
  const [issueRecords, setIssueRecords] = useState<CouponIssueRecord[]>(() =>
    AdminStorageManager.getCouponIssueRecords(),
  );
  const [recordKeyword, setRecordKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'amount' | 'discount' | 'voucher'>('all');

  // Create Coupon Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'amount' | 'discount' | 'voucher'>('amount');
  const [value, setValue] = useState('1000');
  const [minSpend, setMinSpend] = useState('20000');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [code, setCode] = useState('CPN' + Math.floor(1000 + Math.random() * 9000));
  const [description, setDescription] = useState('签约全屋智能方案满额立减，可与特惠折扣叠加');

  // Distribute to specific customer modal
  const [distributeCoupon, setDistributeCoupon] = useState<CustomerCoupon | null>(null);
  const [targetCustomerId, setTargetCustomerId] = useState<string>(customers[0]?.id || '');

  useEffect(() => {
    const refreshRecords = () => {
      setIssueRecords(AdminStorageManager.getCouponIssueRecords());
    };
    window.addEventListener('coupon_issue_records_updated', refreshRecords);
    return () => {
      window.removeEventListener('coupon_issue_records_updated', refreshRecords);
    };
  }, []);

  const filteredCoupons = coupons.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredIssueRecords = issueRecords.filter((record) => {
    if (!recordKeyword.trim()) return true;
    const query = recordKeyword.toLowerCase().trim();
    return [
      record.couponName,
      record.couponCode || '',
      record.customerName,
      record.customerPhone,
      record.operator,
      record.issuedAt,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const resetCouponForm = () => {
    setEditingCouponId(null);
    setName('');
    setType('amount');
    setValue('1000');
    setMinSpend('20000');
    setStartDate('2026-08-01');
    setEndDate('2026-12-31');
    setCode('CPN' + Math.floor(1000 + Math.random() * 9000));
    setDescription('签约全屋智能方案满额立减，可与特惠折扣叠加。');
  };

  const openEditCoupon = (coupon: CustomerCoupon) => {
    setEditingCouponId(coupon.id);
    setName(coupon.name);
    setType(coupon.type);
    setValue(String(coupon.value));
    setMinSpend(String(coupon.minSpend));
    setStartDate(coupon.validStartDate);
    setEndDate(coupon.validEndDate);
    setCode(coupon.code || '');
    setDescription(coupon.description || '');
    setIsCreateModalOpen(true);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const existingCoupon = coupons.find((coupon) => coupon.id === editingCouponId);

    const newCoupon: CustomerCoupon = {
      id: editingCouponId || `cpn_${Date.now()}`,
      name: name.trim(),
      type,
      value: parseFloat(value) || 1000,
      minSpend: type === 'voucher' ? 0 : parseFloat(minSpend) || 0,
      validStartDate: startDate,
      validEndDate: endDate,
      status: 'usable',
      code: code.trim() || 'CPN' + Math.floor(1000 + Math.random() * 9000),
      description: description.trim(),
      createdAt:
        existingCoupon?.createdAt ||
        `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };

    if (editingCouponId) {
      AdminStorageManager.updateCoupon(newCoupon);
      onShowToast(`优惠券【${newCoupon.name}】已更新`);
    } else {
      AdminStorageManager.addCoupon(newCoupon);
      onShowToast(`优惠券【${newCoupon.name}】已成功创建！`);
    }

    setCoupons(AdminStorageManager.getCoupons());
    setIsCreateModalOpen(false);
    resetCouponForm();
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteCoupon = (coupon: CustomerCoupon) => {
    if (!window.confirm(`确定删除优惠券【${coupon.name}】吗？`)) return;
    AdminStorageManager.deleteCoupon(coupon.id);
    setCoupons(AdminStorageManager.getCoupons());
    onShowToast(`优惠券【${coupon.name}】已删除`);
    if (onRefreshData) onRefreshData();
  };

  const handleIssueToCustomer = () => {
    if (!distributeCoupon || !targetCustomerId) return;
    const target = customers.find((c) => c.id === targetCustomerId);
    if (!target) return;

    AdminStorageManager.issueCouponToCustomer(distributeCoupon, targetCustomerId, 'coupon-center');
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
          onClick={() => {
            resetCouponForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>创建优惠券</span>
        </button>
      </div>

      <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
            activeTab === 'coupons' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          优惠券模板 ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
            activeTab === 'records' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          发放记录 ({issueRecords.length})
        </button>
      </div>

      {/* Filter Row */}
      {activeTab === 'coupons' && <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-3">
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
      </div>}

      {/* Coupons Grid List */}
      {activeTab === 'coupons' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

              {/* Dates */}
              <div className="space-y-1 text-[11px] text-slate-500">
                <p className="font-mono text-[10px] text-slate-400">
                  有效期限: {c.validStartDate} ~ {c.validEndDate}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-2">
                <button
                  onClick={() => openEditCoupon(c)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  编辑
                </button>
                <button
                  onClick={() => handleDeleteCoupon(c)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  删除
                </button>
                <button
                  onClick={() => {
                    setDistributeCoupon(c);
                    setTargetCustomerId(customers[0]?.id || '');
                  }}
                  className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-1.5 text-[10px] font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-emerald-400" />
                  <span>发放</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>}

      {activeTab === 'records' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                <History className="h-4 w-4 text-rose-500" />
                优惠券发放记录
              </h3>
              <p className="mt-1 text-[10px] text-slate-400">可按优惠券、客户、手机号、操作人搜索</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={recordKeyword}
                onChange={(event) => setRecordKeyword(event.target.value)}
                placeholder="搜索发放记录..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-400 focus:bg-white"
              />
            </div>
          </div>
          {filteredIssueRecords.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400">
              <History className="mx-auto mb-2 h-9 w-9 text-slate-300" />
              暂无符合条件的发放记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">发放时间</th>
                    <th className="px-4 py-3 font-bold">优惠券</th>
                    <th className="px-4 py-3 font-bold">券码</th>
                    <th className="px-4 py-3 font-bold">领取客户</th>
                    <th className="px-4 py-3 font-bold">操作人</th>
                    <th className="px-4 py-3 font-bold">发放来源</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIssueRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-rose-50/30">
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{record.issuedAt}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{record.couponName}</p>
                        <p className="mt-0.5 text-[9px] text-rose-600">
                          {record.couponType === 'discount' ? `${record.couponValue}折` : `¥${record.couponValue}`}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{record.couponCode || '-'}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{record.customerName}</p>
                        <p className="mt-0.5 font-mono text-[9px] text-slate-400">{record.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.operator}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-700">
                          {record.source === 'customer-detail' ? '客户详情发放' : '优惠券中心发放'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                <h3 className="font-extrabold text-sm">
                  {editingCouponId ? '编辑优惠券' : '创建新优惠券'}
                </h3>
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
                  使用规则与备注
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none leading-relaxed"
                />
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
                  <span>{editingCouponId ? '保存修改' : '确定创建优惠券'}</span>
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
