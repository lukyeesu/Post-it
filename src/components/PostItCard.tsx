import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Pin, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Tag
} from 'lucide-react';
import { PostItNote } from '@/types/post-it';
import { GlowCard } from '@/components/ui/spotlight-card';
import { HolographicFoilCard } from '@/components/ui/holographic-foil-card';
import confetti from 'canvas-confetti';

interface PostItCardProps {
  note: PostItNote;
  onEdit: (note: PostItNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const colorStyles: Record<string, {
  bg: string;
  tapeBg: string;
  border: string;
  textColor: string;
  tagBg: string;
}> = {
  yellow: {
    bg: 'bg-amber-100 dark:bg-amber-950/80',
    tapeBg: 'bg-amber-300/60',
    border: 'border-amber-200 dark:border-amber-800/60',
    textColor: 'text-amber-950 dark:text-amber-100',
    tagBg: 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200',
  },
  green: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/80',
    tapeBg: 'bg-emerald-300/60',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    tagBg: 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  blue: {
    bg: 'bg-sky-100 dark:bg-sky-950/80',
    tapeBg: 'bg-sky-300/60',
    border: 'border-sky-200 dark:border-sky-800/60',
    textColor: 'text-sky-950 dark:text-sky-100',
    tagBg: 'bg-sky-200/80 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950/80',
    tapeBg: 'bg-purple-300/60',
    border: 'border-purple-200 dark:border-purple-800/60',
    textColor: 'text-purple-950 dark:text-purple-100',
    tagBg: 'bg-purple-200/80 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200',
  },
  pink: {
    bg: 'bg-rose-100 dark:bg-rose-950/80',
    tapeBg: 'bg-rose-300/60',
    border: 'border-rose-200 dark:border-rose-800/60',
    textColor: 'text-rose-950 dark:text-rose-100',
    tagBg: 'bg-rose-200/80 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-950/80',
    tapeBg: 'bg-orange-300/60',
    border: 'border-orange-200 dark:border-orange-800/60',
    textColor: 'text-orange-950 dark:text-orange-100',
    tagBg: 'bg-orange-200/80 text-orange-900 dark:bg-orange-900/60 dark:text-orange-200',
  },
};

export const PostItCard: React.FC<PostItCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleComplete,
}) => {
  const [copied, setCopied] = useState(false);

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
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    onToggleComplete(note.id);
  };

  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });

  // 1. Holographic Foil Card Rendering
  if (note.color === 'holographic') {
    return (
      <div className="relative group w-full flex justify-center">
        {/* Quick Action Floating Bar */}
        <div className="absolute top-2 right-4 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
            title="คัดลอกข้อความ (One-click Copy)"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onTogglePin(note.id)}
            className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
            title={note.isPinned ? "ถอนหมุด" : "ปักหมุด"}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
            title="แก้ไข"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded hover:bg-rose-500/40 text-rose-300 transition-colors"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <HolographicFoilCard
          name={note.title}
          set={note.category.toUpperCase()}
          number={formattedDate}
          tag="HOLO VIP"
        >
          <div className="flex flex-col flex-1 my-2 justify-between">
            <div className="p-3 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase">
                  ✦ {note.category} ✦
                </span>
                {note.isPinned && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                    <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white line-clamp-1 mb-1">{note.title}</h3>
              <p className={`font-handwriting text-lg text-zinc-100 whitespace-pre-line line-clamp-5 ${note.isCompleted ? 'line-through opacity-60' : ''}`}>
                {note.content}
              </p>
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.map((tag) => (
                  <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </HolographicFoilCard>
      </div>
    );
  }

  // 2. Spotlight Card (GlowCard) Rendering
  if (note.color === 'spotlight') {
    return (
      <div className="relative group w-full flex justify-center">
        <GlowCard 
          glowColor={note.glowColor || 'purple'} 
          customSize={true}
          className="w-full min-h-[300px] flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono tracking-wider text-purple-300 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {note.category}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-white/10 text-white/80 transition-colors"
                  title="คัดลอกข้อความ"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onTogglePin(note.id)}
                  className="p-1 rounded hover:bg-white/10 text-white/80 transition-colors"
                  title={note.isPinned ? "ถอนหมุด" : "ปักหมุด"}
                >
                  <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                <button
                  onClick={() => onEdit(note)}
                  className="p-1 rounded hover:bg-white/10 text-white/80 transition-colors"
                  title="แก้ไข"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  className="p-1 rounded hover:bg-rose-500/30 text-rose-300 transition-colors"
                  title="ลบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Title & Content */}
            <h3 className="font-bold text-lg text-white mb-2 leading-snug">{note.title}</h3>
            <p className={`font-handwriting text-xl text-zinc-200 whitespace-pre-line leading-relaxed ${note.isCompleted ? 'line-through opacity-50' : ''}`}>
              {note.content}
            </p>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <div className="flex flex-wrap gap-1">
              {note.tags?.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                  #{tag}
                </span>
              ))}
            </div>
            <button
              onClick={handleCompleteWithConfetti}
              className="flex items-center gap-1 hover:text-white"
            >
              <CheckCircle2 className={`w-4 h-4 ${note.isCompleted ? 'text-emerald-400' : 'text-white/40'}`} />
              <span>{note.isCompleted ? 'เสร็จสิ้น' : 'ทำเสร็จ'}</span>
            </button>
          </div>
        </GlowCard>
      </div>
    );
  }

  // 3. Classic Realistic Post-it Note
  const theme = colorStyles[note.color] || colorStyles.yellow;

  return (
    <div 
      className={`group relative rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border flex flex-col justify-between min-h-[280px] ${theme.bg} ${theme.border} transform hover:-translate-y-1`}
    >
      {/* Tape Decoration on Top */}
      <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-sm shadow-sm opacity-70 backdrop-blur-xs ${theme.tapeBg} transform -rotate-1`} />

      <div>
        {/* Top Header: Category, Pin Badge & Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${theme.tagBg}`}>
              {note.category}
            </span>
            {note.isPinned && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </span>
            )}
          </div>

          {/* Actions toolbar */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* One-click Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition-all active:scale-90"
              title="คัดลอกข้อความทันที (One-click Copy)"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                </span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Pin Button */}
            <button
              onClick={() => onTogglePin(note.id)}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition-colors"
              title={note.isPinned ? "ถอนหมุด" : "ปักหมุดไว้บนสุด"}
            >
              <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition-colors"
              title="แก้ไขโพสต์อิท"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
              title="ลบโพสต์อิท"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-bold text-lg mb-2 leading-snug tracking-tight ${theme.textColor}`}>
          {note.title}
        </h3>

        {/* Content with handwriting font */}
        <p className={`font-handwriting text-2xl leading-snug whitespace-pre-line break-words ${theme.textColor} ${note.isCompleted ? 'line-through opacity-50' : ''}`}>
          {note.content}
        </p>
      </div>

      {/* Card Footer: Date, Tags & Complete Toggle */}
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1">
          {note.tags && note.tags.length > 0 ? (
            note.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-medium text-zinc-600 dark:text-zinc-300">
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          )}
        </div>

        {/* Complete Checkbox */}
        <button
          onClick={handleCompleteWithConfetti}
          className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
        >
          <CheckCircle2 className={`w-4 h-4 ${note.isCompleted ? 'text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950' : 'text-zinc-400'}`} />
          <span>{note.isCompleted ? 'เสร็จแล้ว' : 'ทำเสร็จ'}</span>
        </button>
      </div>
    </div>
  );
};
