import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Pin, 
  CheckCircle2, 
  Calendar
} from 'lucide-react';
import { PostItNote } from '@/types/post-it';
import { TiltSpotlightCard } from '@/components/ui/tilt-spotlight-card';
import confetti from 'canvas-confetti';

interface PostItCardProps {
  note: PostItNote;
  onEdit: (note: PostItNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

// Muji Minimalist Color Themes
const mujiThemes: Record<string, {
  bg: string;
  border: string;
  textColor: string;
  mutedText: string;
  tagBg: string;
  spotlight: string;
}> = {
  sand: {
    bg: 'bg-[#FAF8F4] dark:bg-[#24211F]',
    border: 'border-[#E6E0D4] dark:border-[#3A3633]',
    textColor: 'text-[#2D2824] dark:text-[#ECE9E4]',
    mutedText: 'text-[#7A756E] dark:text-[#9E9990]',
    tagBg: 'bg-[#EFECE5] text-[#59544D] dark:bg-[#2F2C2A] dark:text-[#C4C0B8]',
    spotlight: 'rgba(255, 255, 255, 0.4)',
  },
  kraft: {
    bg: 'bg-[#F3EADB] dark:bg-[#2A241F]',
    border: 'border-[#DFD3BE] dark:border-[#423932]',
    textColor: 'text-[#2E271F] dark:text-[#EFE7DC]',
    mutedText: 'text-[#7D6F5E] dark:text-[#A89A8A]',
    tagBg: 'bg-[#E5D9C5] text-[#594B3C] dark:bg-[#382F28] dark:text-[#D1C3B2]',
    spotlight: 'rgba(255, 255, 255, 0.35)',
  },
  sage: {
    bg: 'bg-[#EEF3ED] dark:bg-[#202521]',
    border: 'border-[#D9E3D7] dark:border-[#353D37]',
    textColor: 'text-[#242F26] dark:text-[#E4EBE5]',
    mutedText: 'text-[#6A786D] dark:text-[#90A193]',
    tagBg: 'bg-[#DEE8DC] text-[#445447] dark:bg-[#2C352E] dark:text-[#B6C7B9]',
    spotlight: 'rgba(255, 255, 255, 0.4)',
  },
  sky: {
    bg: 'bg-[#EEF3F7] dark:bg-[#1E2428]',
    border: 'border-[#D8E3EB] dark:border-[#323D44]',
    textColor: 'text-[#202B33] dark:text-[#E3EBF0]',
    mutedText: 'text-[#6B7985] dark:text-[#91A2B0]',
    tagBg: 'bg-[#DEE7EE] text-[#425260] dark:bg-[#2A343B] dark:text-[#B7C7D4]',
    spotlight: 'rgba(255, 255, 255, 0.4)',
  },
  clay: {
    bg: 'bg-[#F7EBE8] dark:bg-[#2A2120]',
    border: 'border-[#EAD5D0] dark:border-[#423432]',
    textColor: 'text-[#332220] dark:text-[#EFE5E3]',
    mutedText: 'text-[#856A67] dark:text-[#B0928E]',
    tagBg: 'bg-[#EAD9D5] text-[#5E4441] dark:bg-[#382A28] dark:text-[#D4BCB8]',
    spotlight: 'rgba(255, 255, 255, 0.35)',
  },
  ochre: {
    bg: 'bg-[#FAF2DF] dark:bg-[#29241B]',
    border: 'border-[#EDDFC0] dark:border-[#443B2B]',
    textColor: 'text-[#332917] dark:text-[#EFE5D0]',
    mutedText: 'text-[#857352] dark:text-[#AB9A78]',
    tagBg: 'bg-[#EFE2C5] text-[#5E4F32] dark:bg-[#383021] dark:text-[#D1C3A3]',
    spotlight: 'rgba(255, 255, 255, 0.4)',
  },
  charcoal: {
    bg: 'bg-[#2D2926] dark:bg-[#1A1817]',
    border: 'border-[#443E3B] dark:border-[#2C2927]',
    textColor: 'text-[#FAF8F5] dark:text-[#ECE9E4]',
    mutedText: 'text-[#A39D96] dark:text-[#807B75]',
    tagBg: 'bg-[#3E3835] text-[#D4CEC7] dark:bg-[#262322] dark:text-[#B5AFA8]',
    spotlight: 'rgba(255, 255, 255, 0.15)',
  },
};

// Map legacy color names to Muji palette
function resolveTheme(color: string) {
  if (mujiThemes[color]) return mujiThemes[color];
  if (color === 'yellow' || color === 'orange') return mujiThemes.ochre;
  if (color === 'green') return mujiThemes.sage;
  if (color === 'blue') return mujiThemes.sky;
  if (color === 'pink' || color === 'purple') return mujiThemes.clay;
  if (color === 'spotlight' || color === 'holographic') return mujiThemes.charcoal;
  return mujiThemes.sand;
}

export const PostItCard: React.FC<PostItCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleComplete,
}) => {
  const [copied, setCopied] = useState(false);
  const theme = resolveTheme(note.color);

  // One-click Copy Handler
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const textToCopy = `${note.title}\n\n${note.content}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleCompleteWithConfetti = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.isCompleted) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.85 },
      });
    }
    onToggleComplete(note.id);
  };

  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TiltSpotlightCard
      maxTilt={8}
      spotlightColor={theme.spotlight}
      className={`border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between min-h-[250px] ${theme.bg} ${theme.border}`}
    >
      <div>
        {/* Top Header: Category & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full tracking-tight ${theme.tagBg}`}>
              {note.category}
            </span>
            {note.isPinned && (
              <span title="ปักหมุดไว้บนสุด">
                <Pin className="w-3.5 h-3.5 fill-[#B45309] text-[#B45309] dark:fill-[#D97706] dark:text-[#D97706]" />
              </span>
            )}
          </div>

          {/* Minimal Action Toolbar */}
          <div className="flex items-center gap-0.5">
            {/* One-click Copy Button */}
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 ' + theme.mutedText
              }`}
              title="คัดลอกข้อความในคลิกเดียว"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Pin Toggle */}
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                note.isPinned ? 'text-[#B45309] dark:text-[#D97706]' : theme.mutedText
              }`}
              title={note.isPinned ? "ถอนหมุด" : "ปักหมุด"}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(note)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.mutedText}`}
              title="แก้ไข"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500/80 hover:text-rose-600 transition-colors"
              title="ลบ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Title (Clean modern typography) */}
        <h3 className={`font-semibold text-base mb-2 leading-snug tracking-tight ${theme.textColor}`}>
          {note.title}
        </h3>

        {/* Note Body (Crisp, highly legible Thai/English font) */}
        <p className={`text-sm leading-relaxed whitespace-pre-line break-words ${theme.textColor} ${note.isCompleted ? 'line-through opacity-40' : 'opacity-90'}`}>
          {note.content}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
        {/* Tags / Date */}
        <div className="flex flex-wrap items-center gap-1">
          {note.tags && note.tags.length > 0 ? (
            note.tags.map((tag) => (
              <span key={tag} className={`text-[11px] px-2 py-0.5 rounded-md ${theme.tagBg}`}>
                #{tag}
              </span>
            ))
          ) : (
            <span className={`text-[11px] flex items-center gap-1 ${theme.mutedText}`}>
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          )}
        </div>

        {/* Complete Toggle */}
        <button
          onClick={handleCompleteWithConfetti}
          className={`flex items-center gap-1 text-xs transition-colors ${
            note.isCompleted 
              ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
              : theme.mutedText + ' hover:text-[#2D2824] dark:hover:text-[#ECE9E4]'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${note.isCompleted ? 'fill-emerald-100 dark:fill-emerald-950' : ''}`} />
          <span>{note.isCompleted ? 'เสร็จสิ้น' : 'ทำเสร็จ'}</span>
        </button>
      </div>
    </TiltSpotlightCard>
  );
};
