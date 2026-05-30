import { createError } from "../utils/http";
import type { AdminApiResponse } from "./types";

const unsupported = () =>
  createError("VIP management is not supported by the current backend contract", "UNSUPPORTED");

export async function getVIPStats(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getAllVIPUsers(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getVIPUser(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function upgradeUserToVIP(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function downgradeVIPUser(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getVIPRevenue(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getVIPRetention(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}
