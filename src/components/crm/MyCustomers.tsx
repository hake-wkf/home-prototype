import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Download,
  ChevronDown,
  UserCheck,
  Calendar,
  Settings,
  XCircle,
  Share2,
  CheckCircle2,
  Wallet,
  Ticket,
  FolderHeart,
  Edit,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Customer, PriceGrade, SavedPlanRecord } from '../../types';
import { NewCustomerModal } from './NewCustomerModal';
import { ChangeBalanceModal } from './ChangeBalanceModal';
import { CustomerSubmittedPlansModal } from './CustomerSubmittedPlansModal';
import { AdminStorageManager } from '../../utils/adminStorage';

interface MyCustomersProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: (customer: Customer) => void;
  onBatchDelete: (selectedIds: string[]) => void;
  onToggleShare: (customerId: string) => void;
  onShowToast?: (msg: string) => void;
  onRefreshData?: () => void;
}

export const MyCustomers: React.FC<MyCustomersProps> = ({
  customers,
  onSelectCustomer,
  onAddCustomer,
  onBatchDelete,
  onToggleShare,
  onShowToast,
  onRefreshData,
}) => {
  // Filters (去掉客户状态、价格等级、交付状态)
  const [keyword, setKeyword] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('全部');

  // Modals & Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Balance Change Modal State
  const [balanceCustomer, setBalanceCustomer] = useState<Customer | null>(null);
  const [submittedPlansCustomer, setSubmittedPlansCustomer] = useState<Customer | null>(null);

  // Saved Plans for matching customer reported records
  const [savedPlans, setSavedPlans] = useState<SavedPlanRecord[]>(() =>
    AdminStorageManager.getSavedPlans()
  );

  // Filter My Customers
  const myCustomerList = customers.filter((c) => {
    // Keyword filter
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      const match =
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.community && c.community.toLowerCase().includes(q)) ||
        c.projectName.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Salesperson filter
    if (salespersonFilter !== '全部' && c.salesperson !== salespersonFilter) {
      return false;
    }

    return true;
  });

  const handleReset = () => {
    setKeyword('');
    setSalespersonFilter('全部');
    setSelectedIds([]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === myCustomerList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(myCustomerList.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      ['序号,客户姓名,客户电话,客户小区,已有余额,已有优惠券数,上报方案数,商务经理,对应运营']
        .concat(
          myCustomerList.map((c, i) => {
            const plans = savedPlans.filter(
              (p) => p.customerPhone === c.phone || p.customerName === c.name
            );
            return `${i + 1},${c.name},${c.phone},${c.community || c.projectName},${c.balance ?? 26800},${(c.coupons || []).length},${plans.length},${c.assignedBusiness || c.assignedTo || '王浩'},${c.assignedOperations || '赵敏'}`;
          })
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `我的客户列表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Keyword Search Input */}
          <div className="w-80 relative">
            <input
              type="text"
              placeholder="请输入客户姓名/手机号码/小区/项目名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 pr-8 text-slate-800 outline-none placeholder:text-slate-400"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown: 请选择业务员 */}
          <div className="w-40">
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-700 outline-none cursor-pointer"
            >
              <option value="全部">全部业务员</option>
              <option value="卫科帆">卫科帆</option>
              <option value="王浩">王浩</option>
              <option value="李伟">李伟</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={() => {}}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>搜索</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Card with Actions */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Header Title & Right Action Buttons */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
          {/* Customer list title and count */}
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-extrabold text-slate-900">我的客户列表</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-mono text-[11px]">
              {myCustomerList.length} 位客户
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增客户</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出</span>
            </button>
          </div>
        </div>

        {/* Data Table (Requirement 8: 展示客户信息; 客户上报方案记录; 客户已有余额; 客户已有优惠卷) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={myCustomerList.length > 0 && selectedIds.length === myCustomerList.length}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-slate-500">序号</th>
                <th className="py-3 px-4 font-bold text-slate-800">客户信息</th>
                <th className="py-3 px-4 font-bold text-slate-800">商务 / 对应运营</th>
                <th className="py-3 px-4 font-bold text-slate-800">客户已有余额</th>
                <th className="py-3 px-4 font-bold text-slate-800">客户已有优惠卷</th>
                <th className="py-3 px-4 font-bold text-slate-800">客户上报方案记录</th>
                <th className="py-3 px-4 text-center w-52">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {myCustomerList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    暂无我的客户数据
                  </td>
                </tr>
              ) : (
                myCustomerList.map((cust, idx) => {
                  const isSelected = selectedIds.includes(cust.id);
                  const custBalance = typeof cust.balance === 'number' ? cust.balance : 26800;
                  const custCoupons = (cust.coupons || []).filter(
                    (cp) => cp.name !== '新客签约全屋智享立减券'
                  );
                  const reportedPlans = savedPlans.filter(
                    (p) =>
                      p.customerPhone === cust.phone ||
                      p.customerName === cust.name ||
                      (cust.name === '卫科帆' && p.customerName === '卫科帆')
                  );

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cust.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{idx + 1}</td>

                      {/* 客户信息 (姓名、电话、小区 - 已去掉客户级别与状态) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm text-slate-900 block">{cust.name}</span>
                          <p className="text-slate-500 font-mono text-[11px]">{cust.phone}</p>
                          <p className="text-slate-400 text-[10px] truncate max-w-[160px]">
                            📍 {cust.community || cust.projectName || '未填小区'}
                          </p>
                        </div>
                      </td>

                      {/* 商务与运营 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-slate-400">商务:</span>
                            <span className="font-bold text-blue-700">
                              {cust.assignedBusiness || cust.assignedTo || '王浩'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-slate-400">运营:</span>
                            <span className="font-medium text-slate-700">
                              {cust.assignedOperations || '赵敏 (运营专员)'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 客户已有余额 (FEATURE 8 - 已去掉表格中更改余额 >) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 font-mono font-extrabold text-slate-900 text-sm">
                          <span className="text-xs text-slate-400 font-normal">¥</span>
                          <span>{custBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </td>

                      {/* 客户已有优惠券 (FEATURE 8 - 已去掉新客签约全屋智享立减券) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="font-bold font-mono text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-xs inline-flex items-center space-x-1">
                            <Ticket className="w-3 h-3" />
                            <span>{custCoupons.length} 张可用券</span>
                          </span>
                          {custCoupons.length > 0 && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                              {custCoupons[0].name}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 客户上报方案记录 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setSubmittedPlansCustomer(cust)}
                          className="group w-full min-w-[150px] rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <FolderHeart className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-mono text-sm">{reportedPlans.length}</span>
                            <span className="text-xs text-slate-500 font-normal">套方案</span>
                            <ArrowRight className="ml-auto h-3.5 w-3.5 text-blue-300 group-hover:text-blue-600" />
                          </div>
                          {reportedPlans.length > 0 ? (
                            <span className="mt-1 block truncate text-[10px] font-semibold text-blue-600">
                              查看完整明细
                            </span>
                          ) : (
                            <span className="mt-1 block text-[10px] text-slate-400">暂无上报记录</span>
                          )}
                        </button>
                      </td>

                      {/* 操作 */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectCustomer(cust)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-slate-800 cursor-pointer"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div>
            共 <span className="font-bold text-slate-800">{myCustomerList.length}</span> 位客户
            {selectedIds.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">已选择 {selectedIds.length} 项</span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>支持在线更新余额并流转至财务部门审核</span>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddCustomer={onAddCustomer}
      />

      {/* Change Balance Modal (FEATURE 9: 更改余额到财务，提交备注和付款截图) */}
      {balanceCustomer && (
        <ChangeBalanceModal
          isOpen={!!balanceCustomer}
          onClose={() => setBalanceCustomer(null)}
          customer={balanceCustomer}
          onSuccess={(msg) => {
            if (onShowToast) onShowToast(msg);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      <CustomerSubmittedPlansModal
        isOpen={!!submittedPlansCustomer}
        customer={submittedPlansCustomer}
        submittedPlans={
          submittedPlansCustomer
            ? savedPlans.filter(
                (plan) =>
                  plan.customerPhone === submittedPlansCustomer.phone ||
                  plan.customerName === submittedPlansCustomer.name
              )
            : []
        }
        onClose={() => setSubmittedPlansCustomer(null)}
        onUpdatePlan={(updated) => {
          setSavedPlans((plans) =>
            plans.map((plan) => (plan.id === updated.id ? updated : plan)),
          );
        }}
      />
    </div>
  );
};
