import { createError } from "../utils/http";
import type { AdminApiResponse } from "./types";

const unsupported = () =>
  createError("Admin notifications are not supported by the current backend contract", "UNSUPPORTED");

export async function getNotificationHistory(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function createNotification(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function sendNotification(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function scheduleNotification(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function deleteNotification(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getNotificationStats(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}
