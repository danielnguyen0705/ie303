import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function ContentBreadcrumb({ items }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.to ? (
            <Link to={item.to} className="hover:text-[#155ca5] hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[#1e2e51]">{item.label}</span>
          )}
          {index < items.length - 1 && <span>/</span>}
        </div>
      ))}
    </div>
  );
}