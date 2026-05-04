/**
 * Pagination helper for UI controls.
 *
 * - Returns up to `maxVisible` page numbers (default 5), centered on `current` when possible.
 * - Includes prev/next availability and page numbers for those buttons.
 */
export type Pagination = {
  pages: number[];
  current: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export function getPagination(
  current: number,
  total: number,
  maxVisible = 5,
): Pagination {
  if (total <= 0) {
    return {
      pages: [],
      current: 1,
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevPage: null,
      nextPage: null,
    };
  }

  current = Math.max(1, Math.min(current, total));
  maxVisible = Math.max(1, Math.floor(maxVisible));

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxVisible - 1);

  // If we don't have enough pages at the end, shift the window left
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const hasPrev = current > 1;
  const hasNext = current < total;

  return {
    pages,
    current,
    total,
    hasPrev,
    hasNext,
    prevPage: hasPrev ? current - 1 : null,
    nextPage: hasNext ? current + 1 : null,
  };
}

export default getPagination;
