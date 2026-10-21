export type CurtainType = 'open_close' | 'roller';
export type CurtainLayer = 'single' | 'double';
export type SupplyType = 'self' | 'external';

export interface LightingConfig {
  circuitsCount: number; // 几路灯
  dimmableCount: number; // 其中调光灯数量
  preferredSeriesId?: string; // 倾向使用的设备系列 (下拉列表，非必选)
}

export interface CurtainConfig {
  curtainType: CurtainType; // 开合帘 or 卷帘
  curtainLayer?: CurtainLayer; // 单层 or 双层 (仅开合帘)
  preferredSeriesId?: string;
}

export interface OtherRequirements {
  smartSensors?: boolean; // 人体存在感应
  thermostatControl?: boolean; // 温控/空调面板
  bgMusic?: boolean; // 背景音乐
  smartLock?: boolean; // 智能门锁
  freshAirPanel?: boolean; // 新风面板
  customNotes: string; // 用户手输的其他要求
}

export interface RoomScheme {
  isCustom: boolean; // false = 使用默认方案, true = 使用自定义方案
  defaultTemplateId?: string;
  lighting?: LightingConfig;
  curtain?: CurtainConfig;
  enableLighting: boolean; // 是否选择灯
  enableCurtain: boolean; // 是否选择窗帘
  enableOther: boolean; // 是否选择其他
  otherRequirements: OtherRequirements;
}

export interface FloorPlanPin {
  id: string;
  roomId: string;
  xPercentage: number; // Percentage relative to image width
  yPercentage: number; // Percentage relative to image height
}

export interface RoomItem {
  id: string;
  name: string; // e.g., "主卧", "客厅", "次卧1", "卫生间"
  category: 'bedroom' | 'living' | 'dining' | 'kitchen' | 'bathroom' | 'study' | 'balcony' | 'entrance' | 'other';
  areaSquareMeters?: number;
  floorPlanImageUrl?: string | null; // 以房间为单位上传的房间户型图
  scheme: RoomScheme;
}

export interface DeviceSeries {
  id: string;
  name: string;
  description: string;
  brandTag: string;
  badgeColor: string;
  priceLevel: 'budget' | 'standard' | 'premium' | 'luxury';
  estimatedLightUnitCost: number; // approx cost per circuit
  estimatedDimmerUnitCost: number; // extra cost per dimmer
  estimatedCurtainMotorCost: number; // per motor
}

export interface LayoutPreset {
  id: string;
  title: string;
  subtitle: string;
  categoryTag?: 'small' | 'medium' | 'large' | 'villa' | 'commercial';
  categoryLabel?: string;
  roomNames: string[];
  suggestedMinBudget: number; // in 10k RMB (万元)
  suggestedMaxBudget: number;
  defaultImage?: string;
}

export interface DefaultRoomTemplate {
  id: string;
  roomCategory: RoomItem['category'];
  title: string;
  description: string;
  lighting: LightingConfig;
  curtain: CurtainConfig;
  enableLighting: boolean;
  enableCurtain: boolean;
  enableOther: boolean;
  otherRequirements: OtherRequirements;
  estimatedCost: number; // approx cost in Yuan
}

export interface RenovationProject {
  communityName: string; // 用户手输的小区名称
  cityName?: string;
  minBudget: number; // 预算下限 (万元)
  maxBudget: number; // 预算上限 (万元)
  selectedPresetId?: string;
  floorPlanImageUrl: string | null;
  floorPlanPins: FloorPlanPin[];
  rooms: RoomItem[];
  overallNotes?: string;
}

export interface RoomDefaultDeviceItem {
  id: string;
  roomCategory: RoomItem['category'] | 'weak_box';
  brand: string;
  category: string;
  model: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  imageUrl: string;
  isRequired?: boolean;
}

export interface EquipmentProduct {
  id: string;
  model: string; // 设备型号
  brand: string; // 品牌
  category: string; // 设备类型
  price: number; // 参考单价
  unit: string; // 单位 (台, 个, 套, 把, 米, 箱)
  imageUrl: string; // 配图
  installationNotes: string; // 安装注意点
  description: string; // 规格/描述
  supplyType?: SupplyType; // 自有产品 / 外协产品
}

export interface RoomSchemeDeviceItem {
  id: string;
  productId: string;
  brand: string;
  model: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  imageUrl: string;
  installationNotes?: string;
  supplyType?: SupplyType;
}

export interface LayoutRoomSchemeConfig {
  id: string;
  layoutPresetId: string; // 绑定的户型 ID
  roomCategory: RoomItem['category'] | 'weak_box';
  roomName: string; // 如 "客厅", "主卧", "厨房", "弱电箱机房"
  title: string;
  description: string;
  lightingCircuits: number;
  dimmableCircuits: number;
  curtainType: 'open_close' | 'roller' | 'none';
  devices: RoomSchemeDeviceItem[]; // 具体的设备型号和数量
}

// 4-Stage Shipping and Order Tracking Status:
// 1. 联系招商经理 -> 2. 招商经理审核中 -> 3. 已发货(订单号) -> 4. 签收
export type OrderShippingStatus =
  | 'contact_sales' // 1. 联系招商经理 (待联系 / 草稿)
  | 'reviewing' // 2. 招商经理审核中 (招商经理核价与审核)
  | 'shipping' // 3. 已发货(订单号) (运输中)
  | 'delivered' // 4. 签收 (已签收交付)
  | 'draft' // Alias for contact_sales
  | 'submitted' // Alias for reviewing
  | 'locked'
  | 'packing'
  | 'completed';

export interface ShippingTimelineNode {
  status: string;
  stepNumber: number; // 1: 联系招商经理, 2: 招商经理审核中, 3: 已发货, 4: 签收
  title: string;
  description: string;
  time: string;
  done: boolean;
  active?: boolean;
}

// 单个发货单/包裹信息 (支持多发货单)
export interface ShipmentPackage {
  packageId: string;
  trackingNumber: string; // 发货单号 (e.g. "SF138982847291" 或 "EXP2026090101")
  title: string; // 发货单名称/包裹品类, e.g. "第 1 箱 · 智能主控与网络通信"
  carrier?: string; // 承运方, e.g. "顺丰速运"
  status: 'shipping' | 'delivered' | 'pending'; // 状态: '已发货' | '已签收' | '备货中'
  itemsSummary?: string; // 简要品类
}

export interface ShippingLogisticsInfo {
  orderNumber: string; // 订单号 e.g. "ORD202608200088"
  carrier?: string; // 承运方式 e.g. "顺丰速运"
  trackingNumber: string; // 主单号 / 兼容单号
  trackingNumbers?: string[]; // 多个发货单号列表
  packages?: ShipmentPackage[]; // 多个发货单明细
  totalProgress?: number; // 0 - 100 (总发货进度百分比)
  totalProgressLabel?: string; // e.g. "总发货进度 100% · 全部已发出"
  shippingDate: string; // e.g. "2026-08-20 10:30"
  estimatedArrivalDate: string; // e.g. "2026-08-21 18:00"
  deliveredDate?: string; // 签收时间
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  businessManagerName: string; // 专属招商经理, e.g. "王经理"
  businessManagerPhone: string; // e.g. "186-0010-8899"
  businessManagerWechat?: string;
  notes?: string;
  currentStepIndex: number; // 0: 联系招商经理, 1: 招商经理审核中, 2: 已发货, 3: 签收
  timeline: ShippingTimelineNode[];
}

// Default Contact & Delivery Address (个人中心默认联系人与收货地址)
export interface UserDefaultContact {
  id: string;
  name: string; // 联系人
  phone: string; // 手机号码
  address: string; // 收获详细地址
  isDefault?: boolean; // 是否默认
  tag?: string; // 标签，如 '家' | '公司' | '新房'
  createdAt?: string;
}

export interface CustomerAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

// User Profile
export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  roleTitle: string; // 如 "智家全屋定制用户" / "方案主理人"
  city: string; // 所在城市，如 "北京市 / 朝阳区"
  communityName?: string; // 客户所属小区
  customNotes?: string; // 客户手输记录/备注需求
  isLoggedIn: boolean;
  createdAt: string;
  registeredAt?: string;
  // Audit and verification metadata
  auditStatus?: 'pending' | 'certified' | 'reviewing' | 'rejected' | 'approved'; // 审核状态
  auditFeedback?: string; // 审核意见
  auditTime?: string;
  auditorName?: string;
  dealerCode?: string;
  dealerName?: string;
  dealerLevel?: string;
  authStatus?: 'certified' | 'pending' | 'reviewing';
  authExpiryDate?: string;
  role?: string;
  vipLevel?: string;
  consultantName?: string;
  consultantPhone?: string;
  balance?: number; // 用户App端已有余额
  cooperationDeposit?: number; // 合作保证金
  purchaseBalance?: number; // 进货款余额
  accountEnabled?: boolean; // 账号是否启用
  contractStartDate?: string;
  contractEndDate?: string;
  renewalReminderDays?: number;
  contractAttachments?: CustomerAttachment[];
  giftDescription?: string;
  operationBrands?: string;
  annualSales?: string;
  storeArea?: string;
  companyStaff?: string;
  businessScopes?: string[];
  annualShipment?: string;
  coupons?: CustomerCoupon[]; // 用户App端已有优惠券
  defaultContacts?: UserDefaultContact[]; // 个人中心多组默认联系人与收货地址
}

// ---------------------------------------------------------------------------
// Customer Coupons (优惠券)
// ---------------------------------------------------------------------------
export interface CustomerCoupon {
  id: string;
  name: string; // 优惠券名称
  type: 'amount' | 'discount' | 'voucher'; // 'amount' (满减), 'discount' (折扣), 'voucher' (代金券/无门槛)
  value: number; // 面值金额 (如 1000, 2000) 或 折扣率 (如 8.8, 9.5)
  minSpend: number; // 使用门槛，0为无门槛，大于0为满减金额
  validStartDate: string; // 有效期起始: "2026-08-01"
  validEndDate: string; // 有效期截止: "2026-12-31"
  status: 'usable' | 'used' | 'expired'; // 状态: 可使用 | 已使用 | 已过期
  applicableScope?: string; // 适用范围，例如 "全屋智能定制方案 / 智能照明 / 窗帘电机"
  code?: string; // 优惠券券码
  description?: string; // 优惠说明
  createdAt?: string;
  assignedCustomerId?: string; // 若指定客户发放
}

export interface CouponIssueRecord {
  id: string;
  couponId: string;
  couponName: string;
  couponCode?: string;
  couponType: CustomerCoupon['type'];
  couponValue: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  issuedAt: string;
  operator: string;
  source: 'coupon-center' | 'customer-detail';
}

// ---------------------------------------------------------------------------
// Balance Audit Request (余额变更与财务审核)
// ---------------------------------------------------------------------------
export interface BalanceAuditRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  originalBalance: number; // 原余额
  targetBalance: number; // 回款后账户余额
  accountType?: 'deposit' | 'purchase'; // 合作保证金 / 进货款
  changeAmount: number; // 调整变动金额 (targetBalance - originalBalance)
  remark: string; // 提交备注
  paymentProofUrl: string; // 付款截图
  applicant: string; // 申请人 / 提交人
  submittedAt: string; // 提交时间
  status: 'pending_finance' | 'approved' | 'rejected'; // 待财务审核 | 财务已通过 | 财务已驳回
  financeReviewer?: string; // 财务审核人员
  financeReviewedAt?: string; // 财务审核时间
  financeNote?: string; // 财务审核意见
}

export interface BalanceTransactionRecord {
  id: string;
  customerId?: string;
  customerPhone?: string;
  title: string;
  note: string;
  amount: number;
  type: 'income' | 'expense';
  accountType: 'deposit' | 'purchase';
  time: string;
  planId?: string;
}

export interface PlanChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'salesperson';
  senderName?: string;
  avatar?: string;
  content: string;
  timestamp: string;
  schemeSummary?: {
    totalCostTenThousand?: number;
    deviceCount?: number;
    highlights?: string[];
  };
}

// Saved Renovation Plan Record
export interface SavedPlanRecord {
  id: string;
  title: string;
  communityName: string;
  cityName?: string;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string; // 客户手输记录
  createdAt: string;
  updatedAt: string;
  presetId?: string;
  presetTitle?: string;
  roomsCount: number;
  totalCostTenThousand: number; // in 万元
  totalCostYuan: number;
  deviceCount: number;
  project: RenovationProject;
  tags: string[];
  notes?: string;
  status: '草稿' | '已确认方案' | '施工中' | '已归档';
  // Order & Logistics Tracking
  orderStatus?: OrderShippingStatus;
  orderStatusLabel?: string;
  planAuditStatus?: 'pending' | 'approved' | 'rejected';
  planAuditFeedback?: string;
  planAuditReviewer?: string;
  planAuditedAt?: string;
  erpAuditedAt?: string;
  contactedBusinessAt?: string;
  logisticsInfo?: ShippingLogisticsInfo;
  isCustomTemplate?: boolean;
  chatHistory?: PlanChatMessage[]; // 客户沟通与AI对话记录
  consultantName?: string;
  consultantPhone?: string;
  appliedCouponId?: string;
  appliedCouponName?: string;
  couponDiscountAmount?: number;
  orderPaidAmount?: number;
  customerAddress?: string;
  couponEligibleAmount?: number;
  externalAmount?: number;
  schemePriceYuan?: number;
  dealerPriceYuan?: number;
  priceDifferenceYuan?: number;
  shippingFee?: number;
  shippingThreshold?: number;
  shippingPolicyLabel?: string;
  purchaseBalanceDeducted?: number;
  creditPaymentAmount?: number;
  balanceDeductedAt?: string;
  promotionGifts?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    promotionId?: string;
    promotionName?: string;
    customerName?: string;
    customerPhone?: string;
    awardedAt?: string;
  }>;
}

// Curated Plan Template
export interface PlanTemplate {
  id: string;
  title: string;
  subtitle: string;
  coverImage?: string;
  category: 'compact' | 'quality' | 'luxury' | 'villa' | 'elderly' | 'geek' | 'custom';
  categoryLabel: string;
  priceGrade: '入门轻奢' | '品质精选' | '尊享高端' | '奢华定制' | '个人自定';
  estimatedCostTenThousand: number;
  roomsCount: number;
  deviceCount: number;
  features: string[];
  highlights: string[];
  recommendedLayout: string;
  description: string;
  rooms: RoomItem[];
  defaultMinBudget: number;
  defaultMaxBudget: number;
  isUserCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
  authorPhone?: string;
  communityName?: string;
  customerId?: string;
  status?: 'published' | 'draft' | 'archived';
  usageCount?: number;
}

export type CustomerStatus = '资源客户' | '意向客户' | '签约客户' | '丢单客户';
export type DeliveryStatus = '未交付' | '施工中' | '已交付';
export type PriceGrade = '普通级别' | '高端级别' | '尊享级别' | '暂无';
export type CustomerLevel = '普通客户' | '重要客户' | '优质客户' | '战略客户';
export type CustomerType = '家装客户' | '工装客户' | '别墅项目' | '大平层' | '展示厅';

export interface FollowUpRecord {
  id: string;
  customerId: string;
  time: string; // e.g. "2026-08-18 16:27:16"
  method: string; // e.g. "指派客户", "更新客户状态", "创建客户", "电话跟进", "微信沟通", "现场量房", "方案汇报", "招商经理洽谈"
  matter: string; // 主要事宜
  result: string; // 跟进结果
  type: '日志' | '跟进'; // 类型
  operator: string; // 操作人, e.g. "卫科帆"
  images?: string[];
  lossStatus?: '正常跟进' | '暂不跟进' | '流失';
  nextFollowUp?: string;
  nextFollowUpTime?: string;
  notes?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. "CUST-001"
  name: string; // 客户姓名, e.g. "测试客户"
  projectName: string; // 项目名称, e.g. "谷家智能测试"
  phone: string; // 客户电话
  followUpStatus: string; // 跟进状态, e.g. "未跟进", "08-18 16:26", "已出方案", "待签约"
  status?: CustomerStatus; // 客户状态: 可选
  deliveryStatus?: DeliveryStatus; // 交付状态: 可选
  priceGrade?: PriceGrade; // 价格等级: 可选
  salesperson: string; // 业务员 / 销售顾问
  creator: string; // 创建人
  createdAt: string; // 创建时间: "2026-08-18 16:28"
  updatedAt: string; // 更新时间: "2026-08-18 16:28"
  isPool: boolean; // true = 客户池中, false = 归属到具体业务员我的客户
  
  // 补充信息
  community?: string; // 客户小区
  customNotes?: string; // 客户手输记录 / 需求备忘
  auditStatus?: 'pending' | 'certified' | 'reviewing' | 'rejected' | 'approved'; // 审核状态
  auditFeedback?: string; // 审核反馈意见
  assignedTo?: string; // 指派招商经理/销售顾问
  assignedBusiness?: string; // 招商经理 (负责招商经理沟通、报价与签约)
  assignedOperations?: string; // 对应运营 (负责方案排期、交付施工与客户跟进)
  balance?: number; // 客户已有余额 (元)
  cooperationDeposit?: number; // 合作保证金 (不可用于下单)
  purchaseBalance?: number; // 进货款余额 (可用于下单)
  accountEnabled?: boolean; // 是否允许使用 App
  contractStartDate?: string;
  contractEndDate?: string;
  renewalReminderDays?: number;
  contractAttachments?: CustomerAttachment[];
  giftDescription?: string;
  operationBrands?: string;
  annualSales?: string;
  storeArea?: string;
  companyStaff?: string;
  businessScopes?: string[];
  annualShipment?: string;
  coupons?: CustomerCoupon[]; // 客户已有优惠券列表
  avatar?: string; // 客户头像
  memo?: string; // 客户便签
  region: string; // 所属地区, e.g. "北京-北京-朝阳"
  detailAddress: string; // 详细地址, e.g. "北京顺义区大槐树镇"
  source: string; // 客户来源, e.g. "上门用户", "朋友推荐", "广告投放", "渠道介绍"
  level?: CustomerLevel; // 客户级别 (可选)
  category: CustomerType; // 客户类别, e.g. "家装客户"
  designer?: string; // 家装设计师
  firstContactDate?: string; // 初次接触时间
  houseArea?: string; // 房屋面积
  houseLayout?: string; // 房屋户型
  channel?: string; // 关联渠道
  requirement?: string; // 客户需求
  remark?: string; // 备注
  wechat?: string; // 微信
  attachments?: string[]; // 附件
  isShared?: boolean; // 是否共享
}

export interface PromotionActivity {
  id: string;
  name: string;
  enabled: boolean;
  audience: 'all' | 'specified';
  customerIds: string[];
  conditionType: 'quantity' | 'amount';
  conditionCategory: string;
  conditionValue: number;
  rewardProductId: string;
  rewardProductName: string;
  rewardQuantity: number;
  startDate: string;
  endDate: string;
}

export interface BusinessRuleSettings {
  shippingThreshold: number;
  shippingFee: number;
  externalProductsIncludeFreeShipping: boolean;
  defaultContractMonths: number;
  renewalReminderDays: number;
}

// ---------------------------------------------------------------------------
// Custom Manual Product Quotation (手输与产品选配报价 - 参考图一)
// ---------------------------------------------------------------------------
export interface CustomQuoteProductItem {
  id: string;
  productId: string;
  productName: string;
  model: string;
  brand: string;
  category: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  subtotal: number;
  imageUrl?: string;
  intro?: string; // 产品简介 (点击修改产品简介)
  note?: string; // 备注 (+添加备注)
  isGift?: boolean; // 是否赠送 (金额0)
  subgroup?: string; // e.g. "小米必备", "基础智能", "影音升级"
}

export interface CustomQuoteExtraFee {
  id: string;
  name: string; // e.g. "安装调试服务费", "打孔布线费", "运费"
  amount: number;
  note?: string;
}

export interface CustomQuoteRoomSection {
  id: string;
  roomName: string; // e.g. "客厅", "卧室", "主卧", "厨房", "卫生间", "全屋设备"
  roomCategory: RoomItem['category'] | 'other' | 'whole_house';
  subgroups: string[];
  items: CustomQuoteProductItem[];
  extraFees: CustomQuoteExtraFee[];
  discountRate?: number; // 折扣系数 1.0
  customAdjustment?: number; // 调整价格 offset
}

export interface CustomQuotationRecord {
  id: string;
  title: string;
  customerName?: string;
  customerPhone?: string;
  communityName?: string;
  createdAt: string;
  updatedAt: string;
  rooms: CustomQuoteRoomSection[];
  overallDiscount?: number; // 整体折扣
  overallNotes?: string;
  totalAmount: number;
  totalDeviceCount: number;
  status: '草稿' | '已生成报价' | '已签约';
}

// ---------------------------------------------------------------------------
// Floor Plan CAD Point Placement Design (点位图配置 - 参考图二)
// ---------------------------------------------------------------------------
export interface CanvasPinItem {
  id: string;
  productId: string;
  model: string;
  brand: string;
  category: string;
  roomName: string;
  roomCategory?: string;
  unitPrice: number;
  imageUrl?: string;
  xPercentage: number; // 0-100% on floor plan
  yPercentage: number; // 0-100% on floor plan
  rotation?: number; // 0, 90, 180, 270 deg
  circuitNumber?: string; // e.g. "L1", "L2", "AC1", "C1"
  notes?: string;
  color?: string;
  isPlaced: boolean;
  pinType?: 'device' | 'text' | 'icon' | 'zone';
  label?: string;
}

export interface FloorDrawingLayer {
  id: string;
  name: string; // e.g. "1F 点位图+灯光图", "2F 点位图"
  blueprintUrl: string;
  pins: CanvasPinItem[];
}

export interface FloorPlanDesignProject {
  id: string;
  title: string;
  associatedPlanId?: string; // 关联的方案ID或报价单ID
  communityName?: string;
  updatedAt: string;
  activeLayerId: string;
  layers: FloorDrawingLayer[];
}
