// Placeholder for future multi-device navigation ("Support multiple
// cold-storage units from one cloud dashboard" — see report Future Scope).
export default function Sidebar() {
  return (
    <nav className="hidden md:block w-56 bg-white border-r border-slate-100 p-4">
      <ul className="space-y-2 text-sm text-slate-600">
        <li className="font-medium text-slate-900">Dashboard</li>
        <li>Alerts</li>
        <li>Storage Batches</li>
        <li>Settings</li>
      </ul>
    </nav>
  );
}
