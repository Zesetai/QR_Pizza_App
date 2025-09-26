export default function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-yellow-200 text-yellow-800",
    IN_PROGRESS: "bg-blue-200 text-blue-800",
    READY: "bg-green-200 text-green-800",
    DONE: "bg-gray-200 text-gray-700",
    CANCELLED: "bg-red-200 text-red-800"
  };
  return (
    <span className={`inline-block rounded px-2 py-1 text-xs ${colors[status] || ""}`}>
      {status}
    </span>
  );
}
