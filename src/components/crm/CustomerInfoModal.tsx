import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  FileText,
  Gift,
  Phone,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Customer, CustomerAttachment } from '../../types';

interface CustomerInfoModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

const BUSINESS_SCOPES = ['家装', '酒店项目', '办公项目', '地产项目'];

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [remark, setRemark] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [operationBrands, setOperationBrands] = useState('');
  const [annualSales, setAnnualSales] = useState('');
  const [storeArea, setStoreArea] = useState('');
  const [companyStaff, setCompanyStaff] = useState('');
  const [annualShipment, setAnnualShipment] = useState('');
  const [businessScopes, setBusinessScopes] = useState<string[]>([]);
  const [giftDescription, setGiftDescription] = useState('');
  const [contractAttachments, setContractAttachments] = useState<CustomerAttachment[]>([]);

  useEffect(() => {
    if (!isOpen || !customer) return;
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setRemark(customer.remark || customer.customNotes || '');
    setContractStartDate(customer.contractStartDate || '');
    setContractEndDate(customer.contractEndDate || '');
    setOperationBrands(customer.operationBrands || '');
    setAnnualSales(customer.annualSales || '');
    setStoreArea(customer.storeArea || '');
    setCompanyStaff(customer.companyStaff || '');
    setAnnualShipment(customer.annualShipment || '');
    setBusinessScopes(customer.businessScopes || []);
    setGiftDescription(customer.giftDescription || '');
    setContractAttachments(customer.contractAttachments || []);
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = event.target.files ? Array.from(event.target.files) : [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setContractAttachments((items) => [
          ...items,
          {
            id: `attachment_${Date.now()}_${file.name}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            url: String(loadEvent.target?.result || ''),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const toggleBusinessScope = (scope: string) => {
    setBusinessScopes((items) =>
      items.includes(scope) ? items.filter((item) => item !== scope) : [...items, scope],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...customer,
      name: name.trim() || customer.name,
      phone: phone.trim() || customer.phone,
      remark: remark.trim(),
      customNotes: remark.trim(),
      contractStartDate,
      contractEndDate,
      operationBrands: operationBrands.trim(),
      annualSales: annualSales.trim(),
      storeArea: storeArea.trim(),
      companyStaff: companyStaff.trim(),
      annualShipment: annualShipment.trim(),
      businessScopes,
      giftDescription: giftDescription.trim(),
      contractAttachments,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs animate-fadeIn">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">编辑经销商信息</h3>
            <p className="mt-0.5 text-[10px] text-slate-400">基础信息与经销商档案均可编辑</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-5 text-xs">
          <section>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold text-slate-900">
              <User className="h-4 w-4 text-blue-600" />
              基本信息
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="font-bold text-slate-700">经销商名称 <span className="text-rose-500">*</span></span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">手机号 <span className="text-rose-500">*</span></span>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </label>
              <label className="space-y-1 md:col-span-1">
                <span className="font-bold text-slate-700">备注</span>
                <input
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="客户需求、沟通记录或注意事项"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold text-slate-900">
              <Building2 className="h-4 w-4 text-blue-600" />
              经销商档案
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="font-bold text-slate-700">合同签约时间</span>
                <input
                  type="date"
                  value={contractStartDate}
                  onChange={(event) => setContractStartDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">合同结束时间</span>
                <input
                  type="date"
                  value={contractEndDate}
                  onChange={(event) => setContractEndDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">经营品牌</span>
                <input
                  value={operationBrands}
                  onChange={(event) => setOperationBrands(event.target.value)}
                  placeholder="如：翎扬、锐捷、Aqara"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">年销量</span>
                <input
                  value={annualSales}
                  onChange={(event) => setAnnualSales(event.target.value)}
                  placeholder="如：500 万元"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">店面面积</span>
                <input
                  value={storeArea}
                  onChange={(event) => setStoreArea(event.target.value)}
                  placeholder="如：300 ㎡"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">公司人员</span>
                <input
                  value={companyStaff}
                  onChange={(event) => setCompanyStaff(event.target.value)}
                  placeholder="如：20 人"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">年度出货</span>
                <input
                  value={annualShipment}
                  onChange={(event) => setAnnualShipment(event.target.value)}
                  placeholder="如：20 万元"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-3">
              <span className="block font-bold text-slate-700">业务范围</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {BUSINESS_SCOPES.map((scope) => {
                  const selected = businessScopes.includes(scope);
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleBusinessScope(scope)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 font-bold cursor-pointer ${
                        selected
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {scope}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  合同附件
                </span>
                <label className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <Upload className="h-3 w-3" />
                  上传附件
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleAttachmentUpload}
                    className="sr-only"
                  />
                </label>
              </div>
              {contractAttachments.length === 0 ? (
                <p className="py-3 text-center text-[10px] text-slate-400">暂无合同附件</p>
              ) : (
                <div className="space-y-1.5">
                  {contractAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                    >
                      <span className="truncate text-[10px] font-semibold text-slate-700">
                        {attachment.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setContractAttachments((items) =>
                            items.filter((item) => item.id !== attachment.id),
                          )
                        }
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="space-y-1">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <Gift className="h-3.5 w-3.5 text-amber-500" />
                赠送内容
              </span>
              <textarea
                rows={5}
                value={giftDescription}
                onChange={(event) => setGiftDescription(event.target.value)}
                placeholder="填写赠送的代金券、产品、数量等"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 leading-relaxed outline-none focus:border-blue-500"
              />
            </label>
          </section>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700 cursor-pointer"
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
