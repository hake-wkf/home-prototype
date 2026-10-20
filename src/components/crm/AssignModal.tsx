import React, { useState } from 'react';
import { UserCheck, X } from 'lucide-react';
import { Customer } from '../../types';

interface AssignModalProps {
  isOpen: boolean;
  customers: Customer[];
  onClose: () => void;
  onConfirm: (business: string, operations: string, note: string) => void;
}

const BUSINESS_OPTIONS = [
  '王浩',
  '李伟',
  '韩梅梅',
  '陈建',
];

const OPERATION_OPTIONS = [
  '赵敏',
  '周运营',
  '孙亮',
  '钱华',
];

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  customers,
  onClose,
  onConfirm,
}) => {
  const [business, setBusiness] = useState('王浩');
  const [operations, setOperations] = useState('赵敏');

  if (!isOpen || customers.length === 0) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onConfirm(business, operations, '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">指派负责人员</h3>
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
            <span className="mb-1 block text-slate-500">待指派客户</span>
            <div className="max-h-24 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">{customer.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{customer.phone}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">负责商务</label>
              <select
                value={business}
                onChange={(event) => setBusiness(event.target.value)}
                className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-blue-500"
              >
                {BUSINESS_OPTIONS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">负责运营</label>
              <select
                value={operations}
                onChange={(event) => setOperations(event.target.value)}
                className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-blue-500"
              >
                {OPERATION_OPTIONS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-1.5 font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-1.5 font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              确认指派
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
