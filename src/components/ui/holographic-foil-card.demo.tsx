import { HolographicFoilCard } from "@/components/ui/holographic-foil-card";

export function HolographicCardDemo() {
  return (
    <div className="w-full flex items-center justify-center p-6">
      <HolographicFoilCard
        name="CRITICAL DEPLOY"
        set="WEBAPP POST-IT"
        number="001 / SPECIAL"
        tag="DEADLINE TODAY"
        content="Launch Post-it web application to GitHub Pages and sync with Google Sheets!"
      />
    </div>
  );
}

export default HolographicCardDemo;
