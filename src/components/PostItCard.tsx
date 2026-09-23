import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Pin, 
  CheckCircle2, 
  Calendar,
  LayoutGrid,
  GripVertical
} from 'lucide-react';
import { PostItNote } from '@/types/post-it';
import { TiltSpotlightCard } from '@/components/ui/tilt-spotlight-card';
import { copyTextToClipboard } from '@/lib/clipboard';
import confetti from 'canvas-confetti';

export interface PostItCardProps {
  note: PostItNote;
  onEdit: (note: PostItNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onStartDrag?: (note: PostItNote, clientX: number, clientY: number, rect: DOMRect) => void;
  isDraggingThis?: boolean;
  isDropTarget?: boolean;
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
    spotlight: 'rgba(255, 255, 255, 0.45)',
  },
  kraft: {
    bg: 'bg-[#F3EADB] dark:bg-[#2A241F]',
    border: 'border-[#DFD3BE] dark:border-[#423932]',
    textColor: 'text-[#2E271F] dark:text-[#EFE7DC]',
    mutedText: 'text-[#7D6F5E] dark:text-[#A89A8A]',
    tagBg: 'bg-[#E5D9C5] text-[#594B3C] dark:bg-[#382F28] dark:text-[#D1C3B2]',
    spotlight: 'rgba(255, 255, 255, 0.4)',
  },
  sage: {
    bg: 'bg-[#EEF3ED] dark:bg-[#202521]',
    border: 'border-[#D9E3D7] dark:border-[#353D37]',
    textColor: 'text-[#242F26] dark:text-[#E4EBE5]',
    mutedText: 'text-[#6A786D] dark:text-[#90A193]',
    tagBg: 'bg-[#DEE8DC] text-[#445447] dark:bg-[#2C352E] dark:text-[#B6C7B9]',
    spotlight: 'rgba(255, 255, 255, 0.45)',
  },
  sky: {
    bg: 'bg-[#EEF3F7] dark:bg-[#1E2428]',
    border: 'border-[#D8E3EB] dark:border-[#323D44]',
    textColor: 'text-[#202B33] dark:text-[#E3EBF0]',
    mutedText: 'text-[#6B7985] dark:text-[#91A2B0]',
    tagBg: 'bg-[#DEE7EE] text-[#425260] dark:bg-[#2A343B] dark:text-[#B7C7D4]',
    spotlight: 'rgba(255, 255, 255, 0.45)',
  },
  clay: {
    bg: 'bg-[#F7EBE8] dark:bg-[#2A2120]',
    border: 'border-[#EAD5D0] dark:border-[#423432]',
    textColor: 'text-[#332220] dark:text-[#EFE5E3]',
    mutedText: 'text-[#856A67] dark:text-[#B0928E]',
    tagBg: 'bg-[#EAD9D5] text-[#5E4441] dark:bg-[#382A28] dark:text-[#D4BCB8]',
    spotlight: 'rgba(255, 255, 255, 0.4)',
  },
  ochre: {
    bg: 'bg-[#FAF2DF] dark:bg-[#29241B]',
    border: 'border-[#EDDFC0] dark:border-[#443B2B]',
    textColor: 'text-[#332917] dark:text-[#EFE5D0]',
    mutedText: 'text-[#857352] dark:text-[#AB9A78]',
    tagBg: 'bg-[#EFE2C5] text-[#5E4F32] dark:bg-[#383021] dark:text-[#D1C3A3]',
    spotlight: 'rgba(255, 255, 255, 0.45)',
  },
  charcoal: {
    bg: 'bg-[#2D2926] dark:bg-[#1A1817]',
    border: 'border-[#443E3B] dark:border-[#2C2927]',
    textColor: 'text-[#FAF8F5] dark:text-[#ECE9E4]',
    mutedText: 'text-[#A39D96] dark:text-[#807B75]',
    tagBg: 'bg-[#3E3835] text-[#D4CEC7] dark:bg-[#262322] dark:text-[#B5AFA8]',
    spotlight: 'rgba(255, 255, 255, 0.2)',
  },
};

function resolveTheme(color: string) {
  if (mujiThemes[color]) return mujiThemes[color];
  if (color === 'yellow' || color === 'orange') return mujiThemes.ochre;
  if (color === 'green') return mujiThemes.sage;
  if (color === 'blue') return mujiThemes.sky;
  if (color === 'pink' || color === 'purple') return mujiThemes.clay;
  if (color === 'spotlight' || color === 'holographic') return mujiThemes.charcoal;
  return mujiThemes.sand;
}

// Floating Drag Preview (Cloned card that attaches to cursor)
export const PostItCardPreview: React.FC<{ note: PostItNote }> = ({ note }) => {
  const theme = resolveTheme(note.color);
  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className={`border rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[200px] sm:min-h-[220px] ${theme.bg} ${theme.border} pointer-events-none select-none`}
    >
      <div>
        <div className="flex items-center gap-1.5 text-xs mb-3">
          <span className={`font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 tracking-tight ${theme.tagBg}`}>
            <LayoutGrid className="w-3 h-3 opacity-70" />
            <span>{note.book || 'ทั่วไป'}</span>
          </span>
          <span className="text-[#8A857D] dark:text-[#8C8780] font-normal">›</span>
          <span className={`font-semibold px-2.5 py-1 rounded-xl tracking-tight ${theme.tagBg}`}>
            {note.category}
          </span>
          {note.isPinned && (
            <Pin className="w-3.5 h-3.5 fill-[#B45309] text-[#B45309] dark:fill-[#D97706] dark:text-[#D97706]" />
          )}
        </div>
        <h3 className={`font-bold text-base sm:text-lg mb-2 leading-snug tracking-tight ${theme.textColor}`}>
          {note.title}
        </h3>
        <p className={`text-sm sm:text-base leading-relaxed line-clamp-4 ${theme.textColor} opacity-90`}>
          {note.content}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs sm:text-sm">
        <span className={`text-xs flex items-center gap-1.5 ${theme.mutedText}`}>
          <Calendar className="w-3.5 h-3.5" /> {formattedDate}
        </span>
        <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500 text-amber-950 flex items-center gap-1 shadow-sm">
          <GripVertical className="w-3.5 h-3.5" /> ย้ายตำแหน่ง
        </span>
      </div>
    </div>
  );
};

export const PostItCard: React.FC<PostItCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleComplete,
  onStartDrag,
  isDraggingThis = false,
  isDropTarget = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const pressStartTime = useRef<number>(0);
  const pressStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const cardElementRef = useRef<HTMLDivElement>(null);

  const HOLD_DURATION_MS = 350;
  const theme = resolveTheme(note.color);
  const latestPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Perform Copy of content only (or fallback to title if content is empty)
  const triggerCopy = async () => {
    const textToCopy = note.content.trim() || note.title.trim();
    if (!textToCopy) return;

    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleCopyButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerCopy();
  };

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary button

    didDragRef.current = false;
    pressStartTime.current = Date.now();
    pressStartPos.current = { x: e.clientX, y: e.clientY };
    latestPointerPos.current = { x: e.clientX, y: e.clientY };
    setIsPressing(true);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    holdTimerRef.current = window.setTimeout(() => {
      didDragRef.current = true;
      setIsPressing(false);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {}
      }

      if (cardElementRef.current && onStartDrag) {
        const rect = cardElementRef.current.getBoundingClientRect();
        onStartDrag(note, latestPointerPos.current.x, latestPointerPos.current.y, rect);
      }
    }, HOLD_DURATION_MS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    latestPointerPos.current = { x: e.clientX, y: e.clientY };
    if (!pressStartPos.current) return;
    const dx = Math.abs(e.clientX - pressStartPos.current.x);
    const dy = Math.abs(e.clientY - pressStartPos.current.y);

    // If pointer moves more than 12px before 350ms, user is scrolling or flicking, cancel hold
    if (dx > 12 || dy > 12) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsPressing(false);
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsPressing(false);

    const elapsed = Date.now() - pressStartTime.current;
    // If released quickly (< 350ms) without triggering drag: normal quick click to copy!
    if (!didDragRef.current && elapsed > 0 && elapsed < 350) {
      triggerCopy();
    }
    pressStartPos.current = null;
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsPressing(false);
    pressStartPos.current = null;
  };

  const handleCompleteWithConfetti = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.isCompleted) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
    onToggleComplete(note.id);
  };

  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });

  // Placeholder when this card is currently being dragged around the screen
  if (isDraggingThis) {
    return (
      <div 
        ref={cardElementRef}
        data-note-id={note.id}
        className="border-2 border-dashed border-amber-500/60 dark:border-amber-400/50 bg-amber-500/10 dark:bg-amber-400/5 rounded-3xl min-h-[200px] sm:min-h-[220px] transition-all flex flex-col items-center justify-center scale-95 opacity-50 select-none"
      >
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 animate-pulse">
          กำลังย้ายตำแหน่ง...
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={cardElementRef}
      data-note-id={note.id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      title="คลิกเพื่อคัดลอก | กดค้างไว้เพื่อลากจัดตำแหน่ง"
      className={`group relative transition-all duration-150 select-none cursor-grab active:cursor-grabbing ${
        isPressing ? 'scale-[0.98] opacity-90' : ''
      }`}
    >
      {/* Drop Target Highlight */}
      {isDropTarget && (
        <div className="absolute -inset-1.5 z-40 rounded-[28px] border-2 border-amber-500 bg-amber-500/20 pointer-events-none animate-fadeIn flex items-center justify-center shadow-lg">
          <div className="px-3.5 py-1.5 rounded-full bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] text-xs font-bold shadow-md flex items-center gap-1.5 animate-bounce">
            <GripVertical className="w-3.5 h-3.5 text-amber-400" />
            <span>วางที่นี่</span>
          </div>
        </div>
      )}

      {/* Copied Floating Badge */}
      {copied && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 stroke-[3]" />
          <span>คัดลอกเนื้อหาแล้ว!</span>
        </div>
      )}

      <TiltSpotlightCard
        maxTilt={isPressing ? 0 : 5}
        spotlightColor={theme.spotlight}
        className={`border rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between min-h-[200px] sm:min-h-[220px] ${theme.bg} ${theme.border} group-hover:border-black/20 dark:group-hover:border-white/20`}
      >
        <div>
          {/* Top Header: Book > Category & Action Buttons */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Book > Category Hierarchy */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              <span className={`font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 tracking-tight ${theme.tagBg}`}>
                <LayoutGrid className="w-3 h-3 opacity-70" />
                <span>{note.book || 'ทั่วไป'}</span>
              </span>
              <span className="text-[#8A857D] dark:text-[#8C8780] font-normal">›</span>
              <span className={`font-semibold px-2.5 py-1 rounded-xl tracking-tight ${theme.tagBg}`}>
                {note.category}
              </span>
              {note.isPinned && (
                <span title="ปักหมุดไว้บนสุด" className="p-0.5">
                  <Pin className="w-3.5 h-3.5 fill-[#B45309] text-[#B45309] dark:fill-[#D97706] dark:text-[#D97706]" />
                </span>
              )}
            </div>

            {/* Action Toolbar (Clicking here will NOT copy or trigger drag) */}
            <div 
              className="flex items-center gap-1" 
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* One-click Copy Button */}
              <button
                type="button"
                onClick={handleCopyButton}
                onPointerDown={(e) => e.stopPropagation()}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold scale-105'
                    : 'hover:bg-black/5 dark:hover:bg-white/10 ' + theme.mutedText
                }`}
                title="คัดลอกเฉพาะเนื้อหา"
              >
                {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Pin Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                  note.isPinned ? 'text-[#B45309] dark:text-[#D97706]' : theme.mutedText
                }`}
                title={note.isPinned ? "ถอนหมุด" : "ปักหมุด"}
              >
                <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.mutedText}`}
                title="แก้ไข"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-rose-500/10 text-rose-500/80 hover:text-rose-600 transition-colors"
                title="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Note Title */}
          <h3 className={`font-bold text-base sm:text-lg mb-2 leading-snug tracking-tight ${theme.textColor}`}>
            {note.title}
          </h3>

          {/* Note Body */}
          <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line break-words ${theme.textColor} ${note.isCompleted ? 'line-through opacity-40' : 'opacity-90'}`}>
            {note.content}
          </p>
        </div>

        {/* Card Footer: Date, Tags & Complete Toggle */}
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Tags / Date */}
          <div className="flex flex-wrap items-center gap-1.5">
            {note.tags && note.tags.length > 0 ? (
              note.tags.map((tag) => (
                <span key={tag} className={`text-xs px-2 py-0.5 rounded-lg font-medium ${theme.tagBg}`}>
                  #{tag}
                </span>
              ))
            ) : (
              <span className={`text-xs flex items-center gap-1.5 ${theme.mutedText}`}>
                <Calendar className="w-3.5 h-3.5" /> {formattedDate}
              </span>
            )}
          </div>

          {/* Complete Toggle */}
          <button
            type="button"
            onClick={handleCompleteWithConfetti}
            onPointerDown={(e) => e.stopPropagation()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm transition-all ${
              note.isCompleted 
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold' 
                : theme.mutedText + ' hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#2D2824] dark:hover:text-[#ECE9E4]'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${note.isCompleted ? 'fill-emerald-200 dark:fill-emerald-800' : ''}`} />
            <span>{note.isCompleted ? 'เสร็จสิ้น' : 'ทำเสร็จ'}</span>
          </button>
        </div>
      </TiltSpotlightCard>
    </div>
  );
};
