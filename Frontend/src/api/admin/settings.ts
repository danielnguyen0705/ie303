import { createError } from "../utils/http";
import type { AdminApiResponse } from "./types";

const unsupported = () =>
  createError("System settings are not supported by the current backend contract", "UNSUPPORTED");

export async function getSystemSettings(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function updateSystemSettings(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function resetSettings(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}

export async function getPublicSettings(..._args: unknown[]): Promise<AdminApiResponse<any>> {
  return unsupported();
}
