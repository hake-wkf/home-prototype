import React, { useState, useEffect } from 'react';
import {
  FolderHeart,
  Search,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  X,
  Truck,
  PackageCheck,
  Check,
  Edit3,
  FileStack,
  Package,
  Send,
  MoreHorizontal,
  SlidersHorizontal,
  Sparkles,
  AlertTriangle,
  UserCheck,
  User,
  Building2,
  Phone,
  FileEdit,
} from 'lucide-react';
import {
  SavedPlanRecord,
  RenovationProject,
  ShippingTimelineNode,
  UserProfile,
  ShipmentPackage,
} from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';
import { CustomerRecordInfoModal } from './CustomerRecordInfoModal';

interface SavedPlansViewProps {
  savedPlans: SavedPlanRecord[];
  activeProject: RenovationProject;
  currentUser?: UserProfile;
  onUpdateCurrentUser?: (user: UserProfile) => void;
  onLoadPlan: (plan: SavedPlanRecord) => void;
  onDeletePlan: (planId: string) => void;
  onClonePlan: (plan: SavedPlanRecord) => void;
  onUpdatePlan: (plan: SavedPlanRecord) => void;
  onSaveAsTemplate?: (plan: SavedPlanRecord) => void;
  onOpenSaveModal: () => void;
  onGoToDesign: () => void;
  onGoToTemplates: () => void;
}

export type StageKey = 'all' | 'contact_sales' | 'reviewing' | 'shipping' | 'delivered';

export interface StageInfo {
  step: 1 | 2 | 3 | 4;
  key: 'contact_sales' | 'reviewing' | 'shipping' | 'delivered';
  label: '待对接' | '审核中' | '已发货' | '已签收';
  color: 'slate' | 'blue' | 'emerald';
  badgeBg: string;
  badgeText: string;
  dotBg: string;
  activeRing: string;
  desc: string;
}

export const STAGE_STEPS: {
  step: 1 | 2 | 3 | 4;
  key: 'contact_sales' | 'reviewing' | 'shipping' | 'delivered';
  label: '待对接' | '审核中' | '已发货' | '已签收';
  color: 'slate' | 'blue' | 'emerald';
}[] = [
  { step: 1, key: 'contact_sales', label: '待对接', color: 'slate' },
  { step: 2, key: 'reviewing', label: '审核中', color: 'blue' },
  { step: 3, key: 'shipping', label: '已发货', color: 'blue' },
  { step: 4, key: 'delivered', label: '已签收', color: 'emerald' },
];

export const getPlanStage = (plan: SavedPlanRecord): StageInfo => {
  const status = plan.orderStatus || 'contact_sales';

  if (status === 'delivered' || status === 'completed') {
    return {
      step: 4,
      key: 'delivered',
      label: '已签收',
      color: 'emerald',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-700',
      dotBg: 'bg-emerald-500',
      activeRing: 'ring-emerald-200',
      desc: '全部设备已完成当面验货并签收，原厂质保已生效',
    };
  }

  if (status === 'shipping' || status === 'packing') {
    return {
      step: 3,
      key: 'shipping',
      label: '已发货',
      color: 'blue',
      badgeBg: 'bg-blue-50 border-blue-200',
      badgeText: 'text-blue-700',
      dotBg: 'bg-blue-500',
      activeRing: 'ring-blue-200',
      desc: '智能设备中心总仓已扫码出库并交付顺丰速运极速派送',
    };
  }

  if (status === 'reviewing' || status === 'submitted' || status === 'locked') {
    return {
      step: 2,
      key: 'reviewing',
      label: '审核中',
      color: 'blue',
      badgeBg: 'bg-blue-50 border-blue-200',
      badgeText: 'text-blue-700',
      dotBg: 'bg-blue-500',
      activeRing: 'ring-blue-200',
      desc: '专属商务经理正在复核设备点位、工程图纸与原厂直供折扣',
    };
  }

  return {
    step: 1,
    key: 'contact_sales',
    label: '待对接',
    color: 'slate',
    badgeBg: 'bg-slate-100 border-slate-200',
    badgeText: 'text-slate-600',
    dotBg: 'bg-slate-400',
    activeRing: 'ring-slate-200',
    desc: '点击填写收货对接信息并提交专属商务核验报价',
  };
};

// Calculate relative time or format date
const formatRelativeTime = (timeStr?: string): string => {
  if (!timeStr) return '更新于 3 天前';
  try {
    const d = new Date(timeStr.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return `更新于 ${timeStr.slice(0, 10)}`;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return '更新于 今天';
    if (diffDays === 1) return '更新于 1 天前';
    if (diffDays <= 30) return `更新于 ${diffDays} 天前`;
    return `更新于 ${timeStr.slice(0, 10)}`;
  } catch {
    return `更新于 ${timeStr.slice(0, 10)}`;
  }
};

// Extract title & clone tag
const parseTitleAndTag = (rawTitle: string): { cleanTitle: string; isClone: boolean } => {
  let cleanTitle = rawTitle;
  let isClone = false;

  if (cleanTitle.includes('(副本)') || cleanTitle.includes('（副本）') || cleanTitle.includes('[副本]')) {
    cleanTitle = cleanTitle.replace(/[\(（\[]副本[\)）\]]/g, '').trim();
    isClone = true;
  } else if (cleanTitle.includes('副本')) {
    cleanTitle = cleanTitle.replace(/副本/g, '').trim();
    isClone = true;
  }

  return { cleanTitle: cleanTitle || rawTitle, isClone };
};

export const SavedPlansView: React.FC<SavedPlansViewProps> = ({
  savedPlans,
  currentUser = AdminStorageManager.getUserProfile(),
  onUpdateCurrentUser,
  onLoadPlan,
  onDeletePlan,
  onClonePlan,
  onUpdatePlan,
  onSaveAsTemplate,
  onGoToDesign,
}) => {
  const [keyword, setKeyword] = useState('');
  const [selectedStage, setSelectedStage] = useState<StageKey>('all');

  // Customer Info Modal State
  const [isCustomerInfoModalOpen, setIsCustomerInfoModalOpen] = useState(false);
  const [selectedPlanForCustomerInfo, setSelectedPlanForCustomerInfo] = useState<SavedPlanRecord | null>(null);

  // Menu Dropdown Open State (per plan ID)
  const [activeMenuPlanId, setActiveMenuPlanId] = useState<string | null>(null);

  // Edit / Rename Plan Modal State
  const [editingPlan, setEditingPlan] = useState<SavedPlanRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCommunity, setEditCommunity] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Plan Confirmation Modal State
  const [deletingPlan, setDeletingPlan] = useState<SavedPlanRecord | null>(null);

  // Clone Plan with Custom Name Modal State
  const [cloningPlan, setCloningPlan] = useState<SavedPlanRecord | null>(null);
  const [cloneName, setCloneName] = useState('');

  // Step 1: Contact Sales Modal State
  const [contactSalesPlan, setContactSalesPlan] = useState<SavedPlanRecord | null>(null);
  const [contactName, setContactName] = useState('卫科帆');
  const [contactPhone, setContactPhone] = useState('17696180841');
  const [deliveryAddress, setDeliveryAddress] = useState('北京市朝阳区客户指定收货地址');
  const [orderNotes, setOrderNotes] = useState('需确认双轨窗帘盒尺寸，全套设备顺丰保价发货');

  // Progress Details Modal State (当前进度/物流详情)
  const [trackingPlan, setTrackingPlan] = useState<SavedPlanRecord | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCopyText = (text: string, label: string = '单号') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast(`${label}已复制`);
  };

  // Close 3-dots dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuPlanId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter plans based on keyword
  const filteredPlans = savedPlans.filter((plan) => {
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      const match =
        plan.title.toLowerCase().includes(q) ||
        plan.communityName.toLowerCase().includes(q) ||
        (plan.customerName && plan.customerName.toLowerCase().includes(q)) ||
        (plan.customerPhone && plan.customerPhone.includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Open Clone Plan Modal with default name "XXX 副本"
  const handleOpenCloneModal = (plan: SavedPlanRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuPlanId(null);
    setCloningPlan(plan);
    const { cleanTitle } = parseTitleAndTag(plan.title);
    setCloneName(`${cleanTitle} 副本`);
  };

  // Confirm Clone Plan
  const handleConfirmClonePlan = () => {
    if (!cloningPlan || !cloneName.trim()) return;

    const cloned: SavedPlanRecord = {
      ...JSON.parse(JSON.stringify(cloningPlan)),
      id: 'plan_' + Date.now(),
      title: cloneName.trim(),
      createdAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
      updatedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
      orderStatus: 'contact_sales',
      orderStatusLabel: '待对接',
      logisticsInfo: undefined,
    };

    onClonePlan(cloned);
    setCloningPlan(null);
    showToast(`已成功创建方案副本【${cloned.title}】`);
  };

  // Open Edit / Rename Modal
  const handleOpenEditPlan = (plan: SavedPlanRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuPlanId(null);
    setEditingPlan(plan);
    setEditTitle(plan.title);
    setEditCommunity(plan.communityName);
    setEditCost(String(plan.totalCostTenThousand));
    setEditNotes(plan.notes || '');
  };

  const handleSaveEditPlan = () => {
    if (!editingPlan || !editTitle.trim()) return;

    const updated: SavedPlanRecord = {
      ...editingPlan,
      title: editTitle.trim(),
      communityName: editCommunity.trim() || editingPlan.communityName,
      totalCostTenThousand: parseFloat(editCost) || editingPlan.totalCostTenThousand,
      notes: editNotes.trim(),
      updatedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };

    onUpdatePlan(updated);
    setEditingPlan(null);
    showToast('方案信息修改已保存');
  };

  // Save Plan As Template
  const handleSavePlanAsTemplate = (plan: SavedPlanRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSaveAsTemplate) {
      onSaveAsTemplate(plan);
      showToast(`已将方案【${plan.title}】保存为模板`);
    }
  };

  // Click on entire card -> open tracking/details modal or contact sales
  const handleCardClick = (plan: SavedPlanRecord) => {
    const stage = getPlanStage(plan);
    if (stage.step === 1) {
      setContactSalesPlan(plan);
    } else {
      setTrackingPlan(plan);
    }
  };

  // Confirm Contact Sales
  const handleConfirmContactSales = () => {
    if (!contactSalesPlan) return;

    const generatedOrderNo =
      'ORD' +
      new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      Math.floor(100 + Math.random() * 900);
    const nowTime = new Date().toLocaleString('zh-CN', { hour12: false });

    const timelineNodes: ShippingTimelineNode[] = [
      {
        status: 'contact_sales',
        stepNumber: 1,
        title: '1. 待对接 · 提交采购清单',
        description: `客户【${contactName || '智家用户'}】已提交设备采购清单与对接信息`,
        time: nowTime,
        done: true,
      },
      {
        status: 'reviewing',
        stepNumber: 2,
        title: '2. 审核中 · 商务经理核价与清单确认',
        description: '专属商务 王浩 (186-0010-8899) 已受理，正在核验图纸点位与直供折扣',
        time: '正在审核中...',
        done: false,
        active: true,
      },
      {
        status: 'shipping',
        stepNumber: 3,
        title: '3. 已发货 (待出库分配)',
        description: '智能仓储中心扫码配货并交付顺丰速运极速派送',
        time: '待审核完成后出库',
        done: false,
      },
      {
        status: 'delivered',
        stepNumber: 4,
        title: '4. 已签收 · 派送与当面验货交付',
        description: '送达指定地址，当面开箱清点设备、质保生效',
        time: '待发货派送送达',
        done: false,
      },
    ];

    const updatedPlan: SavedPlanRecord = {
      ...contactSalesPlan,
      status: '已确认方案',
      orderStatus: 'reviewing',
      orderStatusLabel: '审核中',
      contactedBusinessAt: nowTime,
      logisticsInfo: {
        orderNumber: generatedOrderNo,
        carrier: '顺丰速运 (待发货分配)',
        trackingNumber: '待出库分配',
        shippingDate: '预计 1-2 工作日出库',
        estimatedArrivalDate: '预计审核后 2-3 天送达',
        recipientName: contactName || '智家用户',
        recipientPhone: contactPhone || '17696180841',
        shippingAddress: deliveryAddress || '北京市朝阳区客户指定收货地址',
        businessManagerName: '王浩 (专属商务对接经理)',
        businessManagerPhone: '186-0010-8899',
        businessManagerWechat: 'zhijia_wanghao',
        notes: orderNotes,
        currentStepIndex: 1,
        timeline: timelineNodes,
      },
    };

    onUpdatePlan(updatedPlan);
    setContactSalesPlan(null);
    showToast('对接需求已提交，方案进入【审核中】');

    setTimeout(() => {
      setTrackingPlan(updatedPlan);
    }, 250);
  };

  // Step 3 -> Step 4: Confirm Delivered (小程序端确认签收)
  const handleConfirmDelivered = (plan: SavedPlanRecord) => {
    const existingLogistics = plan.logisticsInfo;
    const nowTime = new Date().toLocaleString('zh-CN', { hour12: false });
    const orderNo = existingLogistics?.orderNumber || 'ORD20260819001';
    const sfTrackingNo = existingLogistics?.trackingNumber || 'SF138982847294';

    const timelineNodes: ShippingTimelineNode[] = (existingLogistics?.timeline || []).map((node) => ({
      ...node,
      done: true,
      active: false,
    }));

    const deliveredNodeIndex = timelineNodes.findIndex((n) => n.stepNumber === 4);
    if (deliveredNodeIndex >= 0) {
      timelineNodes[deliveredNodeIndex] = {
        status: 'delivered',
        stepNumber: 4,
        title: '4. 已签收 · 客户当面验货并签收完成',
        description: `全部包裹与设备均已送达并由业主【${existingLogistics?.recipientName || '客户'}】本人签收`,
        time: nowTime,
        done: true,
        active: true,
      };
    }

    const updatedPackages = (existingLogistics?.packages || []).map((pkg) => ({
      ...pkg,
      status: 'delivered' as const,
    }));

    const updatedPlan: SavedPlanRecord = {
      ...plan,
      status: '施工中',
      orderStatus: 'delivered',
      orderStatusLabel: '已签收',
      logisticsInfo: {
        orderNumber: orderNo,
        carrier: existingLogistics?.carrier || '顺丰速运',
        trackingNumber: sfTrackingNo,
        trackingNumbers: existingLogistics?.trackingNumbers || [sfTrackingNo],
        packages: updatedPackages.length > 0 ? updatedPackages : undefined,
        totalProgress: 100,
        totalProgressLabel: '总发货进度 100% · 全部发货单已签收',
        shippingDate: existingLogistics?.shippingDate || '2026-08-20 08:30',
        estimatedArrivalDate: existingLogistics?.estimatedArrivalDate || '已送达',
        deliveredDate: nowTime,
        recipientName: existingLogistics?.recipientName || '卫科帆',
        recipientPhone: existingLogistics?.recipientPhone || '17696180841',
        shippingAddress: existingLogistics?.shippingAddress || '北京市朝阳区客户指定收货地址',
        businessManagerName: existingLogistics?.businessManagerName || '王浩 (专属商务经理)',
        businessManagerPhone: existingLogistics?.businessManagerPhone || '186-0010-8899',
        businessManagerWechat: existingLogistics?.businessManagerWechat || 'zhijia_wanghao',
        notes: existingLogistics?.notes || '全部设备已签收完好',
        currentStepIndex: 3,
        timeline: timelineNodes,
      },
    };

    onUpdatePlan(updatedPlan);
    if (trackingPlan?.id === plan.id) {
      setTrackingPlan(updatedPlan);
    }
    showToast('已确认签收！设备顺利交付完成');
  };

  return (
    <div className="space-y-3.5 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7. 搜索框 + 客户信息登记按钮 */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-10 bg-white border border-slate-200 rounded-[20px] px-3.5 flex items-center space-x-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="搜索方案名称、小区或单号..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 客户信息按钮 */}
        <button
          onClick={() => {
            setSelectedPlanForCustomerInfo(null);
            setIsCustomerInfoModalOpen(true);
          }}
          className="h-10 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5 shrink-0"
          title="点击展示和编辑登记客户信息 (小区、联系方式、名称、手输记录)"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>客户信息</span>
        </button>
      </div>



      {/* Plans List */}
      <div className="space-y-3">
        {filteredPlans.length === 0 ? (
          /* 空状态：无方案时显示插画 + 文案"还没有方案记录" + 经典深色主按钮 */
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3.5 shadow-2xs my-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-2xs">
              <FolderHeart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">还没有方案记录</h4>
              <p className="text-xs text-slate-400">
                {keyword ? '未找到符合条件的方案，请尝试其他关键词' : '在工作台完成房间与设备规划后即可保存方案'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-2">
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  清除搜索
                </button>
              )}
              <button
                onClick={onGoToDesign}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>去定制第一套方案</span>
              </button>
            </div>
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const stage = getPlanStage(plan);
            const { cleanTitle, isClone } = parseTitleAndTag(plan.title);
            const isMenuOpen = activeMenuPlanId === plan.id;

            return (
              /* 1. 卡片整体可点击 */
              <div
                key={plan.id}
                onClick={() => handleCardClick(plan)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-sm transition-all space-y-3 cursor-pointer relative"
              >
                {/* Header Row: Title + Clone Tag + Price */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-2 space-y-1">
                    {/* Title (已去掉方案状态与方案标签) */}
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <h3 className="text-xs font-extrabold text-slate-900 truncate max-w-[240px]">
                        {cleanTitle}
                      </h3>
                    </div>

                    {/* Room & Update Time */}
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1.5 truncate">
                      <span>📍 {plan.communityName}</span>
                      <span>·</span>
                      <span>{plan.roomsCount} 空间</span>
                      <span>·</span>
                      <span className="text-slate-400">{formatRelativeTime(plan.updatedAt || plan.createdAt)}</span>
                    </p>
                  </div>

                  {/* Right: Price */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      ¥{plan.totalCostTenThousand}万
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      方案预估
                    </span>
                  </div>
                </div>

                {/* 操作区：同一行展示 导入定制、编辑、客户信息、复制、删除 */}
                <div
                  className="flex items-center justify-between pt-1.5 border-t border-slate-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    {/* 导入定制 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadPlan(plan);
                      }}
                      className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 border border-slate-200/80 shrink-0"
                      title="导入该方案到工作台继续定制"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-slate-700" />
                      <span>导入定制</span>
                    </button>

                    {/* 编辑按钮 */}
                    <button
                      onClick={(e) => handleOpenEditPlan(plan, e)}
                      className="py-1 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
                      title="编辑方案名称与预算"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>编辑</span>
                    </button>

                    {/* 客户信息按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanForCustomerInfo(plan);
                        setIsCustomerInfoModalOpen(true);
                      }}
                      className="py-1 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
                      title="展示与编辑登记客户信息"
                    >
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      <span>客户信息</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* 复制方案 */}
                    <button
                      onClick={(e) => handleOpenCloneModal(plan, e)}
                      className="py-1 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
                      title="复制方案副本"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>复制</span>
                    </button>

                    {/* 删除方案 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingPlan(plan);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="删除此方案"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. 复制方案重命名弹窗 (ClonePlanModal) - 规格统一 */}
      {cloningPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Copy className="w-4 h-4 text-slate-300" />
                <h3 className="font-extrabold text-sm">创建方案副本</h3>
              </div>
              <button
                onClick={() => setCloningPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  副本方案名称
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="例如：万科翡翠公园 3室2厅 副本"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  将完整复制该方案的空间设备点位与配置，生成独立的新记录。
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
              <button
                onClick={() => setCloningPlan(null)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmClonePlan}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / RENAME PLAN MODAL - 规格统一 */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-slate-300" />
                <h3 className="font-extrabold text-sm">编辑方案记录</h3>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  方案名称
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  所属小区 / 户型
                </label>
                <input
                  type="text"
                  value={editCommunity}
                  onChange={(e) => setEditCommunity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  方案预估 (万元)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  需求与备注说明
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none resize-none"
                  placeholder="点位要求或特殊说明..."
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEditPlan}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: CONTACT SALES MODAL (待对接) - 规格统一 */}
      {contactSalesPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 font-bold rounded text-[10px] border border-slate-700">
                    待对接
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">提交商务对接与核价</span>
                </div>
                <h3 className="font-extrabold text-sm mt-0.5 text-white">{contactSalesPlan.title}</h3>
              </div>
              <button
                onClick={() => setContactSalesPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
              {/* Product Breakdown List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-slate-700" />
                    <span>方案产品与设备清单</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    方案预估: <strong className="text-slate-900 font-mono">¥{contactSalesPlan.totalCostTenThousand}万</strong>
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200 max-h-36 overflow-y-auto">
                  <div className="p-2 flex items-center justify-between text-[11px]">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center space-x-1">
                        <span className="px-1 py-0.2 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">弱电核心</span>
                        <span className="font-bold text-slate-900">全屋智能多模中枢网关 Hub</span>
                      </div>
                      <p className="text-[10px] text-slate-400">PoE/有线双频智能主机</p>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">x1</span>
                  </div>

                  <div className="p-2 flex items-center justify-between text-[11px]">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center space-x-1">
                        <span className="px-1 py-0.2 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">全屋照明</span>
                        <span className="font-bold text-slate-900">智能开关面板与调光驱动模块</span>
                      </div>
                      <p className="text-[10px] text-slate-400">零火控制 / 0.1%深调光</p>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">x{contactSalesPlan.roomsCount * 2}</span>
                  </div>

                  <div className="p-2 flex items-center justify-between text-[11px]">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center space-x-1">
                        <span className="px-1 py-0.2 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">窗帘遮阳</span>
                        <span className="font-bold text-slate-900">超静音智能开合帘电机套装</span>
                      </div>
                      <p className="text-[10px] text-slate-400">直流静音电机与定制导轨</p>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">x3</span>
                  </div>
                </div>
              </div>

              {/* Contact Info Form */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <h4 className="font-extrabold text-xs text-slate-900">收货与对接信息</h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">联系人</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">手机号码</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono focus:bg-white focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">收货详细地址</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">对接需求备注 (选填)</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none resize-none focus:bg-white focus:border-slate-900"
                    placeholder="如：双轨窗帘盒尺寸、特定安装时间等..."
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
              <button
                onClick={() => setContactSalesPlan(null)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmContactSales}
                className="flex-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>确认提交商务对接</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PROGRESS / LOGISTICS DETAILS MODAL - 规格统一 + 多发货单展示 + 后台审核 */}
      {trackingPlan && (() => {
        const stage = getPlanStage(trackingPlan);
        const logistics = trackingPlan.logisticsInfo;

        // 统一提取发货单列表：支持 packages 多单或单号兼容
        const packageList: ShipmentPackage[] = logistics?.packages && logistics.packages.length > 0
          ? logistics.packages
          : logistics?.trackingNumber && logistics.trackingNumber !== '待出库分配'
          ? [
              {
                packageId: 'pkg_default',
                trackingNumber: logistics.trackingNumber,
                title: '方案全套智能设备包裹',
                carrier: logistics.carrier || '顺丰速运',
                status: stage.step === 4 ? 'delivered' : 'shipping',
              },
            ]
          : [];

        // 计算发货进度
        const totalProgress = logistics?.totalProgress ?? (stage.step === 4 ? 100 : stage.step === 3 ? 100 : 50);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
            <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
              {/* Header */}
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${stage.badgeBg} ${stage.badgeText}`}>
                      {stage.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">发货进度与单号明细</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white mt-0.5 truncate">{trackingPlan.title}</h3>
                </div>
                <button
                  onClick={() => setTrackingPlan(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Step Progress Bar in Modal */}
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 shrink-0">
                <div className="grid grid-cols-4 gap-1.5">
                  {STAGE_STEPS.map((s) => {
                    const isDone = stage.step >= s.step;
                    const isCurrent = stage.step === s.step;

                    return (
                      <div
                        key={s.step}
                        className={`text-center py-1.5 px-1 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-slate-700 text-white font-bold border-slate-700 shadow-2xs'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] block truncate">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
                {/* 状态 2：审核中 (明确说明后台进行审核，无操作按钮，状态自动同步) */}
                {stage.step === 2 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs">商务经理正在后台审核中</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      您的方案与采购清单已成功提交。后台商务经理正在复核图纸、设备清单并分配出库批次。
                    </p>
                    <div className="text-[11px] text-amber-700 bg-amber-100/60 p-2 rounded-xl flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>审核通过后后台将直接生成发货单出库，小程序将自动同步更新，无需您在此操作。</span>
                    </div>
                  </div>
                )}

                {/* 状态 3 或 4：总发货进度 + 多个发货单号展示 (单个只展示发货单号，总发货进度就行) */}
                {stage.step >= 3 && (
                  <>
                    {/* 总发货进度模块 */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>总发货进度</span>
                        </span>
                        <span className="font-mono font-bold text-blue-600 text-sm">
                          {totalProgress}%
                        </span>
                      </div>

                      {/* 进度条 */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${totalProgress}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>
                          {logistics?.totalProgressLabel || (stage.step === 4 ? '全部发货单已签收' : '全部包裹已出库运输中')}
                        </span>
                        <span className="font-mono text-slate-400">
                          共 {packageList.length} 个发货单
                        </span>
                      </div>
                    </div>

                    {/* 发货单明细列表 (只展示发货单号与复制操作) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-0.5">
                        <span className="flex items-center space-x-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-600" />
                          <span>发货单明细</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">点击单号可直接复制</span>
                      </div>

                      <div className="space-y-2">
                        {packageList.map((pkg, idx) => (
                          <div
                            key={pkg.packageId || idx}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 truncate text-[11px]">
                                  {pkg.title || `发货单 ${idx + 1}`}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                                    pkg.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {pkg.status === 'delivered' ? '已签收' : '运输中'}
                                </span>
                              </div>

                              <div className="text-[11px] font-mono text-slate-600 flex items-center space-x-1.5">
                                <span className="text-slate-400">发货单号:</span>
                                <span className="font-bold text-blue-700 tracking-wider">
                                  {pkg.trackingNumber}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleCopyText(pkg.trackingNumber, '发货单号')}
                              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 flex items-center space-x-1 shrink-0 transition-colors cursor-pointer"
                              title="复制发货单号"
                            >
                              <Copy className="w-3 h-3" />
                              <span>复制</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 收货与商务信息 (简要卡片) */}
                {logistics && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">订单编号</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono font-bold text-slate-800">{logistics.orderNumber}</span>
                        <button
                          onClick={() => handleCopyText(logistics.orderNumber, '订单号')}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">专属商务</span>
                      <span className="font-medium text-slate-800">
                        {logistics.businessManagerName} ({logistics.businessManagerPhone})
                      </span>
                    </div>

                    <div className="flex items-start justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 shrink-0 mr-2">收件地址</span>
                      <span className="text-right text-slate-800 leading-snug">
                        {logistics.recipientName} ({logistics.recipientPhone})<br />
                        {logistics.shippingAddress}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions - 小程序端无审核按钮 */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
                {stage.step === 2 && (
                  <button
                    onClick={() => {
                      if (logistics?.businessManagerPhone) {
                        handleCopyText(logistics.businessManagerPhone, '商务经理电话');
                      }
                      showToast('已复制专属商务经理电话，可随时沟通审核进度');
                    }}
                    className="flex-1 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>联系专属商务</span>
                  </button>
                )}

                {stage.step === 3 && (
                  <button
                    onClick={() => handleConfirmDelivered(trackingPlan)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>确认全部已签收</span>
                  </button>
                )}

                <button
                  onClick={() => setTrackingPlan(null)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. DELETE PLAN CONFIRMATION MODAL - 规格统一 */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h3 className="font-extrabold text-sm">删除方案确认</h3>
              </div>
              <button
                onClick={() => setDeletingPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-rose-900">
                  确定要删除方案【{deletingPlan.title}】吗？
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  删除后方案及其空间选型数据将无法恢复，请谨慎操作。
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
              <button
                onClick={() => setDeletingPlan(null)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDeletePlan(deletingPlan.id);
                  setDeletingPlan(null);
                  showToast('方案已删除');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 客户信息展示与登记弹窗 (CustomerRecordInfoModal) */}
      <CustomerRecordInfoModal
        isOpen={isCustomerInfoModalOpen}
        onClose={() => {
          setIsCustomerInfoModalOpen(false);
          setSelectedPlanForCustomerInfo(null);
        }}
        initialCustomer={
          selectedPlanForCustomerInfo
            ? {
                id: selectedPlanForCustomerInfo.id,
                name: selectedPlanForCustomerInfo.customerName || currentUser?.name || '卫科帆',
                phone: selectedPlanForCustomerInfo.customerPhone || currentUser?.phone || '17696180841',
                community: selectedPlanForCustomerInfo.communityName || currentUser?.communityName || '万科翡翠公园',
                customNotes: selectedPlanForCustomerInfo.customerNotes || currentUser?.customNotes || '',
                auditStatus: currentUser?.auditStatus || 'pending',
                auditFeedback: currentUser?.auditFeedback,
                assignedTo: currentUser?.consultantName,
                avatar: currentUser?.avatar,
                createdAt: selectedPlanForCustomerInfo.createdAt,
                updatedAt: selectedPlanForCustomerInfo.updatedAt,
              }
            : undefined
        }
        planTitle={selectedPlanForCustomerInfo?.title}
        onSaveSuccess={(updatedCustomer) => {
          // If we edited for a specific plan, update the plan's fields too
          if (selectedPlanForCustomerInfo) {
            const updatedPlan: SavedPlanRecord = {
              ...selectedPlanForCustomerInfo,
              customerName: updatedCustomer.name,
              customerPhone: updatedCustomer.phone,
              communityName: updatedCustomer.community || selectedPlanForCustomerInfo.communityName,
              customerNotes: updatedCustomer.customNotes,
              updatedAt: new Date().toISOString(),
            };
            onUpdatePlan(updatedPlan);
          }

          // If current user callback exists, update user profile as well
          if (onUpdateCurrentUser && currentUser) {
            onUpdateCurrentUser({
              ...currentUser,
              name: updatedCustomer.name,
              phone: updatedCustomer.phone,
              communityName: updatedCustomer.community,
              customNotes: updatedCustomer.customNotes,
            });
          }

          showToast('客户信息已同步并保存至后台');
        }}
      />
    </div>
  );
};
