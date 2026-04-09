import React, { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

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
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-900 dark:text-green-100",
    iconColor: "text-green-600 dark:text-green-400",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-900 dark:text-red-100",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-600 dark:text-blue-400",
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
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  showCancelButton = true,
  autoClose = false,
  autoCloseDuration = 3000,
  className,
}) => {
  const config = typeConfig[type];
  const Icon = config.icon;

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
      <DialogContent className={`sm:max-w-[425px] ${className}`}>
        <div
          className={`flex gap-4 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
        >
          <Icon className={`h-6 w-6 flex-shrink-0 ${config.iconColor}`} />
          <div className="flex-1">
            <DialogHeader>
              {title && (
                <DialogTitle className={config.textColor}>{title}</DialogTitle>
              )}
            </DialogHeader>

            <div className={`mt-2 ${config.textColor}`}>
              {typeof message === "string" ? (
                <p className="text-sm font-medium">{message}</p>
              ) : (
                <div className="text-sm font-medium">{message}</div>
              )}

              {description && (
                <div className="mt-2 text-sm opacity-90">
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
          <DialogFooter className="mt-6">
            {showCancelButton && (
              <Button variant="outline" onClick={onClose}>
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button
                onClick={handleConfirm}
                className={`${
                  type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : type === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : type === "warning"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPopup;
