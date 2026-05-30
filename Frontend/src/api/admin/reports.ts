import { createError } from "../utils/http";
import type { AdminApiResponse } from "./types";
import { getUserActivity } from "./dashboard";

export { getUserActivity };

export async function getContentPerformance(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return createError("Content performance reports are not supported by the current backend contract", "UNSUPPORTED");
}

export async function getFinancialReport(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return createError("Financial reports are not supported by the current backend contract", "UNSUPPORTED");
}

export async function getEngagementMetrics(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return createError("Engagement reports are not supported by the current backend contract", "UNSUPPORTED");
}

export async function exportReport(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return createError("Report export is not supported by the current backend contract", "UNSUPPORTED");
}
