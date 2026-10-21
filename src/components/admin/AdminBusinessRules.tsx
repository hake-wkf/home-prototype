import React, { useState } from 'react';
import {
  BadgePercent,
  CalendarClock,
  Check,
  Gift,
  Plus,
  RefreshCw,
  Save,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { BusinessRuleSettings, Customer, PromotionActivity } from '../../types';

interface AdminBusinessRulesProps {
  customers: Customer[];
  onShowToast: (message: string) => void;
}

const PROMOTION_KEY = 'zhijia_admin_promotions_v1';
const RULE_KEY = 'zhijia_admin_business_rules_v1';

const DEFAULT_PROMOTIONS: PromotionActivity[] = [
  {
    id: 'promo_switch_10',
    name: '翎扬系列开关满赠',
    enabled: true,
    audience: 'all',
    customerIds: [],
    conditionType: 'quantity',
    conditionCategory: '智能面板/开关',
    conditionValue: 10,
    rewardProductId: 'gift_switch_1',
    rewardProductName: '翎扬智能开关（赠品）',
    rewardQuantity: 1,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
  },
  {
    id: 'promo_curtain_3',
    name: '智能窗帘电机满赠',
    enabled: true,
    audience: 'all',
    customerIds: [],
    conditionType: 'quantity',
    conditionCategory: '智能窗帘/电机',
    conditionValue: 3,
    rewardProductId: 'gift_sensor_1',
    rewardProductName: '人体传感器（赠品）',
    rewardQuantity: 1,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
  },
  {
    id: 'promo_amount_30000',
    name: '全屋方案满额赠礼',
    enabled: true,
    audience: 'all',
    customerIds: [],
    conditionType: 'amount',
    conditionCategory: '全屋智能',
    conditionValue: 30000,
    rewardProductId: 'gift_scene_1',
    rewardProductName: '智能场景面板（赠品）',
    rewardQuantity: 1,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
  },
];

const DEFAULT_RULES: BusinessRuleSettings = {
  shippingThreshold: 20000,
  shippingFee: 300,
  externalProductsIncludeFreeShipping: false,
  defaultContractMonths: 12,
  renewalReminderDays: 30,
};

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AdminBusinessRules: React.FC<AdminBusinessRulesProps> = ({
  customers,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'promotion' | 'shipping' | 'renewal'>('promotion');
  const [promotions, setPromotions] = useState<PromotionActivity[]>(() => {
    const stored = readStorage(PROMOTION_KEY, DEFAULT_PROMOTIONS);
    if (stored.length === 1 && stored[0].id === 'promo_switch_10') {
      return [...stored, ...DEFAULT_PROMOTIONS.slice(1)];
    }
    return stored;
  });
  const [rules, setRules] = useState<BusinessRuleSettings>(() =>
    readStorage(RULE_KEY, DEFAULT_RULES),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPromotion, setNewPromotion] = useState<PromotionActivity>({
    id: '',
    name: '',
    enabled: true,
    audience: 'all',
    customerIds: [],
    conditionType: 'quantity',
    conditionCategory: '智能面板/开关',
    conditionValue: 10,
    rewardProductId: 'gift_switch_1',
    rewardProductName: '翎扬智能开关（赠品）',
    rewardQuantity: 1,
    startDate: '2026-10-20',
    endDate: '2026-12-31',
  });

  const persistPromotions = (items: PromotionActivity[]) => {
    setPromotions(items);
    localStorage.setItem(PROMOTION_KEY, JSON.stringify(items));
  };

  const persistRules = () => {
    localStorage.setItem(RULE_KEY, JSON.stringify(rules));
    onShowToast('业务规则已保存');
  };

  const handleCreatePromotion = (event: React.FormEvent) => {
    event.preventDefault();
    const promotion: PromotionActivity = {
      ...newPromotion,
      id: `promo_${Date.now()}`,
      name: newPromotion.name.trim(),
      customerIds: newPromotion.audience === 'all' ? [] : newPromotion.customerIds,
    };
    if (!promotion.name) return;
    persistPromotions([promotion, ...promotions]);
    setIsCreateOpen(false);
    setNewPromotion({
      id: '',
      name: '',
      enabled: true,
      audience: 'all',
      customerIds: [],
      conditionType: 'quantity',
      conditionCategory: '智能面板/开关',
      conditionValue: 10,
      rewardProductId: 'gift_switch_1',
      rewardProductName: '翎扬智能开关（赠品）',
      rewardQuantity: 1,
      startDate: '2026-10-20',
      endDate: '2026-12-31',
    });
    onShowToast('营销活动已创建');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">业务规则中心</h2>
            <p className="mt-1 text-xs text-slate-500">
              配置营销赠品、运费门槛、合同续约提醒与客户适用范围。
            </p>
          </div>
          <button
            onClick={persistRules}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            保存规则
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
        {[
          { key: 'promotion' as const, label: '营销活动', icon: Gift },
          { key: 'shipping' as const, label: '运费规则', icon: Truck },
          { key: 'renewal' as const, label: '续约提醒', icon: CalendarClock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'promotion' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">营销活动列表</h3>
              <p className="mt-1 text-[11px] text-slate-500">满足条件后奖品会自动进入方案奖品栏，无需客户手动领取。</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              新建活动
            </button>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <BadgePercent className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{promotion.name}</h4>
                        <p className="mt-0.5 text-[10px] text-slate-400">{promotion.startDate} ~ {promotion.endDate}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      persistPromotions(
                        promotions.map((item) =>
                          item.id === promotion.id ? { ...item, enabled: !item.enabled } : item,
                        ),
                      )
                    }
                    className={`relative h-5 w-9 rounded-full cursor-pointer ${
                      promotion.enabled ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm ${
                      promotion.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-bold text-slate-800">适用用户：</span>
                    {promotion.audience === 'all'
                      ? '全体用户'
                      : promotion.customerIds
                          .map((id) => customers.find((customer) => customer.id === id)?.name)
                          .filter(Boolean)
                          .join('、') || '指定用户'}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">参与条件：</span>
                    {promotion.conditionType === 'quantity'
                      ? `${promotion.conditionCategory}满 ${promotion.conditionValue} 件`
                      : `订单金额满 ¥${promotion.conditionValue}`}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">赠送奖励：</span>
                    {promotion.rewardProductName} × {promotion.rewardQuantity}，赠品金额 ¥0
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">运费规则</h3>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700">满额包邮门槛（元）</span>
              <input
                type="number"
                value={rules.shippingThreshold}
                onChange={(event) => setRules({ ...rules, shippingThreshold: Number(event.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700">未满门槛运费（元）</span>
              <input
                type="number"
                value={rules.shippingFee}
                onChange={(event) => setRules({ ...rules, shippingFee: Number(event.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span>
                <span className="block font-bold text-slate-700">外协产品参与包邮</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">默认不参与</span>
              </span>
              <input
                type="checkbox"
                checked={rules.externalProductsIncludeFreeShipping}
                onChange={(event) =>
                  setRules({ ...rules, externalProductsIncludeFreeShipping: event.target.checked })
                }
                className="h-4 w-4"
              />
            </label>
          </div>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-800">
            当前规则：自有产品订单满 ¥{rules.shippingThreshold.toLocaleString()} 包邮；未满收取 ¥
            {rules.shippingFee.toLocaleString()}；影音、部分灯具、监控等外协产品不计入包邮金额。
          </div>
        </div>
      )}

      {activeTab === 'renewal' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">经销商续约提醒</h3>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700">默认合同期限（月）</span>
              <input
                type="number"
                value={rules.defaultContractMonths}
                onChange={(event) =>
                  setRules({ ...rules, defaultContractMonths: Number(event.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700">提前提醒天数</span>
              <input
                type="number"
                value={rules.renewalReminderDays}
                onChange={(event) =>
                  setRules({ ...rules, renewalReminderDays: Number(event.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-800">
            经销商录入合同开始时间后，系统自动计算 {rules.defaultContractMonths} 个月合同期，并在到期前
            {rules.renewalReminderDays} 天提醒申请续约。
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold">新建营销活动</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="cursor-pointer text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePromotion} className="max-h-[75vh] space-y-4 overflow-y-auto p-5 text-xs">
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-700">活动名称</span>
                <input
                  required
                  value={newPromotion.name}
                  onChange={(event) => setNewPromotion({ ...newPromotion, name: event.target.value })}
                  placeholder="例如：翎扬系列开关满赠"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">参与用户</span>
                  <select
                    value={newPromotion.audience}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        audience: event.target.value as 'all' | 'specified',
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="all">全体用户</option>
                    <option value="specified">指定用户</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">条件类型</span>
                  <select
                    value={newPromotion.conditionType}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        conditionType: event.target.value as 'quantity' | 'amount',
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="quantity">按商品数量</option>
                    <option value="amount">按订单金额</option>
                  </select>
                </label>
              </div>

              {newPromotion.audience === 'specified' && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 font-bold text-slate-700">
                    <Users className="h-3.5 w-3.5" /> 指定参与客户
                  </div>
                  <div className="grid max-h-32 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                    {customers.map((customer) => (
                      <label key={customer.id} className="flex items-center gap-2 text-[11px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={newPromotion.customerIds.includes(customer.id)}
                          onChange={(event) =>
                            setNewPromotion({
                              ...newPromotion,
                              customerIds: event.target.checked
                                ? [...newPromotion.customerIds, customer.id]
                                : newPromotion.customerIds.filter((id) => id !== customer.id),
                            })
                          }
                        />
                        {customer.name} · {customer.phone}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">条件商品类型</span>
                  <select
                    value={newPromotion.conditionCategory}
                    onChange={(event) =>
                      setNewPromotion({ ...newPromotion, conditionCategory: event.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option>智能面板/开关</option>
                    <option>智能窗帘/电机</option>
                    <option>智能网关/中控</option>
                    <option>背景音乐/影音</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">满足数量/金额</span>
                  <input
                    type="number"
                    value={newPromotion.conditionValue}
                    onChange={(event) =>
                      setNewPromotion({ ...newPromotion, conditionValue: Number(event.target.value) })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">赠品数量</span>
                  <input
                    type="number"
                    min={1}
                    value={newPromotion.rewardQuantity}
                    onChange={(event) =>
                      setNewPromotion({ ...newPromotion, rewardQuantity: Number(event.target.value) })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-700">赠送产品（系统内选择，不计费）</span>
                <select
                  value={newPromotion.rewardProductId}
                  onChange={(event) =>
                    setNewPromotion({
                      ...newPromotion,
                      rewardProductId: event.target.value,
                      rewardProductName: event.target.selectedOptions[0].text,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="gift_switch_1">翎扬智能开关（赠品）</option>
                  <option value="gift_scene_1">智能场景面板（赠品）</option>
                  <option value="gift_sensor_1">人体传感器（赠品）</option>
                </select>
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">开始日期</span>
                  <input
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(event) => setNewPromotion({ ...newPromotion, startDate: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700">结束日期</span>
                  <input
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(event) => setNewPromotion({ ...newPromotion, endDate: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700"
                >
                  <Check className="h-3.5 w-3.5" /> 创建活动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
