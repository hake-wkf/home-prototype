import React, { useEffect, useState } from 'react';
import { Check, Phone, User, X } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerInfoModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (!isOpen || !customer) return;
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setRemark(customer.remark || customer.customNotes || '');
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...customer,
      name: name.trim() || customer.name,
      phone: phone.trim() || customer.phone,
      remark: remark.trim(),
      customNotes: remark.trim(),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">编辑客户信息</h3>
            <p className="mt-0.5 text-[10px] text-slate-400">更新客户资料与负责人员</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 text-xs">
          <div>
            <label className="mb-1 block font-bold text-slate-700">
              客户名称 <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-blue-500 focus-within:bg-white">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">
              客户联系方式 <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-blue-500 focus-within:bg-white">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <input
                required
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent font-mono text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">客户备注</label>
            <textarea
              rows={3}
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="填写客户需求、沟通记录或注意事项"
              className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
