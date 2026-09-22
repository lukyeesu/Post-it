import { GlowCard } from "@/components/ui/spotlight-card";

export function SpotlightCardDemo() {
  return (
    <div className="w-full py-8 flex flex-wrap items-center justify-center gap-6">
      <GlowCard glowColor="blue" size="sm">
        <div className="flex flex-col justify-between h-full text-white">
          <span className="text-xs font-mono text-blue-300">#WORK</span>
          <p className="font-semibold text-sm">Meeting with Client at 2 PM</p>
          <span className="text-xs text-white/60">Glow Spotlight Blue</span>
        </div>
      </GlowCard>
      <GlowCard glowColor="purple" size="sm">
        <div className="flex flex-col justify-between h-full text-white">
          <span className="text-xs font-mono text-purple-300">#IDEA</span>
          <p className="font-semibold text-sm">Brainstorming App Architecture</p>
          <span className="text-xs text-white/60">Glow Spotlight Purple</span>
        </div>
      </GlowCard>
      <GlowCard glowColor="orange" size="sm">
        <div className="flex flex-col justify-between h-full text-white">
          <span className="text-xs font-mono text-orange-300">#TODO</span>
          <p className="font-semibold text-sm">Deploy v1.0 to GitHub Pages</p>
          <span className="text-xs text-white/60">Glow Spotlight Orange</span>
        </div>
      </GlowCard>
    </div>
  );
}

export default SpotlightCardDemo;
