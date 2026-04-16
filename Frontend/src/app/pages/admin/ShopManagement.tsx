import { useEffect, useRef, useState } from "react";
import { Edit, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/api";
import type {
  ShopItemResponse,
  ShopItemType,
  ShopItemUpsertRequest,
} from "@/api/types";

const ITEM_TYPES: ShopItemType[] = [
  "SKIP",
  "VIP",
  "AVATAR",
  "BACKGROUND",
  "EXP",
];

const emptyForm: ShopItemUpsertRequest = {
  name: "",
  description: "",
  price: 0,
  type: "SKIP",
  durationDays: null,
  expMultiplier: null,
  active: true,
  imageUrl: "",
};

export function ShopManagement() {
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<ShopItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItemResponse | null>(
    null,
  );
  const [form, setForm] = useState<ShopItemUpsertRequest>(emptyForm);

  useEffect(() => {
    void loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    const response = await adminApi.getAllShopItemsAdmin();
    if (!response.success) {
      setError(response.error?.message || "Failed to load shop items");
      setLoading(false);
      return;
    }

    setItems(response.data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      setError("Name is required");
      return;
    }

    if (!form.imageFile && !form.imageUrl) {
      setError("imageFile hoặc imageUrl là bắt buộc");
      return;
    }

    if (form.type === "EXP") {
      if (!form.durationDays || form.durationDays <= 0) {
        setError("EXP item cần durationDays > 0");
        return;
      }

      if (!form.expMultiplier || form.expMultiplier <= 1) {
        setError("EXP item cần expMultiplier > 1.0");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const response = editingId
      ? await adminApi.updateShopItem(editingId, form)
      : await adminApi.createShopItem(form);

    if (!response.success) {
      setError(response.error?.message || "Failed to save shop item");
      setSubmitting(false);
      return;
    }

    resetForm();
    await loadItems();
    setSubmitting(false);
  };

  const handleEdit = (item: ShopItemResponse) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      type: item.type,
      durationDays: item.durationDays,
      expMultiplier: item.expMultiplier,
      active: item.active,
      imageUrl: item.imageUrl || "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ẩn item này? (soft delete active=false)")) {
      return;
    }

    setSubmitting(true);
    const response = await adminApi.deleteShopItem(id);
    if (!response.success) {
      setError(response.error?.message || "Failed to delete item");
      setSubmitting(false);
      return;
    }

    await loadItems();
    setSubmitting(false);
  };

  const handleViewDetail = async (id: number) => {
    const response = await adminApi.getShopItemByIdAdmin(id);
    if (!response.success) {
      setError(response.error?.message || "Failed to load item detail");
      return;
    }

    setSelectedItem(response.data || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">
            Loading shop management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Shop Item Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            {editingId ? `Update Item #${editingId}` : "Create New Item"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Name"
            className="px-3 py-2 border border-slate-200 rounded-md"
          />
          <input
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                price: Number(e.target.value) || 0,
              }))
            }
            type="number"
            min={0}
            placeholder="Price"
            className="px-3 py-2 border border-slate-200 rounded-md"
          />
          <select
            value={form.type}
            onChange={(e) =>
              setForm((prev) => {
                const nextType = e.target.value as ShopItemType;
                return {
                  ...prev,
                  type: nextType,
                  durationDays:
                    nextType === "VIP" || nextType === "EXP"
                      ? prev.durationDays
                      : null,
                  expMultiplier: nextType === "EXP" ? prev.expMultiplier : null,
                };
              })
            }
            className="px-3 py-2 border border-slate-200 rounded-md"
          >
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {(form.type === "VIP" || form.type === "EXP") && (
            <input
              value={form.durationDays ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  durationDays:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              type="number"
              min={0}
              placeholder={`durationDays (${form.type} only)`}
              className="px-3 py-2 border border-slate-200 rounded-md"
            />
          )}
          {form.type === "EXP" && (
            <input
              value={form.expMultiplier ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  expMultiplier:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              type="number"
              min={1.01}
              step="0.01"
              placeholder="expMultiplier (> 1.0)"
              className="px-3 py-2 border border-slate-200 rounded-md"
            />
          )}
          <div className="md:col-span-2 space-y-1">
            <div className="relative">
              <input
                value={form.imageUrl || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                placeholder="imageUrl"
                className="w-full px-3 pr-24 py-2 border border-slate-200 rounded-md"
              />
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    imageFile: e.target.files?.[0],
                  }))
                }
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200"
              >
                Select
              </button>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {form.imageFile
                ? `Selected file: ${form.imageFile.name}`
                : "Chưa chọn file ảnh"}
            </p>
          </div>
          <textarea
            value={form.description || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Description"
            className="px-3 py-2 border border-slate-200 rounded-md md:col-span-2"
            rows={3}
          />
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={Boolean(form.active)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Active
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-5 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] disabled:opacity-50 inline-flex items-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {editingId ? "Update Item" : "Create Item"}
        </button>
      </section>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">
            All Items (including inactive)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  Active
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono">{item.id}</td>
                  <td className="px-4 py-3 text-sm font-bold">{item.name}</td>
                  <td className="px-4 py-3 text-sm">{item.type}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${item.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {item.active ? "ACTIVE" : "HIDDEN"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="p-2 rounded hover:bg-slate-100"
                        title="View detail"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded hover:bg-red-50"
                        title="Soft delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedItem && (
        <section className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900">
              Item Detail #{selectedItem.id}
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto">
            {JSON.stringify(selectedItem, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
