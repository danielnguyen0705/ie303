import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Crown,
  DollarSign,
  Edit2,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/api";
import type {
  PaymentOffer,
  PaymentOfferType,
  PaymentOfferUpsertRequest,
} from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const emptyForm: PaymentOfferUpsertRequest = {
  name: "",
  description: "",
  type: "VIP",
  price: 0,
  coinAmount: null,
  durationDays: 30,
  active: true,
};

const offerTypeOptions: PaymentOfferType[] = ["VIP", "COIN"];

const formatDate = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export function PaymentOffers() {
  const [offers, setOffers] = useState<PaymentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PaymentOfferUpsertRequest>(emptyForm);
  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2200,
  });

  useEffect(() => {
    void loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);

    const response = await adminApi.getAllPaymentOffers();
    if (!response.success) {
      setError(response.error?.message || "Failed to load payment offers");
      setLoading(false);
      return;
    }

    setOffers(response.data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const activeCount = useMemo(
    () => offers.filter((offer) => offer.active).length,
    [offers],
  );

  const vipCount = useMemo(
    () => offers.filter((offer) => offer.type === "VIP").length,
    [offers],
  );

  const coinCount = useMemo(
    () => offers.filter((offer) => offer.type === "COIN").length,
    [offers],
  );

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      setError("Name is required");
      return;
    }

    if (form.price < 0) {
      setError("Price must be greater than or equal to 0");
      return;
    }

    if (form.type === "VIP") {
      if (!form.durationDays || form.durationDays <= 0) {
        setError("VIP offer requires durationDays > 0");
        return;
      }
      setForm((prev) => ({ ...prev, coinAmount: null }));
    }

    if (form.type === "COIN") {
      if (!form.coinAmount || form.coinAmount <= 0) {
        setError("COIN offer requires coinAmount > 0");
        return;
      }
      setForm((prev) => ({ ...prev, durationDays: null }));
    }

    setSubmitting(true);
    setError(null);

    const payload: PaymentOfferUpsertRequest = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      type: form.type,
      price: form.price,
      coinAmount: form.type === "COIN" ? (form.coinAmount ?? null) : null,
      durationDays: form.type === "VIP" ? (form.durationDays ?? null) : null,
      active: Boolean(form.active),
    };

    const response = editingId
      ? await adminApi.updatePaymentOffer(editingId, payload)
      : await adminApi.createPaymentOffer(payload);

    if (!response.success) {
      setError(response.error?.message || "Failed to save payment offer");
      setSubmitting(false);
      return;
    }

    const isEditing = Boolean(editingId);
    resetForm();
    await loadOffers();
    setSubmitting(false);

    popup.success({
      title: isEditing ? "Updated successfully" : "Created successfully",
      message: isEditing
        ? "Payment offer has been updated."
        : "Payment offer has been created.",
      description: response.data?.name
        ? `Offer: ${response.data.name}`
        : undefined,
    });
  };

  const handleEdit = (offer: PaymentOffer) => {
    setEditingId(offer.id);
    setForm({
      name: offer.name,
      description: offer.description || "",
      type: offer.type,
      price: offer.price,
      coinAmount: offer.coinAmount ?? null,
      durationDays: offer.durationDays ?? null,
      active: offer.active,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ẩn gói này? (soft delete: active=false)")) {
      return;
    }

    setSubmitting(true);
    const response = await adminApi.softDeletePaymentOffer(id);
    if (!response.success) {
      setError(response.error?.message || "Failed to delete offer");
      setSubmitting(false);
      return;
    }

    await loadOffers();
    setSubmitting(false);

    popup.success({
      title: "Deleted successfully",
      message: "Payment offer has been hidden from active usage.",
      description: `Offer ID: ${id}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading payment offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Payment Offer Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo và quản lý các gói nạp VIP / COIN.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOffers}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#155ca5]/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-[#155ca5]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Total Offers
              </p>
              <p className="text-2xl font-black">{offers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Coins className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Active Offers
              </p>
              <p className="text-2xl font-black">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                VIP / COIN
              </p>
              <p className="text-2xl font-black">
                {vipCount} / {coinCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-slate-900">
            {editingId ? `Update Offer #${editingId}` : "Create New Offer"}
          </h2>

          {editingId && (
            <button
              type="button"
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
            placeholder="Offer name"
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
            onChange={(e) => {
              const nextType = e.target.value as PaymentOfferType;
              setForm((prev) => ({
                ...prev,
                type: nextType,
                coinAmount: nextType === "COIN" ? prev.coinAmount : null,
                durationDays: nextType === "VIP" ? prev.durationDays : null,
              }));
            }}
            className="px-3 py-2 border border-slate-200 rounded-md"
          >
            {offerTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {form.type === "VIP" ? (
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
              min={1}
              placeholder="durationDays"
              className="px-3 py-2 border border-slate-200 rounded-md"
            />
          ) : (
            <input
              value={form.coinAmount ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  coinAmount:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              type="number"
              min={1}
              placeholder="coinAmount"
              className="px-3 py-2 border border-slate-200 rounded-md"
            />
          )}

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
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-5 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] disabled:opacity-50 inline-flex items-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {editingId ? "Update Offer" : "Create Offer"}
        </button>
      </section>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">All Payment Offers</h2>
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
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">
                    {offer.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm text-slate-900">
                      {offer.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[320px]">
                      {offer.description || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {offer.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">
                    {offer.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {offer.type === "VIP"
                      ? `${offer.durationDays ?? 0} days`
                      : `${(offer.coinAmount ?? 0).toLocaleString()} coins`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${offer.active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                    >
                      {offer.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(offer.updatedAt || offer.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(offer)}
                        className="inline-flex items-center gap-1 text-sm text-[#155ca5] font-bold hover:underline"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(offer.id)}
                        className="inline-flex items-center gap-1 text-sm text-red-600 font-bold hover:underline disabled:opacity-60"
                        disabled={submitting}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {offers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No payment offers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <NotificationPopup
        isOpen={popup.notification.isOpen}
        type={popup.notification.type}
        title={popup.notification.title}
        message={popup.notification.message}
        description={popup.notification.description}
        onClose={popup.close}
        onConfirm={popup.notification.onConfirm}
        confirmText={popup.notification.confirmText}
        cancelText={popup.notification.cancelText}
        showCancelButton={popup.notification.showCancelButton}
        autoClose={popup.notification.autoClose}
        autoCloseDuration={popup.notification.autoCloseDuration}
      />
    </div>
  );
}
