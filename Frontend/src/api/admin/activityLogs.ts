import { createError } from "../utils/http";
import type { AdminApiResponse } from "./types";

const unsupported = () =>
  createError("Admin activity logs are not supported by the current backend contract", "UNSUPPORTED");

export async function getAllActivityLogs(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getRecentLogs(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getUserActivityLogs(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getActivityStats(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getSecurityEvents(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}
