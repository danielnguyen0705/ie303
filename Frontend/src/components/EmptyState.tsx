interface Props {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <h3 className="text-xl font-bold text-[#1e2e51]">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      )}
    </div>
  );
}