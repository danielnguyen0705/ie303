import { useState, useCallback } from "react";
import { NotificationPopupProps, NotificationType } from "./NotificationPopup";

export interface UseNotificationPopupOptions {
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export interface NotificationParams {
  type?: NotificationType;
  title?: string;
  message: string;
  description?: string;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

interface NotificationState extends NotificationParams {
  isOpen: boolean;
}

export const useNotificationPopup = (
  defaultOptions?: UseNotificationPopupOptions,
) => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: "info",
    message: "",
  });

  const show = useCallback(
    (params: NotificationParams) => {
      setNotification({
        ...params,
        type: params.type || "info",
        isOpen: true,
        autoClose: params.autoClose ?? defaultOptions?.autoClose,
        autoCloseDuration:
          params.autoCloseDuration ?? defaultOptions?.autoCloseDuration,
      });
    },
    [defaultOptions],
  );

  const close = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const success = useCallback(
    (params: Omit<NotificationParams, "type">) => {
      show({ ...params, type: "success" });
    },
    [show],
  );

  const error = useCallback(
    (params: Omit<NotificationParams, "type">) => {
      show({ ...params, type: "error" });
    },
    [show],
  );

  const warning = useCallback(
    (params: Omit<NotificationParams, "type">) => {
      show({ ...params, type: "warning" });
    },
    [show],
  );

  const info = useCallback(
    (params: Omit<NotificationParams, "type">) => {
      show({ ...params, type: "info" });
    },
    [show],
  );

  return {
    notification: notification as NotificationPopupProps,
    show,
    close,
    success,
    error,
    warning,
    info,
  };
};
