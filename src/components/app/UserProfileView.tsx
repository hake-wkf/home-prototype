import React, { useState } from 'react';
import {
  User,
  Phone,
  Edit3,
  X,
  Check,
  Building2,
  FileEdit,
  LogOut,
  Clock,
  Wallet,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Receipt,
  Sparkles,
  Layers,
  MapPin,
  Plus,
  Trash2,
  Star,
  CheckSquare,
  Ticket,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { UserProfile, UserDefaultContact, CustomerCoupon } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface UserProfileViewProps {
  user: UserProfile;
  savedPlansCount?: number;
  templatesCount?: number;
  activeOrdersCount?: number;
  onGoToRecords?: () => void;
  onGoToTemplates?: () => void;
  onGoToDesign?: () => void;
  onResetData?: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

const TRANSACTION_RECORDS = [
  { id: 'tx_001', title: '工程二期预付款', note: '银行公户转账', amount: 5000, type: 'income' as const, time: '2026-10-20 10:45' },
  { id: 'tx_002', title: '签约预存设备款', note: '财务审核入账', amount: 21800, type: 'income' as const, time: '2026-10-18 10:00' },
  { id: 'tx_003', title: '智能照明设备采购', note: '订单设备款抵扣', amount: 3680, type: 'expense' as const, time: '2026-10-15 16:20' },
  { id: 'tx_004', title: '优惠券核销', note: '全屋智能主机专享券', amount: 1500, type: 'expense' as const, time: '2026-10-12 11:30' },
  { id: 'tx_005', title: '项目追加预付款', note: '客户银行转账', amount: 8000, type: 'income' as const, time: '2026-10-08 09:12' },
  { id: 'tx_006', title: '安装调试服务费', note: '现场施工服务', amount: 1200, type: 'expense' as const, time: '2026-09-28 15:40' },
  { id: 'tx_007', title: '智能窗帘设备款', note: '订单设备款抵扣', amount: 2360, type: 'expense' as const, time: '2026-09-22 14:18' },
  { id: 'tx_008', title: '工程预存款', note: '财务审核入账', amount: 10000, type: 'income' as const, time: '2026-09-15 10:06' },
  { id: 'tx_009', title: '项目退款', note: '取消部分设备采购', amount: 680, type: 'income' as const, time: '2026-09-10 17:25' },
  { id: 'tx_010', title: '背景音乐设备款', note: '订单设备款抵扣', amount: 1880, type: 'expense' as const, time: '2026-09-03 12:42' },
  { id: 'tx_011', title: '项目预存款', note: '银行转账', amount: 6000, type: 'income' as const, time: '2026-08-28 09:30' },
  { id: 'tx_012', title: '智能门锁设备款', note: '订单设备款抵扣', amount: 3499, type: 'expense' as const, time: '2026-08-20 16:08' },
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onUpdateUser,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name || '卫科帆');
  const [editPhone, setEditPhone] = useState(user.phone || '17696180841');
  const [editCity, setEditCity] = useState(user.city || '北京市 / 朝阳区');
  const [editCommunity, setEditCommunity] = useState(user.communityName || '万科翡翠公园');
  const [editNotes, setEditNotes] = useState(
    user.customNotes || '意向全屋无主灯与智能窗帘方案，待商务审核勘测。'
  );

  // Balance Details Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [transactionQuery, setTransactionQuery] = useState('');
  const [visibleTransactionCount, setVisibleTransactionCount] = useState(5);

  // Default Contacts & Delivery Addresses (FEATURE 12: 设置多组默认联系人; 手机号码; 收获详细地址)
  const [contacts, setContacts] = useState<UserDefaultContact[]>(() =>
    user.defaultContacts && user.defaultContacts.length > 0
      ? user.defaultContacts
      : AdminStorageManager.getDefaultContacts()
  );
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<UserDefaultContact | null>(null);
  const [contactNameInput, setContactNameInput] = useState('');
  const [contactPhoneInput, setContactPhoneInput] = useState('');
  const [contactAddressInput, setContactAddressInput] = useState('');
  const [contactTagInput, setContactTagInput] = useState('新房');
  const [contactIsDefaultInput, setContactIsDefaultInput] = useState(false);

  // User's Balance Amount
  const currentBalance = typeof user.balance === 'number' ? user.balance : 26800;
  const userCoupons = Array.isArray(user.coupons) ? user.coupons : [];
  const [selectedCoupon, setSelectedCoupon] = useState<CustomerCoupon | null>(null);
  const selectedDefaultContact = contacts.find((contact) => contact.isDefault) || contacts[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'coupons' | 'contacts'>('overview');
  const filteredTransactions = TRANSACTION_RECORDS.filter((transaction) => {
    const matchesType =
      transactionFilter === 'all' || transaction.type === transactionFilter;
    const query = transactionQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      transaction.title.toLowerCase().includes(query) ||
      transaction.note.toLowerCase().includes(query) ||
      transaction.time.toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });
  const visibleTransactions = filteredTransactions.slice(0, visibleTransactionCount);

  const refreshContacts = () => {
    const latestContacts = AdminStorageManager.getDefaultContacts();
    setContacts(latestContacts);
    onUpdateUser({ ...user, defaultContacts: latestContacts });
  };

  const openAddContact = () => {
    setEditingContact(null);
    setContactNameInput('');
    setContactPhoneInput('');
    setContactAddressInput('');
    setContactTagInput('新房');
    setContactIsDefaultInput(contacts.length === 0);
    setIsContactModalOpen(true);
  };

  const openEditContact = (contact: UserDefaultContact) => {
    setEditingContact(contact);
    setContactNameInput(contact.name);
    setContactPhoneInput(contact.phone);
    setContactAddressInput(contact.address);
    setContactTagInput(contact.tag || '新房');
    setContactIsDefaultInput(!!contact.isDefault);
    setIsContactModalOpen(true);
  };

  const handleSaveContact = () => {
    if (!contactNameInput.trim() || !contactPhoneInput.trim() || !contactAddressInput.trim()) {
      window.alert('请完整填写联系人、手机号码和收货地址');
      return;
    }

    const contact: UserDefaultContact = {
      id: editingContact?.id || `contact_${Date.now()}`,
      name: contactNameInput.trim(),
      phone: contactPhoneInput.trim(),
      address: contactAddressInput.trim(),
      tag: contactTagInput,
      isDefault: contactIsDefaultInput,
      createdAt: editingContact?.createdAt || new Date().toISOString().slice(0, 10),
    };

    if (editingContact) {
      AdminStorageManager.updateDefaultContact(contact);
    } else {
      AdminStorageManager.addDefaultContact(contact);
    }
    refreshContacts();
    setIsContactModalOpen(false);
  };

  const handleDeleteContact = (contact: UserDefaultContact) => {
    if (!window.confirm(`确定删除联系人【${contact.name}】吗？`)) return;
    AdminStorageManager.deleteDefaultContact(contact.id);
    refreshContacts();
  };

  const handleSetDefaultContact = (contact: UserDefaultContact) => {
    AdminStorageManager.setDefaultContact(contact.id);
    refreshContacts();
  };

  const handleSaveProfile = () => {
    const updated: UserProfile = {
      ...user,
      name: editName.trim() || '智家用户',
      phone: editPhone.trim() || '17696180841',
      city: editCity.trim() || '北京市 / 朝阳区',
      communityName: editCommunity.trim() || '万科翡翠公园',
      customNotes: editNotes.trim(),
    };
    onUpdateUser(updated);
    setIsEditingProfile(false);
  };

  const handleLogout = () => {
    const loggedOutUser: UserProfile = {
      ...user,
      isLoggedIn: false,
    };
    onUpdateUser(loggedOutUser);
  };

  return (
    <div className="space-y-3.5 animate-fadeIn pb-12 select-none">
      {/* Audit Status Notice Banner if Pending */}
      {user.auditStatus === 'pending' && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-700 shadow-xs flex items-start space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex-1 text-xs space-y-0.5">
            <div className="flex items-center space-x-1.5 font-bold">
              <span>账号审核中</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Web端后台商务待审核
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              您已成功提交客户档案，后台商务经理与对应运营正在审核并对接量房排期。
            </p>
          </div>
        </div>
      )}

      {/* Profile hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-start justify-between p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-black text-blue-600">
              {(user.name || '卫').slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-extrabold">{user.name || '卫科帆'}</h3>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                  {user.auditStatus === 'pending' ? '待审核' : '已认证'}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-slate-500">
                <Phone className="h-3 w-3 text-slate-400" />
                {user.phone || '17696180841'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <Building2 className="h-3 w-3 text-slate-400" />
                {user.communityName || '万科翡翠公园'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditName(user.name || '卫科帆');
              setEditPhone(user.phone || '17696180841');
              setEditCity(user.city || '北京市 / 朝阳区');
              setEditCommunity(user.communityName || '万科翡翠公园');
              setEditNotes(user.customNotes || '');
              setIsEditingProfile(true);
            }}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <Edit3 className="h-3 w-3" />
            编辑
          </button>
        </div>

      </div>

      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-900">账户资产</p>
                <p className="mt-1 text-[10px] text-slate-400">余额与优惠权益</p>
              </div>
              <button
                onClick={() => setIsBalanceModalOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <Receipt className="h-3.5 w-3.5" />
                查看流水
              </button>
            </div>
            <div className="mt-3 flex items-end justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div>
                <p className="text-[10px] text-blue-700">可用余额</p>
                <p className="mt-1 font-mono text-2xl font-black text-slate-900">
                  <span className="mr-1 text-sm font-medium text-slate-500">¥</span>
                  {currentBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                正常可用
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-extrabold text-slate-900">我的服务</p>
            </div>
            <button
              onClick={() => setActiveTab('coupons')}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Ticket className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-bold text-slate-900">我的优惠券</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">{userCoupons.length} 张可用</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-bold text-slate-900">收货联系人</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">{contacts.length} 组现有信息</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>

          {user.customNotes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <FileEdit className="h-3.5 w-3.5" />
                需求备注
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">{user.customNotes}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            退出登录 / 切换账号
          </button>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div>
                <p className="text-xs font-extrabold text-slate-900">我的优惠券</p>
                <p className="mt-1 text-[10px] text-slate-400">点击查看券码与使用规则</p>
              </div>
            </div>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 font-mono text-xs font-bold text-rose-600">{userCoupons.length} 张</span>
          </div>
          <div className="mt-3 space-y-2">
            {userCoupons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-400">暂无可用优惠券</div>
            ) : (
              userCoupons.map((coupon) => {
                const isDiscount = coupon.type === 'discount';
                return (
                  <button
                    key={coupon.id}
                    onClick={() => setSelectedCoupon(coupon)}
                    className="flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-left hover:bg-rose-50 cursor-pointer"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-16 shrink-0 rounded-lg border border-rose-100 bg-white py-2 text-center">
                        <p className="font-mono text-sm font-black text-rose-600">{isDiscount ? `${coupon.value}折` : `¥${coupon.value}`}</p>
                        <p className="mt-0.5 text-[9px] text-slate-500">{coupon.minSpend > 0 ? `满${coupon.minSpend}可用` : '无门槛'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-slate-900">{coupon.name}</p>
                        <p className="mt-1 text-[9px] font-mono text-slate-400">有效期至 {coupon.validEndDate}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-rose-300" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div>
                <p className="text-xs font-extrabold text-slate-900">收货联系人</p>
                <p className="mt-1 text-[10px] text-slate-400">点击联系人设为默认</p>
              </div>
            </div>
            <button
              onClick={openAddContact}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              新增
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {contacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-400">
                暂无联系人
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`rounded-xl border p-3 ${
                    contact.isDefault
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => handleSetDefaultContact(contact)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900">{contact.name}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          {contact.tag || '地址'}
                        </span>
                        {contact.isDefault && (
                          <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            当前默认
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-slate-600">{contact.phone}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{contact.address}</p>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEditContact(contact)}
                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="rounded-md border border-rose-100 bg-white p-1.5 text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* Balance Details Modal (目前已有余额流水明细) */}
      {/* --------------------------------------------------------------------------- */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm">账户余额与财务核算明细</h3>
              </div>
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-slate-200 bg-blue-50/50 p-4">
                <p className="text-[10px] font-medium text-blue-700">当前可用余额</p>
                <p className="mt-1 font-mono text-2xl font-black text-slate-900">
                  <span className="mr-1 text-sm font-medium text-slate-500">¥</span>
                  {currentBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">共 {filteredTransactions.length} 笔相关流水</p>
              </div>

              <div className="space-y-3 p-4 text-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={transactionQuery}
                    onChange={(event) => {
                      setTransactionQuery(event.target.value);
                      setVisibleTransactionCount(5);
                    }}
                    placeholder="搜索流水说明或时间"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {[
                    { key: 'all' as const, label: '全部' },
                    { key: 'income' as const, label: '收入' },
                    { key: 'expense' as const, label: '支出' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setTransactionFilter(tab.key);
                        setVisibleTransactionCount(5);
                      }}
                      className={`rounded-md py-1.5 text-[10px] font-bold cursor-pointer ${
                        transactionFilter === tab.key
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {visibleTransactions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-xs text-slate-400">
                      没有找到符合条件的流水
                    </div>
                  ) : (
                    visibleTransactions.map((transaction) => {
                      const isIncome = transaction.type === 'income';
                      const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                      return (
                        <div key={transaction.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900">{transaction.title}</p>
                            <p className="mt-1 truncate text-[10px] text-slate-400">{transaction.note}</p>
                            <p className="mt-1 font-mono text-[9px] text-slate-400">{transaction.time}</p>
                          </div>
                          <span className={`shrink-0 font-mono text-sm font-black ${
                            isIncome ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {isIncome ? '+' : '-'}¥{transaction.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {visibleTransactionCount < filteredTransactions.length && (
                  <button
                    onClick={() => setVisibleTransactionCount((count) => count + 5)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    加载更多流水
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Detail Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3.5 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-rose-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <h3 className="text-sm font-extrabold">{selectedCoupon.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="rounded-lg p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 p-4 text-xs">
              <div className="rounded-xl border border-rose-100 bg-rose-50 py-3 text-center">
                <div className="font-mono text-2xl font-black text-rose-600">
                  {selectedCoupon.type === 'discount'
                    ? `${selectedCoupon.value}折`
                    : `¥${selectedCoupon.value}`}
                </div>
                <div className="mt-1 text-[11px] text-slate-600">
                  {selectedCoupon.minSpend > 0
                    ? `订单金额满 ¥${selectedCoupon.minSpend} 可用`
                    : '无门槛使用'}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">优惠券码</span>
                  <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono font-bold text-slate-900">
                    {selectedCoupon.code || 'ZHICPN8888'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">券类型</span>
                  <span className="font-medium">
                    {selectedCoupon.type === 'discount'
                      ? '折扣券'
                      : selectedCoupon.type === 'voucher'
                        ? '抵用代金券'
                        : '满减立减券'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">有效期限</span>
                  <span className="font-mono text-slate-600">
                    {selectedCoupon.validStartDate} ~ {selectedCoupon.validEndDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">状态</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    可使用
                  </span>
                </div>
              </div>

              {selectedCoupon.description && (
                <div className="text-[11px] leading-relaxed text-slate-500">
                  <span className="font-bold text-slate-700">使用规则: </span>
                  {selectedCoupon.description}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Editor Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-3.5 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-300" />
                <h3 className="text-sm font-extrabold">
                  {editingContact ? '编辑默认联系人' : '新增默认联系人'}
                </h3>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">联系人姓名</label>
                <input
                  value={contactNameInput}
                  onChange={(event) => setContactNameInput(event.target.value)}
                  placeholder="请输入联系人姓名"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">手机号码</label>
                <input
                  type="tel"
                  value={contactPhoneInput}
                  onChange={(event) => setContactPhoneInput(event.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  placeholder="请输入11位手机号码"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">收货详细地址</label>
                <textarea
                  rows={3}
                  value={contactAddressInput}
                  onChange={(event) => setContactAddressInput(event.target.value)}
                  placeholder="请输入省市区、街道、门牌号"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">地址标签</label>
                  <select
                    value={contactTagInput}
                    onChange={(event) => setContactTagInput(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="新房">新房</option>
                    <option value="家">家</option>
                    <option value="公司">公司</option>
                    <option value="工地">工地</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <label className="flex items-end space-x-2 pb-2 text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={contactIsDefaultInput}
                    onChange={(event) => setContactIsDefaultInput(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <span>设为默认联系人</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-2 border-t border-slate-200 bg-slate-50 p-3">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveContact}
                className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                保存联系人
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* Edit Profile Modal */}
      {/* --------------------------------------------------------------------------- */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-slate-300" />
                <h3 className="font-extrabold text-sm">编辑客户档案信息</h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  客户名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  客户联系方式 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono focus:bg-white focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  客户小区 / 地址 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCommunity}
                  onChange={(e) => setEditCommunity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900"
                  placeholder="如：华润万象府 3号楼"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  需求备忘 / 客户手输记录
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none leading-relaxed focus:bg-white focus:border-slate-900"
                  placeholder="可在此手输客户习惯、施工要求或设备特殊偏好..."
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>保存信息</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
