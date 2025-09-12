import COTDAdmin from '@/components/admin/COTDAdmin';

export default function COTDAdminPage() {
  return (
    <div className="space-y-16 w-full">
      <div>
        <h1 className="text-5xl font-bold mb-6">Управление "Машина дня"</h1>
        <p className="text-xl text-gray-400">Добавление кандидатов и управление голосованием</p>
      </div>

      <COTDAdmin />
    </div>
  );
}
