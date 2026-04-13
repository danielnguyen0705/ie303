import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { request } from "@/api/utils/http";
import type { ApiResponse } from "@/api/types";
import type { Unit } from "../../api/content";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { ContentBreadcrumb } from "../../components/ContentBreadcrumb";

export function UnitSelection() {
  const { gradeId } = useParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUnits = async () => {
      if (!gradeId) return;

      setLoading(true);
      setError(null);

      const res = await request<Unit[]>(`/api/units/grade/${gradeId}`, {
        method: "GET",
      });

      if (res.success) {
        setUnits(res.data);
      } else {
        setError(res.error?.message || "Failed to load units");
      }

      setLoading(false);
    };

    loadUnits();
  }, [gradeId]);

  if (loading) return <LoadingState text="Loading units..." />;
  if (error) return <EmptyState title="Cannot load units" description={error} />;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <ContentBreadcrumb
        items={[
          { label: "Grades", to: "/grades" },
          { label: `Grade ${gradeId}` },
        ]}
      />

      <div>
        <h1 className="text-4xl font-black text-[#155ca5]">Units</h1>
        <p className="text-gray-600 mt-2">Choose a unit to view sections.</p>
      </div>

      {!units.length ? (
        <EmptyState title="No units found for this grade" />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Link
              key={unit.id}
              to={`/units/${unit.id}/sections`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border"
            >
              <div className="text-sm text-gray-500 font-bold">
                UNIT {unit.unitNumber ?? unit.id}
              </div>
              <h2 className="text-2xl font-black text-[#1e2e51] mt-2">
                {unit.title}
              </h2>
              {unit.description && (
                <p className="text-sm text-gray-600 mt-3">{unit.description}</p>
              )}
              <div className="mt-4 text-sm font-medium text-[#155ca5]">
                Open sections →
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}