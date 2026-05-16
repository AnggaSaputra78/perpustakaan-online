interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({ message = 'Tidak ada data', icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
      <span className="text-6xl mb-4">{icon}</span>
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}