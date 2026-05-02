import { Loader2 } from "lucide-react";

interface Props {
  text?: string;
}

export function LoadingState({ text = "Loading..." }: Props) {
  return (
    <div className="w-full flex items-center justify-center min-h-[240px]">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#155ca5] mx-auto" />
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}