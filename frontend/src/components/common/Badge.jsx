const COLORS = {
  // Status
  Open: 'bg-blue-100 text-blue-800',
  InProgress: 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-700',
  // Published/Draft
  Published: 'bg-green-100 text-green-800',
  Draft: 'bg-gray-100 text-gray-600',
  // Priority
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
  // Roles
  Admin: 'bg-purple-100 text-purple-800',
  Committee: 'bg-indigo-100 text-indigo-700',
  Resident: 'bg-teal-100 text-teal-700',
  // flat status
  occupied: 'bg-green-100 text-green-700',
  vacant: 'bg-gray-100 text-gray-500',
};

export default function Badge({ label, className = '' }) {
  const color = COLORS[label] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
