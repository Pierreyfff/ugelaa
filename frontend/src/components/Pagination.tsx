interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        ← Anterior
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all">1</button>
          {start > 2 && <span className="px-2 text-slate-400">•••</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            page === currentPage
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600'
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-slate-400">•••</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Siguiente →
      </button>
    </div>
  );
}