import React from 'react';
import { DragonButton } from './DragonButton';
import { Plus, Video, Users, Mic, FolderPlus } from 'lucide-react';

export type DragonEmptyType = 'project' | 'video' | 'character' | 'voice' | 'search' | 'generic';

interface DragonEmptyStateProps {
  type?: DragonEmptyType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const DragonEmptyState: React.FC<DragonEmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  const configs = {
    project: {
      icon: '🐲',
      defaultTitle: 'មិនទាន់មានគម្រោង',
      defaultDesc: 'ចាប់ផ្តើមគម្រោងថ្មីរបស់អ្នក ឬបើកគម្រោងដែលមានស្រាប់ដើម្បីកែសម្រួល',
      defaultAction: '+ បង្កើតគម្រោងថ្មី',
      actionIcon: <FolderPlus className="w-4 h-4" />,
    },
    video: {
      icon: '🎬',
      defaultTitle: 'បញ្ចូលវីដេអូដំបូង',
      defaultDesc: 'ទាញទម្លាក់វីដេអូ MP4/MKV ឬចុច Import Video ដើម្បីចាប់ផ្តើមបម្លែងសំឡេង',
      defaultAction: '🎬 ជ្រើសរើសវីដេអូ (Upload)',
      actionIcon: <Video className="w-4 h-4" />,
    },
    character: {
      icon: '👤',
      defaultTitle: 'បង្កើតតួអង្គដំបូង',
      defaultDesc: 'បង្កើតតួអង្គ និងភ្ជាប់សំឡេង AI សមស្របតាមភេទ និងទឹកដមសាច់រឿង',
      defaultAction: '+ បង្កើតតួអង្គថ្មី',
      actionIcon: <Users className="w-4 h-4" />,
    },
    voice: {
      icon: '🎙️',
      defaultTitle: 'ជ្រើសរើសសំឡេង AI',
      defaultDesc: 'ជ្រើសរើសសំឡេងពី Dragon Voice Lab ឬ Clone សំឡេងផ្ទាល់ពីរឿងដើម',
      defaultAction: '🐲 បើក Voice Lab',
      actionIcon: <Mic className="w-4 h-4" />,
    },
    search: {
      icon: '🔍',
      defaultTitle: 'រកមិនឃើញទិន្នន័យ',
      defaultDesc: 'សូមព្យាយាមស្វែងរកជាមួយពាក្យគន្លឹះផ្សេងទៀត',
      defaultAction: undefined,
      actionIcon: undefined,
    },
    generic: {
      icon: '✨',
      defaultTitle: 'គ្មានទិន្នន័យ',
      defaultDesc: 'មិនទាន់មានទិន្នន័យសម្រាប់បង្ហាញនៅឡើយទេ',
      defaultAction: undefined,
      actionIcon: undefined,
    },
  };

  const config = configs[type] || configs.generic;
  const finalTitle = title || config.defaultTitle;
  const finalDesc = description || config.defaultDesc;
  const finalAction = actionText || config.defaultAction;

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-slate-200 dark:border-[#203244] bg-white dark:bg-[#0B111C]/80 backdrop-blur-md overflow-hidden ${className}`}
    >
      {/* Background Magic Circle Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(22,217,255,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Dragon Icon Badge */}
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#152235] to-[#101925] border border-slate-200 dark:border-[#203244] flex items-center justify-center shadow-[0_0_30px_rgba(22,217,255,0.2)]">
          <span className="text-4xl select-none filter drop-shadow-[0_2px_12px_rgba(22,217,255,0.4)]">
            {config.icon}
          </span>
        </div>
        {/* Little energy aura */}
        <div className="absolute -inset-2 rounded-3xl bg-[#16D9FF]/20 blur-xl pointer-events-none" />
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-white font-khmer tracking-wide mb-1.5 drop-shadow-sm">
        {finalTitle}
      </h3>
      <p className="text-xs text-[#94A3B8] font-khmer max-w-md leading-relaxed mb-6">
        {finalDesc}
      </p>

      {/* Action Button */}
      {finalAction && onAction && (
        <DragonButton
          variant="energy"
          size="md"
          icon={config.actionIcon}
          onClick={onAction}
        >
          {finalAction}
        </DragonButton>
      )}
    </div>
  );
};
