import React, { useEffect, useState } from 'react';
import {
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  FolderHeart,
  Layers,
  Package,
  ReceiptText,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { Customer, SavedPlanRecord } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface CustomerSubmittedPlansModalProps {
  isOpen: boolean;
  customer: Customer | null;
  submittedPlans: SavedPlanRecord[];
  initialPlanId?: string | null;
  onClose: () => void;
  onOpenPlan?: (plan: SavedPlanRecord) => void;
  onUpdatePlan?: (plan: SavedPlanRecord) => void;
}

interface PlanEquipmentRow {
  id: string;
  roomName: string;
  brand: string;
  category: string;
  model: string;
  unit: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  isGift?: boolean;
}

const currency = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const getAuditStatus = (plan: SavedPlanRecord) => {
  if (plan.planAuditStatus) return plan.planAuditStatus;
  if (plan.orderStatus === 'shipping' || plan.orderStatus === 'delivered' || plan.orderStatus === 'completed') {
    return 'approved';
  }
  return 'pending';
};

const buildEquipmentRows = (plan: SavedPlanRecord): PlanEquipmentRow[] => {
  const schemes = AdminStorageManager.getLayoutRoomSchemes();
  const presetSchemes = plan.presetId
    ? schemes.filter((scheme) => scheme.layoutPresetId === plan.presetId)
    : [];
  const sourceSchemes = presetSchemes.length > 0 ? presetSchemes : schemes;
  const rooms = plan.project?.rooms || [];
  const rows = new Map<string, PlanEquipmentRow>();

  const addDevice = (
    roomName: string,
    device: {
      id: string;
      brand: string;
      category: string;
      model: string;
      unit: string;
      qty: number;
      unitPrice: number;
    },
  ) => {
    const key = `${roomName}|${device.model}|${device.unitPrice}`;
    const existing = rows.get(key);
    if (existing) {
      existing.qty += device.qty;
      existing.subtotal = existing.qty * existing.unitPrice;
      return;
    }
    rows.set(key, {
      id: `${plan.id}_${key}`,
      roomName,
      brand: device.brand,
      category: device.category,
      model: device.model,
      unit: device.unit,
      qty: device.qty,
      unitPrice: device.unitPrice,
      subtotal: device.qty * device.unitPrice,
    });
  };

  rooms.forEach((room) => {
    const matchedScheme =
      sourceSchemes.find((scheme) => scheme.roomCategory === room.category) ||
      schemes.find((scheme) => scheme.roomCategory === room.category);
    matchedScheme?.devices.forEach((device) => addDevice(room.name, device));
  });

  const weakBoxScheme =
    sourceSchemes.find((scheme) => scheme.roomCategory === 'weak_box') ||
    schemes.find((scheme) => scheme.roomCategory === 'weak_box');
  if (weakBoxScheme && !rooms.some((room) => room.name.includes('弱电'))) {
    weakBoxScheme.devices.forEach((device) => addDevice('弱电箱 / 核心机房', device));
  }

  if (rows.size === 0) {
    AdminStorageManager.getRoomDefaultDevices().forEach((device) => {
      const room =
        rooms.find((item) => item.category === device.roomCategory)?.name || '全屋';
      addDevice(room, device);
    });
  }

  (plan.promotionGifts || []).forEach((gift) => {
    rows.set(`gift_${gift.productId}_${gift.productName}`, {
      id: `${plan.id}_gift_${gift.productId}`,
      roomName: '活动赠品',
      brand: '活动赠品',
      category: '营销活动赠品',
      model: gift.productName,
      unit: '件',
      qty: gift.quantity,
      unitPrice: 0,
      subtotal: 0,
      isGift: true,
    });
  });

  return Array.from(rows.values());
};

const buildTrackingRows = (plan: SavedPlanRecord) => {
  const timeline = plan.logisticsInfo?.timeline || [];
  const submitNode = timeline.find((node) => node.stepNumber === 1);
  const businessAuditNode = timeline.find((node) => node.stepNumber === 2);
  const shippingNode = timeline.find((node) => node.stepNumber === 3);
  const deliveredNode = timeline.find((node) => node.stepNumber === 4);
  const shippingDone = plan.orderStatus === 'shipping' || plan.orderStatus === 'delivered' || plan.orderStatus === 'completed';
  const deliveredDone = plan.orderStatus === 'delivered' || plan.orderStatus === 'completed';
  const trackingNumbers =
    plan.logisticsInfo?.trackingNumbers?.length
      ? plan.logisticsInfo.trackingNumbers
      : plan.logisticsInfo?.trackingNumber && plan.logisticsInfo.trackingNumber !== '待出库分配'
        ? [plan.logisticsInfo.trackingNumber]
        : [];
  return [
    {
      title: '1. 提交招商经理对接',
      time: plan.contactedBusinessAt || submitNode?.time || plan.createdAt,
      description: '客户提交方案、产品清单和收货信息，进入招商经理对接',
      done: Boolean(plan.contactedBusinessAt || submitNode?.done),
    },
    {
      title: '2. 招商经理审核通过',
      time: businessAuditNode?.time || plan.planAuditedAt || '待招商经理审核',
      description: businessAuditNode?.description || plan.planAuditFeedback || '招商经理核验方案、设备清单与报价',
      done: Boolean(businessAuditNode?.done || shippingDone),
    },
    {
      title: '3. ERP审核',
      time: plan.erpAuditedAt || (shippingDone ? plan.logisticsInfo?.shippingDate || shippingNode?.time || '已完成' : '待ERP审核'),
      description: shippingDone ? 'ERP系统审核通过，已生成采购与发货任务' : '招商经理审核通过后进入ERP审核',
      done: shippingDone,
    },
    {
      title: '4. 仓库发货',
      time: shippingNode?.time || plan.logisticsInfo?.shippingDate || '待发货',
      description: trackingNumbers.length
        ? `已发货，发货单号：${trackingNumbers.join('、')}`
        : 'ERP审核通过后由仓库配货并生成物流单号',
      done: shippingDone,
    },
    {
      title: '5. 客户签收',
      time: plan.logisticsInfo?.deliveredDate || deliveredNode?.time || '待签收',
      description: plan.logisticsInfo?.notes || deliveredNode?.description || '客户签收后进入安装联调阶段',
      done: deliveredDone,
    },
  ];
};

export const CustomerSubmittedPlansModal: React.FC<CustomerSubmittedPlansModalProps> = ({
  isOpen,
  customer,
  submittedPlans,
  initialPlanId,
  onClose,
  onOpenPlan,
  onUpdatePlan,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'equipment' | 'tracking'>('equipment');
  const [localPlans, setLocalPlans] = useState<SavedPlanRecord[]>(submittedPlans);

  useEffect(() => {
    if (!isOpen) return;
    setLocalPlans(submittedPlans);
    setSelectedPlanId(
      initialPlanId && submittedPlans.some((plan) => plan.id === initialPlanId)
        ? initialPlanId
        : submittedPlans[0]?.id || null,
    );
    setActiveTab('equipment');
  }, [customer?.id, initialPlanId, isOpen]);

  if (!isOpen || !customer) return null;

  const selectedPlan =
    localPlans.find((plan) => plan.id === selectedPlanId) || localPlans[0] || null;
  const equipmentRows = selectedPlan ? buildEquipmentRows(selectedPlan) : [];
  const equipmentSubtotal = equipmentRows.reduce((sum, item) => sum + item.subtotal, 0);
  const equipmentCount = equipmentRows.reduce((sum, item) => sum + item.qty, 0);
  const planTotalAmount = selectedPlan
    ? selectedPlan.totalCostYuan || selectedPlan.totalCostTenThousand * 10000
    : 0;
  const supplementaryAmount = Math.max(0, planTotalAmount - equipmentSubtotal);
  const equipmentDisplayRows: PlanEquipmentRow[] =
    supplementaryAmount > 0
      ? [
          ...equipmentRows,
          {
            id: `service_${selectedPlan?.id || 'plan'}`,
            roomName: '全屋',
            brand: '工程服务',
            category: '辅材与安装调试',
            model: '全屋智能工程辅材、安装调试与系统联调服务',
            unit: '项',
            qty: 1,
            unitPrice: supplementaryAmount,
            subtotal: supplementaryAmount,
          },
        ]
      : equipmentRows;
  const trackingRows = selectedPlan ? buildTrackingRows(selectedPlan) : [];
  const auditStatus = selectedPlan ? getAuditStatus(selectedPlan) : 'pending';
  const packageNumbers =
    selectedPlan?.logisticsInfo?.packages?.map((pkg) => pkg.trackingNumber).filter(Boolean) || [];
  const shipmentNumbers = packageNumbers.length
    ? packageNumbers
    : selectedPlan?.logisticsInfo?.trackingNumbers ||
      (selectedPlan?.logisticsInfo?.trackingNumber ? [selectedPlan.logisticsInfo.trackingNumber] : []);

  const handlePlanAudit = (approved: boolean) => {
    if (!selectedPlan) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const updated: SavedPlanRecord = {
      ...selectedPlan,
      planAuditStatus: approved ? 'approved' : 'rejected',
      planAuditFeedback: approved
        ? '方案、设备清单与价格审核通过，可进入招商经理报价流程。'
        : '方案信息需调整，请客户修改后重新提交。',
      planAuditReviewer: '卫科帆',
      planAuditedAt: now,
      orderStatus: approved ? 'reviewing' : 'contact_sales',
      orderStatusLabel: approved ? '审核通过，待招商经理报价' : '审核驳回，待客户修改',
      updatedAt: now,
    };
    AdminStorageManager.saveSingleSavedPlan(updated);
    setLocalPlans((plans) => plans.map((plan) => (plan.id === updated.id ? updated : plan)));
    onUpdatePlan?.(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-xs animate-fadeIn">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-slate-900 px-5 py-4 text-white shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <FolderHeart className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">客户上报方案记录</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                {customer.name} · {customer.phone} · {customer.community || customer.projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {localPlans.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 text-center">
            <FolderHeart className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">该客户暂无上报方案</p>
            <p className="mt-1 text-xs text-slate-400">客户提交方案后会在这里显示完整设备与追踪记录</p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[330px_1fr]">
            <aside className="overflow-y-auto border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-600">方案列表</span>
                <span className="text-[10px] font-mono text-slate-400">{localPlans.length} 套</span>
              </div>
              <div className="space-y-2">
                {localPlans.map((plan) => {
                  const status = getAuditStatus(plan);
                  const active = selectedPlan?.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setActiveTab('equipment');
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-blue-300 bg-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-slate-900">{plan.title}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {plan.communityName} · {plan.roomsCount} 空间 · {plan.deviceCount || equipmentCount} 件设备
                          </p>
                        </div>
                        <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-300'}`} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {currency(plan.totalCostTenThousand * 10000)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                            status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : status === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {status === 'approved' ? '审核通过' : status === 'rejected' ? '审核驳回' : '待审核'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden">
              {selectedPlan && (
                <>
                  <div className="border-b border-slate-200 px-4 py-3 shrink-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{selectedPlan.title}</h3>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {selectedPlan.communityName} · {selectedPlan.roomsCount} 个空间 · 提交于 {selectedPlan.createdAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-black text-blue-700">
                          {currency(selectedPlan.totalCostTenThousand * 10000)}
                        </p>
                        <p className="text-[10px] text-slate-400">方案预估总价</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        auditStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : auditStatus === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {auditStatus === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : auditStatus === 'rejected' ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {auditStatus === 'approved' ? '方案已通过' : auditStatus === 'rejected' ? '方案已驳回' : '方案待审核'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                        <Truck className="h-3.5 w-3.5" />
                        {selectedPlan.orderStatusLabel || '待对接'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        <Package className="h-3.5 w-3.5" />
                        {equipmentCount} 件设备
                      </span>
                    </div>
                  </div>

                  <div className="flex border-b border-slate-200 px-4 shrink-0">
                    <button
                      onClick={() => setActiveTab('equipment')}
                      className={`border-b-2 px-3 py-2.5 text-xs font-bold cursor-pointer ${
                        activeTab === 'equipment' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
                      }`}
                    >
                      设备清单与价格
                    </button>
                    <button
                      onClick={() => setActiveTab('tracking')}
                      className={`border-b-2 px-3 py-2.5 text-xs font-bold cursor-pointer ${
                        activeTab === 'tracking' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
                      }`}
                    >
                      完整追踪记录
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {activeTab === 'equipment' ? (
                      <div key="equipment-view" className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] text-slate-400">设备总数量</p>
                            <p className="mt-1 font-mono text-base font-bold text-slate-900">{equipmentCount} 件</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] text-slate-400">设备型号</p>
                            <p className="mt-1 font-mono text-base font-bold text-slate-900">{equipmentRows.length} 种</p>
                          </div>
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-[10px] text-blue-500">方案清单合计</p>
                            <p className="mt-1 font-mono text-base font-bold text-blue-700">{currency(planTotalAmount)}</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table key="equipment-table" className="w-full min-w-[760px] text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                <th className="px-3 py-2.5">空间</th>
                                <th className="px-3 py-2.5">品牌 / 类型</th>
                                <th className="px-3 py-2.5">设备型号</th>
                                <th className="px-3 py-2.5 text-center">数量</th>
                                <th className="px-3 py-2.5 text-right">单价</th>
                                <th className="px-3 py-2.5 text-right">小计</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {equipmentDisplayRows.map((item) => (
                                <tr
                                  key={item.id}
                                  className={item.isGift ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}
                                >
                                  <td className="px-3 py-3 font-semibold text-slate-700">{item.roomName}</td>
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-1">
                                      <p className="font-semibold text-slate-800">{item.brand}</p>
                                      {item.isGift && (
                                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                          赠品
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-slate-400">{item.category}</p>
                                  </td>
                                  <td className="px-3 py-3 leading-relaxed text-slate-700">{item.model}</td>
                                  <td className="px-3 py-3 text-center font-mono text-slate-700">{item.qty}{item.unit}</td>
                                  <td className="px-3 py-3 text-right font-mono text-slate-700">{currency(item.unitPrice)}</td>
                                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">{currency(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t border-slate-200 bg-slate-50">
                              <tr>
                                <td colSpan={5} className="px-3 py-3 text-right font-bold text-slate-600">方案清单合计</td>
                                <td className="px-3 py-3 text-right font-mono text-sm font-black text-blue-700">{currency(planTotalAmount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {selectedPlan.customerNotes && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] font-bold text-slate-500">客户手输记录</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-700">{selectedPlan.customerNotes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div key="tracking-view" className="space-y-3">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">方案完整跟踪记录</span>
                            <span>{selectedPlan.logisticsInfo?.totalProgressLabel || selectedPlan.orderStatusLabel || '待对接'}</span>
                          </div>
                          {selectedPlan.planAuditFeedback && (
                            <p className="mt-1.5 text-[11px] text-blue-700">审核意见：{selectedPlan.planAuditFeedback}</p>
                          )}
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table key="tracking-table" className="w-full min-w-[680px] text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                <th className="px-3 py-2.5">跟踪节点</th>
                                <th className="px-3 py-2.5">状态</th>
                                <th className="px-3 py-2.5">时间</th>
                                <th className="px-3 py-2.5">说明</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {trackingRows.map((node, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                  <td className="px-3 py-3 font-bold text-slate-800">{node.title}</td>
                                  <td className="px-3 py-3">
                                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${
                                      node.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {node.done ? '已完成' : '待处理'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-mono text-[10px] text-slate-500">{node.time}</td>
                                  <td className="px-3 py-3 leading-relaxed text-slate-500">{node.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] text-slate-400">订单编号</p>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-800">{selectedPlan.logisticsInfo?.orderNumber || '待生成'}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] text-slate-400">物流单号</p>
                            <p className="mt-1 font-mono text-xs font-bold leading-relaxed text-slate-800">
                              {shipmentNumbers.length > 0 ? shipmentNumbers.join('、') : '待分配'}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] text-slate-400">收货地址</p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-800">{selectedPlan.logisticsInfo?.shippingAddress || selectedPlan.customerAddress || '待填写'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <ReceiptText className="h-3.5 w-3.5" />
            设备价格来自当前设备库与户型默认配置
          </div>
          <div className="flex items-center gap-2">
            {selectedPlan && auditStatus === 'pending' && (
              <>
                <button
                  onClick={() => handlePlanAudit(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  通过审核
                </button>
                <button
                  onClick={() => handlePlanAudit(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  驳回
                </button>
              </>
            )}
            {selectedPlan && onOpenPlan && (
              <button
                onClick={() => onOpenPlan(selectedPlan)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                导入配置
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
