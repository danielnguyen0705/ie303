interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  color?: "primary" | "success" | "secondary";
}

export function ProgressBar({
  value,
  max = 100,
  className = "",
  showLabel = true,
  label,
  color = "primary",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: "bg-[#155ca5]",
    success: "bg-[#27ae60]",
    secondary: "bg-[#f1c40f]",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm font-bold mb-2">
          <span>{label || "Progress"}</span>
          <span className="text-[#155ca5]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
