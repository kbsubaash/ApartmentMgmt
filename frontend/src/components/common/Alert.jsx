const VARIANTS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`rounded-md border px-4 py-3 text-sm flex items-start gap-2 ${VARIANTS[type]}`}>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-current opacity-60 hover:opacity-100 leading-none">
          ✕
        </button>
      )}
    </div>
  );
}
