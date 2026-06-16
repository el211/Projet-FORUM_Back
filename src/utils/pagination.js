// FT-9: lists are paginated in batches of 10, 20, 30 or the whole list,
// defaulting to 10. Returns a limit/offset plus metadata for the response.
function resolvePagination(query, paginationConfig) {
  const defaultSize = paginationConfig.defaultSize || 10;
  const allowedSizes = paginationConfig.allowedSizes || [10, 20, 30];

  const rawSize = query.size != null ? String(query.size).toLowerCase() : String(defaultSize);
  const isAll = rawSize === 'all';

  let size = defaultSize;
  if (!isAll) {
    const parsed = Number(rawSize);
    size = allowedSizes.includes(parsed) ? parsed : defaultSize;
  }

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = isAll ? null : size;
  const offset = isAll ? 0 : (page - 1) * size;

  return { page, size: isAll ? 'all' : size, limit, offset };
}

function buildPageMeta(pagination, total) {
  const totalPages =
    pagination.size === 'all' || total === 0 ? 1 : Math.ceil(total / pagination.size);

  return {
    page: pagination.page,
    size: pagination.size,
    total,
    totalPages
  };
}

module.exports = {
  resolvePagination,
  buildPageMeta
};
