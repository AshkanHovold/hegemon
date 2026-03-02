import GameIcon from "./GameIcon";

interface ResourceBarProps {
  iconName: string;
  label: string;
  value: string;
  colorClass: string;
}

export default function ResourceBar({
  iconName,
  label,
  value,
  colorClass,
}: ResourceBarProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-gray-900/80 border border-gray-800 px-3 py-1 text-sm">
      <GameIcon name={iconName} size={18} />
      <span className="text-gray-500 hidden lg:inline">{label}</span>
      <span className={`font-semibold tabular-nums ${colorClass}`}>{value}</span>
    </div>
  );
}
