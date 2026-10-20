import React, { useEffect, useState } from 'react';
import {
  X,
  Wallet,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Customer, BalanceAuditRequest } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface ChangeBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSuccess: (msg: string) => void;
}

export const ChangeBalanceModal: React.FC<ChangeBalanceModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [accountType, setAccountType] = useState<'deposit' | 'purchase'>('purchase');
  const originalBalance =
    accountType === 'deposit'
      ? customer.cooperationDeposit || 0
      : customer.purchaseBalance ?? customer.balance ?? 26800;
  const [targetBalanceInput, setTargetBalanceInput] = useState<string>(
    String(originalBalance + 5000)
  );
  const [remark, setRemark] = useState('');
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
  );
  const [fileName, setFileName] = useState<string>('客户银行转账电子回单.png');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTargetBalanceInput(String(originalBalance + 5000));
  }, [accountType]);

  if (!isOpen) return null;

  const parsedTargetBalance = parseFloat(targetBalanceInput) || 0;
  const changeAmount = parsedTargetBalance - originalBalance;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedScreenshot(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) {
      alert('请填写更改余额的提交备注');
      return;
    }
    if (!uploadedScreenshot) {
      alert('请上传付款截图');
      return;
    }

    setIsSubmitting(true);

    const request: BalanceAuditRequest = {
      id: `bar_${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      originalBalance,
      targetBalance: parsedTargetBalance,
      accountType,
      changeAmount,
      remark: remark.trim(),
      paymentProofUrl: uploadedScreenshot,
      applicant: '卫科帆 (业务/商务人员)',
      submittedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
      status: 'pending_finance',
    };

    AdminStorageManager.submitBalanceAdjustment(request);
    setIsSubmitting(false);
    onSuccess(`客户【${customer.name}】余额更改申请已提交至财务审核！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">客户资金账户设置</h3>
              <p className="text-[11px] text-slate-400">
                提交修改备注与付款截图 · 流转至财务审核后生效
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Customer Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">申请客户</span>
              <span className="text-sm font-extrabold text-slate-900">{customer.name}</span>
              <span className="text-xs text-slate-500 font-mono ml-2 font-medium">{customer.phone}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">客户小区</span>
              <span className="text-xs font-bold text-slate-700">
                {customer.community || customer.projectName || '全屋智能项目'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAccountType('deposit')}
              className={`rounded-xl border p-3 text-left cursor-pointer ${
                accountType === 'deposit'
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span className="text-[10px] font-bold text-amber-700">合作保证金</span>
              <span className="mt-1 block font-mono text-sm font-black text-slate-900">
                ¥{(customer.cooperationDeposit || 0).toLocaleString()}
              </span>
              <span className="mt-1 block text-[9px] text-slate-400">不可参与下单</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('purchase')}
              className={`rounded-xl border p-3 text-left cursor-pointer ${
                accountType === 'purchase'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span className="text-[10px] font-bold text-blue-700">进货款</span>
              <span className="mt-1 block font-mono text-sm font-black text-slate-900">
                ¥{(customer.purchaseBalance ?? customer.balance ?? 0).toLocaleString()}
              </span>
              <span className="mt-1 block text-[9px] text-slate-400">可参与下单抵扣</span>
            </button>
          </div>

          {/* Balance Comparison Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Original Balance (原余额 - 只读) */}
            <div className="p-3 bg-slate-100/90 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">
                原{accountType === 'deposit' ? '保证金' : '进货款'} (不可改)
              </span>
              <div className="text-base font-black text-slate-800 font-mono">
                ¥{originalBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 block">当前系统已存</span>
            </div>

            {/* Target Balance Input (希望更改余额) */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1">
              <label className="text-[11px] font-extrabold text-blue-900 block">
                希望更改金额 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-blue-700 font-bold">¥</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetBalanceInput}
                  onChange={(e) => setTargetBalanceInput(e.target.value)}
                  placeholder="请输入目标余额"
                  className="w-full bg-white border border-blue-300 rounded-xl pl-6 pr-2 py-1 text-sm font-black font-mono text-blue-900 outline-none focus:border-blue-600"
                />
              </div>
              <span className="text-[10px] text-blue-600 block">
                {accountType === 'deposit' ? '财务确认后保证金生效' : '财务确认后进货款生效'}
              </span>
            </div>

            {/* Change Amount (差额) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">变动调整差额</span>
              <div
                className={`text-base font-black font-mono ${
                  changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {changeAmount >= 0 ? `+¥${changeAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : `-¥${Math.abs(changeAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {changeAmount >= 0 ? '增加账户余额' : '扣减账户余额'}
              </span>
            </div>
          </div>

          {/* 更改备注 (必填) */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-800 mb-1.5">
              提交备注说明 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请详细说明更改余额的原因，例如：客户通过对公账户汇入预付工程设备定金 5000 元，流水号为招行 2026082001..."
              className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-800 rounded-xl p-3 text-xs text-slate-900 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 付款截图 (修改余额只有上传付款截图这一种类型 - FEATURE 9) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold text-slate-800">
                上传付款截图 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">支持银行对公回单/微信/支付宝流水凭证截图</span>
            </div>

            {/* Upload Area */}
            <label className="relative border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <div className="flex items-center space-x-2 text-slate-700 group-hover:text-slate-900">
                <Upload className="w-4 h-4 text-slate-500 group-hover:text-slate-800" />
                <span className="text-xs font-bold">点击选择或拖拽上传付款截图</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                支持 PNG, JPG, JPEG 格式，上传后将附随申请进入财务审核
              </p>
            </label>

            {/* Current Proof Preview */}
            {uploadedScreenshot && (
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-center space-x-3.5">
                <img
                  src={uploadedScreenshot}
                  alt="付款截图预览"
                  className="w-16 h-16 rounded-xl object-cover border border-blue-200 shrink-0 shadow-2xs"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold text-slate-900 truncate">
                      {fileName || '付款截图凭证'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">
                      已就绪
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    财务审核中心将直接核验此截图中的付款金额、进账账号与时间戳
                  </p>
                  <label className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer inline-flex items-center space-x-1">
                    <Upload className="w-2.5 h-2.5" />
                    <span>更换其他付款截图</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Alert */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2 text-[11px] text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold">财务审核机制说明:</span>
              <p className="text-amber-800 text-[10px]">
                提交后将进入【财务审核中心】待审核列表，原余额暂时保持不变；待财务专员审核通过后，客户账户余额将正式生效更新。
              </p>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>提交财务审核</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
