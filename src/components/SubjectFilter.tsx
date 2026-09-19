import React from 'react';
import type { SubjectType } from '../types';
import { SUBJECT_CONFIGS } from '../utils/storage';
import { soundEngine } from '../utils/audio';

interface SubjectFilterProps {
  currentSubject: SubjectType | 'all';
  onSelectSubject: (subject: SubjectType | 'all') => void;
  showPinyin?: boolean;
}

export const SubjectFilter: React.FC<SubjectFilterProps> = ({
  currentSubject,
  onSelectSubject,
}) => {
  const subjects: Array<{ id: SubjectType | 'all'; name: string; icon: string }> = [
    { id: 'all', name: '全部学科', icon: '🌈' },
    { id: 'hanzi', name: SUBJECT_CONFIGS.hanzi.name, icon: SUBJECT_CONFIGS.hanzi.icon },
    { id: 'pinyin', name: SUBJECT_CONFIGS.pinyin.name, icon: SUBJECT_CONFIGS.pinyin.icon },
    { id: 'math', name: SUBJECT_CONFIGS.math.name, icon: SUBJECT_CONFIGS.math.icon },
    { id: 'dubbing', name: SUBJECT_CONFIGS.dubbing.name, icon: SUBJECT_CONFIGS.dubbing.icon },
    { id: 'reading', name: SUBJECT_CONFIGS.reading.name, icon: SUBJECT_CONFIGS.reading.icon },
    { id: 'sports', name: SUBJECT_CONFIGS.sports.name, icon: SUBJECT_CONFIGS.sports.icon },
    { id: 'custom', name: SUBJECT_CONFIGS.custom.name, icon: SUBJECT_CONFIGS.custom.icon },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 my-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {subjects.map((s) => {
          const isSelected = currentSubject === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                soundEngine.playPop();
                onSelectSubject(s.id);
              }}
              className={`flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md scale-105 ring-2 ring-slate-800'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
