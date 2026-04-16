import type {
  ApiResponse,
  ShopItemResponse,
  ShopItemUpsertRequest,
} from "../types";
import { createError, request } from "../utils/http";

const buildShopItemFormData = (payload: ShopItemUpsertRequest): FormData => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("price", String(payload.price));
  formData.append("type", payload.type);

  if (payload.durationDays !== undefined && payload.durationDays !== null) {
    formData.append("durationDays", String(payload.durationDays));
  }

  if (payload.expMultiplier !== undefined && payload.expMultiplier !== null) {
    formData.append("expMultiplier", String(payload.expMultiplier));
  }

  if (payload.active !== undefined) {
    formData.append("active", String(payload.active));
  }

  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }

  if (payload.imageUrl) {
    formData.append("imageUrl", payload.imageUrl);
  }

  return formData;
};

export async function createShopItem(
  payload: ShopItemUpsertRequest,
): Promise<ApiResponse<ShopItemResponse>> {
  if (!payload.name?.trim()) {
    return createError("Item name is required", "VALIDATION_ERROR");
  }

  if (payload.price < 0) {
    return createError(
      "Price must be greater than or equal to 0",
      "VALIDATION_ERROR",
    );
  }

  if (!payload.type) {
    return createError("Item type is required", "VALIDATION_ERROR");
  }

  if (payload.type === "EXP") {
    if (!payload.durationDays || payload.durationDays <= 0) {
      return createError(
        "EXP item requires durationDays > 0",
        "VALIDATION_ERROR",
      );
    }

    if (!payload.expMultiplier || payload.expMultiplier <= 1) {
      return createError(
        "EXP item requires expMultiplier > 1.0",
        "VALIDATION_ERROR",
      );
    }
  }

  if (!payload.imageFile && !payload.imageUrl) {
    return createError("imageFile or imageUrl is required", "VALIDATION_ERROR");
  }
  console.log("Creating shop item with payload:", payload);
  return request<ShopItemResponse>("/shop-items", {
    method: "POST",
    body: buildShopItemFormData(payload),
  });
}

export async function updateShopItem(
  id: number,
  payload: ShopItemUpsertRequest,
): Promise<ApiResponse<ShopItemResponse>> {
  if (!id || id <= 0) {
    return createError("Invalid shop item id", "VALIDATION_ERROR");
  }

  if (!payload.name?.trim()) {
    return createError("Item name is required", "VALIDATION_ERROR");
  }

  if (payload.price < 0) {
    return createError(
      "Price must be greater than or equal to 0",
      "VALIDATION_ERROR",
    );
  }

  if (!payload.type) {
    return createError("Item type is required", "VALIDATION_ERROR");
  }

  if (payload.type === "EXP") {
    if (!payload.durationDays || payload.durationDays <= 0) {
      return createError(
        "EXP item requires durationDays > 0",
        "VALIDATION_ERROR",
      );
    }

    if (!payload.expMultiplier || payload.expMultiplier <= 1) {
      return createError(
        "EXP item requires expMultiplier > 1.0",
        "VALIDATION_ERROR",
      );
    }
  }

  return request<ShopItemResponse>(`/shop-items/${id}`, {
    method: "PUT",
    body: buildShopItemFormData(payload),
  });
}

export async function deleteShopItem(id: number): Promise<ApiResponse<string>> {
  if (!id || id <= 0) {
    return createError("Invalid shop item id", "VALIDATION_ERROR");
  }

  return request<string>(`/shop-items/${id}`, {
    method: "DELETE",
  });
}

export async function getShopItemByIdAdmin(
  id: number,
): Promise<ApiResponse<ShopItemResponse>> {
  if (!id || id <= 0) {
    return createError("Invalid shop item id", "VALIDATION_ERROR");
  }

  return request<ShopItemResponse>(`/shop-items/${id}`, {
    method: "GET",
  });
}

export async function getAllShopItemsAdmin(): Promise<
  ApiResponse<ShopItemResponse[]>
> {
  return request<ShopItemResponse[]>("/shop-items/all", {
    method: "GET",
  });
}
