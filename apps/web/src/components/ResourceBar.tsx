interface ResourceBarProps {
  icon: string;
  label: string;
  value: string;
  colorClass: string;
}

export default function ResourceBar({
  icon,
  label,
  value,
  colorClass,
}: ResourceBarProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full bg-gray-900 border border-gray-800 px-3 py-1 text-sm`}
    >
      <span className="text-base">{icon}</span>
      <span className="text-gray-500 hidden lg:inline">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}
