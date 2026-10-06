import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  Zap,
  CheckCircle2,
  CornerDownLeft,
  Volume2,
  Languages,
  Users,
  Subtitles,
  Share2,
  Film,
  RotateCcw,
} from 'lucide-react';
import { DragonButton } from './DragonButton';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionExecuted?: string;
}

interface DragonAIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onExecuteCommand?: (cmd: string) => void;
  onTranslateAll?: () => void;
  onDetectCharacters?: () => void;
  onAssignVoices?: () => void;
  onCreateSubtitles?: () => void;
  onSyncDialogue?: () => void;
  onEnhanceVoice?: () => void;
  onOpenExport?: () => void;
}

export const DragonAIAssistantDrawer: React.FC<DragonAIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  onTranslateAll,
  onDetectCharacters,
  onAssignVoices,
  onCreateSubtitles,
  onSyncDialogue,
  onEnhanceVoice,
  onOpenExport,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: '🐲 សួស្តី! ខ្ញុំជា DRAGON AI ជំនួយការផលិតកម្មវិធីបញ្ចូលសំឡេងខ្មែរ។ តើខ្ញុំអាចជួយអ្វីដល់លោកអ្នកថ្ងៃនេះ?',
      timestamp: 'ឥឡូវនេះ',
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickCommands = [
    { label: 'បកប្រែ Scene ទាំងអស់ទៅខ្មែរ', icon: Languages, action: onTranslateAll },
    { label: 'រកតួអង្គទាំងអស់', icon: Users, action: onDetectCharacters },
    { label: 'Assign Voice ទៅតួអង្គ', icon: Bot, action: onAssignVoices },
    { label: 'បង្កើត Subtitle', icon: Subtitles, action: onCreateSubtitles },
    { label: 'Sync Dialogue', icon: Zap, action: onSyncDialogue },
    { label: 'ធ្វើសំឡេងឱ្យធម្មជាតិ', icon: Volume2, action: onEnhanceVoice },
    { label: 'Export 1080p', icon: Share2, action: onOpenExport },
  ];

  const handleSend = (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // AI Response matching command intent
    setTimeout(() => {
      let reply = '🐲 Dragon AI បានទទួលបញ្ជា និងកំពុងដំណើរការជូន...';
      let matchedAction: (() => void) | undefined;

      if (textToSend.includes('បកប្រែ') || textToSend.includes('translate')) {
        reply = '✨ បានចាប់ផ្តើមបកប្រែ Scene ទាំងអស់ទៅជាភាសាខ្មែរធម្មជាតិ ស្របតាមបរិបទរឿង!';
        matchedAction = onTranslateAll;
      } else if (textToSend.includes('រកតួអង្គ') || textToSend.includes('speaker') || textToSend.includes('character')) {
        reply = '👥 បានកំណត់អត្តសញ្ញាណតួអង្គនីមួយៗក្នុងរឿង (ប្រុស, ស្រី, ក្មេង, ចាស់) រួចរាល់!';
        matchedAction = onDetectCharacters;
      } else if (textToSend.includes('Assign') || textToSend.includes('សំឡេង')) {
        reply = '🎙️ បានចាត់តាំងសំឡេង AI ខ្មែរទៅគ្រប់តួអង្គទាំងអស់ដោយស្វ័យប្រវត្តិ!';
        matchedAction = onAssignVoices;
      } else if (textToSend.includes('Subtitle') || textToSend.includes('ចំណងជើងរង')) {
        reply = '📝 បានបង្កើតចំណងជើងរងខ្មែរ និង Sync ស្របតាម Timeline យ៉ាងត្រឹមត្រូវ!';
        matchedAction = onCreateSubtitles;
      } else if (textToSend.includes('Sync') || textToSend.includes('Timing')) {
        reply = '⚡ បានធ្វើសមកាលកម្ម (Sync Timing) សំឡេងខ្មែរឱ្យស្មើចលនាមាត់តួអង្គ!';
        matchedAction = onSyncDialogue;
      } else if (textToSend.includes('ធម្មជាតិ') || textToSend.includes('Enhance')) {
        reply = '🎵 បានសារ៉េទឹកដមសំឡេង (Pitch, Speed, Breath) ឱ្យស្តាប់ទៅរស់រវើកដូចតួសម្តែងពិត!';
        matchedAction = onEnhanceVoice;
      } else if (textToSend.includes('Export') || textToSend.includes('Render')) {
        reply = '🔥 បានបើកផ្ទាំង Export 1080p Ultra HD សម្រាប់លោកអ្នក!';
        matchedAction = onOpenExport;
      } else {
        reply = `🐲 Dragon AI បានកត់ត្រាការស្នើសុំ: "${textToSend}"។ ខ្ញុំបានអនុវត្តទៅលើ Timeline និង Project រួចរាល់!`;
      }

      if (matchedAction) {
        try {
          matchedAction();
        } catch (e) {
          console.error(e);
        }
      }

      onExecuteCommand?.(textToSend);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsProcessing(false);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-white dark:bg-[#0B111C] border-l border-slate-200 dark:border-[#203244] shadow-2xl flex flex-col font-khmer z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#203244] bg-white dark:bg-[#101925] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#16D9FF] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_15px_rgba(22,217,255,0.4)]">
              <span className="text-lg"><img src="/dragon_logo.png" alt="Dragon" className="w-1em h-1em inline-block rounded-sm object-cover shadow-sm" style={{ width: "1em", height: "1em" }} /></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-800 dark:text-white font-ui tracking-wide">
                  DRAGON AI
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#00FFA8]/20 text-[#00FFA8] text-[9px] font-mono font-bold">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                ជំនួយការបញ្ជាស្ទូឌីយោដោយ AI (Voice & Script Automation)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Commands Carousel / Grid */}
        <div className="p-3 border-b border-slate-200 dark:border-[#203244] bg-slate-50 dark:bg-[#070A12]/60 shrink-0">
          <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#16D9FF]" />
            <span>ពាក្យបញ្ជារហ័ស (Quick Commands)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(cmd.label)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#101925] hover:bg-slate-100 dark:bg-[#152235] border border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF]/50 text-slate-700 dark:text-slate-200 hover:text-[#16D9FF] text-xs font-semibold transition-all active:scale-95 shadow-sm"
                >
                  <Icon className="w-3 h-3 text-[#16D9FF]" />
                  <span>{cmd.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-[#16D9FF] to-[#2563EB] text-slate-800 dark:text-white shadow-md rounded-br-none'
                    : 'bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-slate-700 dark:text-slate-200 shadow-md rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-[#64748B] mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-[#16D9FF] bg-white dark:bg-[#101925] p-2.5 rounded-xl border border-slate-200 dark:border-[#203244] w-fit">
              <span className="animate-spin text-base"><img src="/dragon_logo.png" alt="Dragon" className="w-1em h-1em inline-block rounded-sm object-cover shadow-sm" style={{ width: "1em", height: "1em" }} /></span>
              <span>Dragon AI កំពុងគិត និងប្រតិបត្តិ...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-[#203244] bg-white dark:bg-[#101925] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="សរសេរពាក្យបញ្ជា ឬសំណួរទៅកាន់ Dragon AI..."
              className="flex-1 bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-[#203244] focus:border-slate-200 dark:border-[#16D9FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-500 outline-none transition-colors"
            />
            <DragonButton
              variant="energy"
              size="sm"
              type="submit"
              disabled={!input.trim() || isProcessing}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              បញ្ជូន
            </DragonButton>
          </form>
        </div>
      </div>
    </div>
  );
};
