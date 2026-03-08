import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** จำนวนปุ่มเลขหน้าที่แสดง (default 5) */
  maxVisible?: number;
}

/**
 * Pagination ตามแบบภาพที่ 2: [ < ] [ 1 ] [ 2 ] [ > ]
 * - ปุ่ม prev/next: พื้นขาว ขอบเทา มุมโค้ง
 * - หน้าที่เลือก: พื้นน้ำเงิน ตัวอักษรขาว
 * - หน้าอื่น: พื้นขาว ขอบเทา ตัวอักษรดำ
 */
export function Pagination({ currentPage, totalPages, onPageChange, maxVisible = 5 }: PaginationProps) {
  if (totalPages <= 0) return null;

  const getPageNumbers = (): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return Array.from({ length: maxVisible }, (_, i) => i + 1);
    }
    if (currentPage >= totalPages - 2) {
      return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + 1 + i);
    }
    return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="หน้าก่อน"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      {pageNumbers.map((pageNum) => (
        <button
          key={pageNum}
          type="button"
          onClick={() => onPageChange(pageNum)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-bold transition-colors shrink-0 ${
            currentPage === pageNum
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={`หน้า ${pageNum}`}
          aria-current={currentPage === pageNum ? 'page' : undefined}
        >
          {pageNum}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="หน้าถัดไป"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
