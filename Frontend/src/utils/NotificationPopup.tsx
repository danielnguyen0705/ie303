import React, { ReactNode } from "react";
import { CheckCircle2, Info, XCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationPopupProps {
  isOpen: boolean;
  type: NotificationType;
  title?: string;
  message: string | ReactNode;
  description?: string | ReactNode;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  autoClose?: boolean;
  autoCloseDuration?: number;
  className?: string;
}

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconShell: string;
    titleColor: string;
    bodyColor: string;
    accentBar: string;
    confirmButton: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconShell:
      "border-emerald-100 bg-emerald-50 text-emerald-600 shadow-[0_10px_30px_rgba(16,185,129,0.12)]",
    titleColor: "text-slate-900",
    bodyColor: "text-slate-600",
    accentBar:
      "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500",
    confirmButton:
      "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_16px_34px_rgba(34,197,94,0.28)] hover:from-emerald-600 hover:to-emerald-700",
  },
  error: {
    icon: XCircle,
    iconShell:
      "border-red-100 bg-red-50 text-red-600 shadow-[0_10px_30px_rgba(239,68,68,0.12)]",
    titleColor: "text-slate-900",
    bodyColor: "text-slate-600",
    accentBar: "bg-gradient-to-r from-red-500 via-red-400 to-red-500",
    confirmButton:
      "bg-gradient-to-b from-red-600 to-red-700 text-white shadow-[0_16px_34px_rgba(220,38,38,0.28)] hover:from-red-700 hover:to-red-800",
  },
  warning: {
    icon: AlertTriangle,
    iconShell:
      "border-amber-100 bg-amber-50 text-amber-600 shadow-[0_10px_30px_rgba(245,158,11,0.12)]",
    titleColor: "text-slate-900",
    bodyColor: "text-slate-600",
    accentBar: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500",
    confirmButton:
      "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_16px_34px_rgba(245,158,11,0.28)] hover:from-amber-600 hover:to-amber-700",
  },
  info: {
    icon: Info,
    iconShell:
      "border-blue-100 bg-blue-50 text-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.12)]",
    titleColor: "text-slate-900",
    bodyColor: "text-slate-600",
    accentBar: "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500",
    confirmButton:
      "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] hover:from-blue-700 hover:to-blue-800",
  },
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  type,
  title,
  message,
  description,
  onClose,
  onConfirm,
  confirmText,
  cancelText,
  showCancelButton = true,
  autoClose = false,
  autoCloseDuration = 3000,
  className,
}) => {
  const { copy } = useLanguage();
  const config = typeConfig[type];
  const Icon = config.icon;
  const resolvedConfirmText = confirmText ?? copy("Confirm", "Xác nhận");
  const resolvedCancelText = cancelText ?? copy("Cancel", "Hủy");
  const resolvedTitle =
    title ??
    copy(
      type === "success"
        ? "Success"
        : type === "error"
          ? "Error"
          : type === "warning"
            ? "Warning"
            : "Information",
      type === "success"
        ? "Thành công"
        : type === "error"
          ? "Thất bại"
          : type === "warning"
            ? "Cảnh báo"
            : "Thông báo",
    );
  const accessibleDescription =
    typeof description === "string"
      ? description
      : typeof message === "string"
        ? message
        : "Notification dialog";

  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(onClose, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, isOpen, onClose]);

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`z-[210] overflow-hidden rounded-[28px] border border-slate-100 bg-white p-0 shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:max-w-[520px] [&_[data-slot=dialog-close]]:hidden ${className}`}
      >
        <DialogDescription className="sr-only">
          {accessibleDescription}
        </DialogDescription>
        <div
          className={`absolute inset-x-0 bottom-0 h-1 ${config.accentBar}`}
        />

        <div className="relative px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${config.iconShell}`}
            >
              <Icon className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogHeader className="items-start text-left">
                <DialogTitle
                  className={`text-2xl font-bold tracking-[-0.03em] sm:text-[2rem] ${config.titleColor}`}
                >
                  {resolvedTitle}
                </DialogTitle>
              </DialogHeader>

              <div className={`mt-4 text-base leading-7 ${config.bodyColor}`}>
                {typeof message === "string" ? (
                  <p>{message}</p>
                ) : (
                  <div>{message}</div>
                )}

                {description && (
                  <div className="mt-2">
                    {typeof description === "string" ? (
                      <p>{description}</p>
                    ) : (
                      description
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(onConfirm || showCancelButton) && (
            <DialogFooter
              className={`mt-8 gap-3 ${showCancelButton && onConfirm ? "grid grid-cols-1 sm:grid-cols-2" : "flex"}`}
            >
              {showCancelButton && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-12 rounded-2xl border-0 bg-slate-100 px-6 text-base font-semibold text-slate-700 shadow-none hover:bg-slate-200 hover:text-slate-800"
                >
                  {resolvedCancelText}
                </Button>
              )}
              {onConfirm && (
                <Button
                  onClick={handleConfirm}
                  className={`h-12 rounded-2xl px-6 text-base font-semibold ${config.confirmButton} ${!showCancelButton ? "w-full" : ""}`}
                >
                  {resolvedConfirmText}
                </Button>
              )}
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPopup;
