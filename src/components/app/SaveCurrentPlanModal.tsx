import React, { useState } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  Tag,
  Building,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';
import { RenovationProject, SavedPlanRecord } from '../../types';
import { generateDefaultChatHistory } from '../../data/planChatHistoryData';

interface SaveCurrentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: RenovationProject;
  totalCostTenThousand: number;
  onSavePlan: (plan: SavedPlanRecord) => void;
}

export const SaveCurrentPlanModal: React.FC<SaveCurrentPlanModalProps> = ({
  isOpen,
  onClose,
  project,
  totalCostTenThousand,
  onSavePlan,
}) => {
  const [title, setTitle] = useState(
    `${project.communityName || '全屋智能'} · ${project.rooms.length}空间定制方案`
  );
  const [notes, setNotes] = useState(
    `包含 ${project.rooms.map((r) => r.name).join('、')} 共 ${project.rooms.length} 个空间的智能设备规划与预算。`
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: SavedPlanRecord = {
      id: `plan_rec_${Date.now()}`,
      title: title.trim() || `${project.communityName} 方案`,
      communityName: project.communityName || '智家全屋定制',
      cityName: project.cityName || '北京',
      createdAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
      updatedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
      presetId: project.selectedPresetId,
      roomsCount: project.rooms.length,
      totalCostTenThousand: totalCostTenThousand,
      totalCostYuan: Math.round(totalCostTenThousand * 10000),
      deviceCount: project.rooms.reduce((acc, r) => {
        let count = 0;
        if (r.scheme.enableLighting) count += (r.scheme.lighting?.circuitsCount || 2);
        if (r.scheme.enableCurtain) count += 1;
        if (r.scheme.enableOther) count += 2;
        return acc + count;
      }, 0),
      tags: [],
      notes,
      status: '已确认方案',
      orderStatus: 'contact_sales',
      orderStatusLabel: '1. 联系招商经理 (待提交)',
      project: JSON.parse(JSON.stringify(project)),
    };

    newRecord.chatHistory = generateDefaultChatHistory(newRecord);

    onSavePlan(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Save className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm tracking-tight truncate">保存当前方案至记录库</h3>
              <p className="text-[10px] text-slate-400 truncate">可随时查看明细、导出报价与再次编辑</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <span className="text-[9px] text-slate-400 block">小区项目</span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {project.communityName || '全屋定制'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">空间数量</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {project.rooms.length} 间
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">全屋总估算</span>
                <span className="text-xs font-extrabold text-blue-600 font-mono">
                  ¥{totalCostTenThousand}万
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">方案名称</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入方案名称 (如: 万科翡翠公园大平层方案)"
                className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl px-3 py-2 outline-none font-medium text-slate-900"
              />
            </div>


            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">备注说明</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加方案关键说明或业主偏好..."
                className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl p-2 outline-none text-slate-800 resize-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>保存到方案记录</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
