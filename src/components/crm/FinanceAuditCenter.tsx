import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Wallet,
  Eye,
  Check,
  X,
  FileText,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Maximize2,
  User,
  Phone,
  Building2,
} from 'lucide-react';
import { BalanceAuditRequest, Customer } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface FinanceAuditCenterProps {
  onShowToast: (msg: string) => void;
  onRefreshData?: () => void;
}

export const FinanceAuditCenter: React.FC<FinanceAuditCenterProps> = ({
  onShowToast,
  onRefreshData,
}) => {
  const [requests, setRequests] = useState<BalanceAuditRequest[]>(() =>
    AdminStorageManager.getBalanceAuditRequests()
  );
  const [activeTab, setActiveTab] = useState<'all' | 'pending_finance' | 'approved' | 'rejected'>(
    'pending_finance'
  );
  const [keyword, setKeyword] = useState('');

  // Selected Action Modal (Approve / Reject)
  const [actionReq, setActionReq] = useState<BalanceAuditRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [financeNote, setFinanceNote] = useState('');
  const [financeReviewer, setFinanceReviewer] = useState('张财务 (财务主管)');

  // Image Zoom Modal
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (activeTab !== 'all' && r.status !== activeTab) {
      return false;
    }
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      const match =
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.remark.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.applicant.toLowerCase().includes(q) ||
        (r.financeReviewer || '').toLowerCase().includes(q) ||
        (r.accountType === 'deposit' ? '合作保证金' : '进货款').includes(q);
      if (!match) return false;
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending_finance').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleOpenAction = (req: BalanceAuditRequest, type: 'approve' | 'reject') => {
    setActionReq(req);
    setActionType(type);
    if (type === 'approve') {
      setFinanceNote('已核验银行对公流水与转账进账回单无误，准予调整入账');
    } else {
      setFinanceNote('款项未到账或凭证单号与银行流水不符，请核实后重提');
    }
  };

  const handleConfirmAction = () => {
    if (!actionReq || !actionType) return;

    if (actionType === 'approve') {
      AdminStorageManager.approveBalanceAudit(
        actionReq.id,
        financeReviewer,
        financeNote.trim()
      );
      onShowToast(`财务已审核通过！客户【${actionReq.customerName}】余额已更新为 ¥${actionReq.targetBalance}`);
    } else {
      AdminStorageManager.rejectBalanceAudit(
        actionReq.id,
        financeReviewer,
        financeNote.trim()
      );
      onShowToast(`已驳回客户【${actionReq.customerName}】余额调整申请`);
    }

    setRequests(AdminStorageManager.getBalanceAuditRequests());
    setActionReq(null);
    setActionType(null);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-white">财务审核中心 (余额变更审核)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            集中审核招商经理与业务提交的客户回款申请。核验原余额、本次回款金额、提交备注及银行付款截图后确认入账。
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-medium">待财务审核</span>
            <span className="text-sm font-black text-amber-400 font-mono">{pendingCount} 笔</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-medium">财务已通过</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{approvedCount} 笔</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { key: 'pending_finance' as const, label: `待审核 (${pendingCount})` },
              { key: 'approved' as const, label: `已通过 (${approvedCount})` },
              { key: 'rejected' as const, label: `已驳回 (${rejectedCount})` },
              { key: 'all' as const, label: `全部申请 (${requests.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
              placeholder="搜索客户姓名、手机号或备注..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">暂无待处理的余额审核申请</h4>
            <p className="text-xs text-slate-400">在「我的客户」对客户余额提交更改后，将在此处由财务审核</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending_finance';
            const isApproved = req.status === 'approved';

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4.5 shadow-2xs space-y-3 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {req.customerName}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.2 rounded border border-slate-200">
                          {req.customerPhone}
                        </span>

                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>待财务审核</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>财务已审核通过 (余额已生效)</span>
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>财务已驳回</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                        <span>提交人: {req.applicant}</span>
                        <span>•</span>
                        <span className="font-mono">提交时间: {req.submittedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Pending */}
                  {isPending && (
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenAction(req, 'approve')}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>财务审核通过</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(req, 'reject')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>驳回</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Balance Comparison & Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Balance Difference Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block">余额变更核算:</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">原余额:</span>
                      <span className="font-mono font-bold text-slate-800">
                        ¥{req.originalBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-bold">本次回款金额:</span>
                      <span className="font-mono font-black text-blue-700 text-sm">
                        ¥{req.targetBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">变动金额:</span>
                      <span
                        className={`font-mono font-bold ${
                          req.changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {req.changeAmount >= 0 ? '+' : ''}¥{req.changeAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Submission Note */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">提交备注说明:</span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium mt-1">
                        {req.remark}
                      </p>
                    </div>

                    {req.financeNote && (
                      <div className="pt-1.5 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700">财务审核意见: </span>
                        <span>{req.financeNote}</span>
                        {req.financeReviewer && (
                          <span className="text-slate-400 block mt-0.5">
                            ({req.financeReviewer} 于 {req.financeReviewedAt})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Proof Screenshot (付款截图) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 block">付款截图凭证:</span>
                      <button
                        onClick={() => setZoomImageUrl(req.paymentProofUrl)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>点击放大查看</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setZoomImageUrl(req.paymentProofUrl)}
                      className="group relative h-20 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 cursor-pointer"
                    >
                      <img
                        src={req.paymentProofUrl}
                        alt="付款截图凭证"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                        <span>点击放大凭证</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Modal (Approve / Reject) */}
      {actionReq && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn select-none">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {actionType === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="font-extrabold text-sm">
                  {actionType === 'approve' ? '确认通过财务审核' : '确认驳回余额申请'}
                </h3>
              </div>
              <button
                onClick={() => setActionReq(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4.5 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{actionReq.customerName}</span>
                  <span className="font-mono text-slate-600 font-bold">{actionReq.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">原余额: ¥{actionReq.originalBalance}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-blue-700 font-bold">回款后余额: ¥{actionReq.targetBalance}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  财务审核人员
                </label>
                <input
                  type="text"
                  value={financeReviewer}
                  onChange={(e) => setFinanceReviewer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  财务核验意见与入账备注
                </label>
                <textarea
                  rows={3}
                  value={financeNote}
                  onChange={(e) => setFinanceNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex space-x-2">
              <button
                onClick={() => setActionReq(null)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-2 py-2 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center space-x-1 ${
                  actionType === 'approve'
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{actionType === 'approve' ? '确认通过并更新余额' : '确认驳回'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Fullscreen Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn cursor-pointer"
          onClick={() => setZoomImageUrl(null)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800">付款凭证原图核验</span>
              <button
                onClick={() => setZoomImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-slate-50 rounded-xl max-h-[75vh] overflow-auto">
              <img
                src={zoomImageUrl}
                alt="付款凭证原图"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
