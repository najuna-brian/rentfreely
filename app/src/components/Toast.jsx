import useUiStore from '../stores/uiStore';

export default function Toast() {
  const { toast } = useUiStore();
  if (!toast) return null;

  const bgColors = {
    info: 'bg-gray-800',
    success: 'bg-primary',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        className={`${bgColors[toast.type] || bgColors.info} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-fade-in`}
      >
        {toast.message}
      </div>
    </div>
  );
}
