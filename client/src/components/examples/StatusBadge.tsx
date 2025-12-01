import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  const statuses = ['pending', 'confirmed', 'declined', 'completed', 'cancelled'] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  );
}
