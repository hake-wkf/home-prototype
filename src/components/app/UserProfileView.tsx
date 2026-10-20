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
} from 'lucide-react';
import { UserProfile, UserDefaultContact } from '../../types';
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

      {/* 1. Clean User Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={
                user.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-slate-900">{user.name || '卫科帆'}</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {user.auditStatus === 'pending' ? '待审核客户' : '已认证客户'}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{user.phone || '17696180841'}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {user.communityName || '万科翡翠公园'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setEditName(user.name || '卫科帆');
                setEditPhone(user.phone || '17696180841');
                setEditCity(user.city || '北京市 / 朝阳区');
                setEditCommunity(user.communityName || '万科翡翠公园');
                setEditNotes(user.customNotes || '');
                setIsEditingProfile(true);
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>编辑档案</span>
            </button>
          </div>
        </div>

        {/* Customer Manual Notes Box */}
        {user.customNotes && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 space-y-1">
            <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-400">
              <FileEdit className="w-3 h-3 text-slate-400" />
              <span>需求备忘 / 客户手输记录:</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {user.customNotes}
            </p>
          </div>
        )}
      </div>

      {/* 2. 目前已有余额 (FEATURE 3: 查看目前已有余额) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-4.5 border border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">目前已有余额</span>
              <span className="text-[10px] text-slate-400">账户可用资金 · 可直接抵扣设备与施工款</span>
            </div>
          </div>

          <button
            onClick={() => setIsBalanceModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Receipt className="w-3 h-3 text-slate-400" />
            <span>查看流水</span>
          </button>
        </div>

        <div className="pt-1 flex items-baseline justify-between border-t border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 mr-1 font-sans">¥</span>
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              {currentBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>正常可用</span>
          </div>
        </div>
      </div>

      {/* 3. 目前已有优惠券 (FEATURE 3: 目前已有优惠券) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">目前已有优惠券</h4>
              <p className="text-[10px] text-slate-400">签约全屋方案与采购设备时可叠加减免</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            {userCoupons.length} 张可用
          </span>
        </div>

        {/* Coupons Cards List */}
        <div className="space-y-2.5 pt-1">
          {userCoupons.map((coupon) => {
            const isDiscount = coupon.type === 'discount';
            const isVoucher = coupon.type === 'voucher';

            return (
              <div
                key={coupon.id}
                onClick={() => setSelectedCoupon(coupon)}
                className="group relative bg-gradient-to-r from-rose-50/50 via-white to-amber-50/40 border border-rose-200/80 hover:border-rose-300 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                {/* Left: Value & Threshold */}
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-18 shrink-0 text-center py-1 px-1 bg-white border border-rose-100 rounded-lg shadow-2xs">
                    <div className="text-rose-600 font-black font-mono leading-none">
                      {isDiscount ? (
                        <span className="text-base font-extrabold">{coupon.value}折</span>
                      ) : (
                        <>
                          <span className="text-xs font-normal">¥</span>
                          <span className="text-base">{coupon.value}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5 scale-90">
                      {coupon.minSpend > 0 ? `满${coupon.minSpend}可用` : '无门槛立减'}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {coupon.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-700">
                        {isDiscount ? '折扣券' : isVoucher ? '抵用券' : '满减券'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 truncate">
                      {coupon.applicableScope || '全屋智能方案全品类'}
                    </p>

                    <p className="text-[9px] text-slate-400 font-mono">
                      有效期至: {coupon.validEndDate}
                    </p>
                  </div>
                </div>

                {/* Right: Action */}
                <div className="shrink-0 flex items-center space-x-1 text-[11px] font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">
                  <span>查看券码</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Minimal Account Actions */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>退出登录 / 切换账号</span>
        </button>
      </div>

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

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
              {/* Balance Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">目前已有余额总计</span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ¥{currentBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-400">
                  款项由财务中心统一核验到账后正式入账
                </p>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">近期资金与充值记录:</span>
                <div className="space-y-2 divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">工程二期预付款 (银行公户转账)</span>
                      <span className="font-mono font-bold text-emerald-600">+¥5,000.00</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>财务审核人: 张财务 (财务总监)</span>
                      <span className="font-mono">2026-08-20 10:45</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">签约预存智能设备工程款</span>
                      <span className="font-mono font-bold text-emerald-600">+¥21,800.00</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>初始预存款 · 财务入账</span>
                      <span className="font-mono">2026-08-18 10:00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-0.5">
                <span className="font-bold block">温馨提示:</span>
                <p className="text-slate-600 text-[10px] leading-relaxed">
                  如需更改或充值余额，请联系专属商务经理提交付款凭证，经财务审核无误后将立即同步更新至您的账户。
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* Coupon Detail Modal (优惠券详情) */}
      {/* --------------------------------------------------------------------------- */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
            <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4" />
                <h3 className="font-extrabold text-sm">{selectedCoupon.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="text-center py-2 bg-rose-50 border border-rose-100 rounded-xl space-y-1">
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {selectedCoupon.type === 'discount'
                    ? `${selectedCoupon.value}折`
                    : `¥${selectedCoupon.value}`}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {selectedCoupon.minSpend > 0
                    ? `订单方案金额满 ¥${selectedCoupon.minSpend} 元可用`
                    : '无门槛使用立减券'}
                </span>
              </div>

              <div className="space-y-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">优惠券码:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedCoupon.code || 'ZHICPN8888'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">券类型:</span>
                  <span className="font-medium">
                    {selectedCoupon.type === 'discount'
                      ? '折扣券'
                      : selectedCoupon.type === 'voucher'
                      ? '抵用代金券'
                      : '满减立减券'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">适用范围:</span>
                  <span className="font-medium text-slate-900">
                    {selectedCoupon.applicableScope || '全屋智能方案 / 智能硬件设备'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">有效期限:</span>
                  <span className="font-mono text-slate-600">
                    {selectedCoupon.validStartDate} ~ {selectedCoupon.validEndDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">状态:</span>
                  <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                    可使用
                  </span>
                </div>
              </div>

              {selectedCoupon.description && (
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">使用规则: </span>
                  {selectedCoupon.description}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                关闭
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
