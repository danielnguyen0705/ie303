import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Edit3,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Target,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/api";
import type {
  QuestPeriod,
  QuestTemplate,
  QuestTemplateType,
  QuestTemplateUpsertRequest,
} from "@/api/admin/types";
import type { ShopItemType } from "@/api/types";

type QuestTemplateForm = Omit<QuestTemplateUpsertRequest, "rewardItemType"> & {
  rewardItemType: ShopItemType | "";
};

const QUEST_PERIOD_OPTIONS: Array<{
  value: QuestPeriod;
  label: string;
  description: string;
}> = [
  {
    value: "DAILY",
    label: "Daily",
    description: "Refreshes every day.",
  },
  {
    value: "WEEKLY",
    label: "Weekly",
    description: "Refreshes every Monday.",
  },
];

const QUEST_TYPE_OPTIONS: Array<{
  value: QuestTemplateType;
  label: string;
}> = [
  { value: "LESSON_COMPLETION", label: "Lesson completion" },
  { value: "QUESTION_ANSWERING", label: "Question answering" },
  { value: "SKIP_USAGE", label: "Skip usage" },
];

const ITEM_TYPE_OPTIONS: Array<{ value: ShopItemType; label: string }> = [
  { value: "SKIP", label: "SKIP" },
  { value: "VIP", label: "VIP" },
  { value: "AVATAR", label: "AVATAR" },
  { value: "BACKGROUND", label: "BACKGROUND" },
  { value: "EXP", label: "EXP" },
];

const emptyForm: QuestTemplateForm = {
  questPeriod: "DAILY",
  questType: "LESSON_COMPLETION",
  title: "",
  description: "",
  targetAmount: 2,
  coinsReward: 60,
  expReward: 120,
  rewardItemType: "SKIP",
  rewardItemQuantity: 1,
  sortOrder: 1,
  active: true,
};

export function QuestManagement() {
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<"ALL" | QuestPeriod>("ALL");
  const [form, setForm] = useState<QuestTemplateForm>(emptyForm);

  useEffect(() => {
    void loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    const response = await adminApi.getQuestTemplates();
    if (!response.success) {
      setError(response.error?.message || "Failed to load quest templates");
      setLoading(false);
      return;
    }

    setTemplates(response.data || []);
    setLoading(false);
  };

  const filteredTemplates = useMemo(() => {
    if (filterPeriod === "ALL") return templates;
    return templates.filter((template) => template.questPeriod === filterPeriod);
  }, [filterPeriod, templates]);

  const activeCount = useMemo(
    () => templates.filter((template) => template.active).length,
    [templates],
  );

  const dailyCount = useMemo(
    () => templates.filter((template) => template.questPeriod === "DAILY").length,
    [templates],
  );

  const weeklyCount = useMemo(
    () => templates.filter((template) => template.questPeriod === "WEEKLY").length,
    [templates],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (template: QuestTemplate) => {
    setEditingId(template.id);
    setForm({
      questPeriod: template.questPeriod,
      questType: template.questType,
      title: template.title,
      description: template.description,
      targetAmount: template.targetAmount,
      coinsReward: template.coinsReward,
      expReward: template.expReward,
      rewardItemType: template.rewardItemType || "",
      rewardItemQuantity: template.rewardItemQuantity,
      sortOrder: template.sortOrder,
      active: template.active,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const payload: QuestTemplateUpsertRequest = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      rewardItemType: form.rewardItemType || null,
    };

    const response = editingId
      ? await adminApi.updateQuestTemplate(editingId, payload)
      : await adminApi.createQuestTemplate(payload);

    if (!response.success) {
      setError(response.error?.message || "Failed to save quest template");
      setSubmitting(false);
      return;
    }

    setMessage(
      editingId
        ? "Quest template updated successfully."
        : "Quest template created successfully.",
    );
    resetForm();
    await loadTemplates();
    setSubmitting(false);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Disable this quest template?")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    const response = await adminApi.deactivateQuestTemplate(id);
    if (!response.success) {
      setError(response.error?.message || "Failed to deactivate quest template");
      setSubmitting(false);
      return;
    }

    setMessage("Quest template disabled.");
    await loadTemplates();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-gray-600">Loading quest templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quest Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edit daily and weekly quest templates used by the player quest board.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTemplates}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <Loader2 className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={<Target className="h-6 w-6 text-[#155ca5]" />} label="Templates" value={templates.length} />
        <StatCard icon={<ShieldCheck className="h-6 w-6 text-emerald-600" />} label="Active" value={activeCount} />
        <StatCard icon={<CalendarDays className="h-6 w-6 text-amber-600" />} label="Daily / Weekly" value={`${dailyCount} / ${weeklyCount}`} />
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900">
            {editingId ? `Update template #${editingId}` : "Create new template"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Period"
            value={form.questPeriod}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                questPeriod: value as QuestPeriod,
              }))
            }
            options={QUEST_PERIOD_OPTIONS.map((option) => ({
              value: option.value,
              label: `${option.label} - ${option.description}`,
            }))}
          />

          <SelectField
            label="Quest Type"
            value={form.questType}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                questType: value as QuestTemplateType,
              }))
            }
            options={QUEST_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <TextField
            label="Title"
            value={form.title}
            onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
            placeholder="Finish 2 lessons"
          />

          <TextField
            label="Target Amount"
            type="number"
            value={form.targetAmount}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, targetAmount: Number(value) || 0 }))
            }
            placeholder="2"
          />

          <TextField
            label="Coins Reward"
            type="number"
            value={form.coinsReward}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, coinsReward: Number(value) || 0 }))
            }
            placeholder="60"
          />

          <TextField
            label="EXP Reward"
            type="number"
            value={form.expReward}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, expReward: Number(value) || 0 }))
            }
            placeholder="120"
          />

          <SelectField
            label="Reward Item"
            value={form.rewardItemType}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                rewardItemType: value as ShopItemType | "",
              }))
            }
            options={[
              { value: "", label: "None" },
              ...ITEM_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
          />

          <TextField
            label="Reward Item Quantity"
            type="number"
            value={form.rewardItemQuantity}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                rewardItemQuantity: Number(value) || 0,
              }))
            }
            placeholder="1"
          />

          <TextField
            label="Sort Order"
            type="number"
            value={form.sortOrder}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, sortOrder: Number(value) || 0 }))
            }
            placeholder="1"
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="Complete 2 lessons today to stay on track."
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
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
          className="inline-flex items-center gap-2 rounded-md bg-[#155ca5] px-5 py-2 font-bold text-white hover:bg-[#0f4d86] disabled:opacity-50"
        >
          {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? "Update Template" : "Create Template"}
        </button>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Quest Templates</h2>
            <p className="text-sm text-slate-500">
              {filteredTemplates.length} template(s) shown
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(["ALL", "DAILY", "WEEKLY"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setFilterPeriod(period)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ${
                  filterPeriod === period
                    ? "bg-[#155ca5] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>ID</Th>
                <Th>Period</Th>
                <Th>Type</Th>
                <Th>Title</Th>
                <Th>Reward</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50">
                  <Td className="font-mono text-xs">{template.id}</Td>
                  <Td>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                      {template.questPeriod}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-sm font-bold text-slate-800">
                      {QUEST_TYPE_OPTIONS.find((item) => item.value === template.questType)?.label || template.questType}
                    </span>
                  </Td>
                  <Td>
                    <div className="max-w-[320px]">
                      <p className="font-bold text-slate-900">{template.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        {template.description}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm text-slate-600">
                      <div>{template.targetAmount} target</div>
                      <div>
                        +{template.coinsReward} coin / +{template.expReward} XP
                      </div>
                      {template.rewardItemType ? (
                        <div className="text-emerald-600">
                          {template.rewardItemType} x{template.rewardItemQuantity}
                        </div>
                      ) : null}
                    </div>
                  </Td>
                  <Td>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                        template.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {template.active ? "Active" : "Inactive"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold text-[#155ca5] hover:bg-[#155ca5]/5"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeactivate(template.id)}
                        disabled={submitting || !template.active}
                        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Disable
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}

              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No quest templates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#155ca5]/10 p-3">{icon}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-200 px-3 py-2"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-600 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}
