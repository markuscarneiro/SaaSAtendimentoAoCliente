export interface PaginationParams {
  page: number
  pageSize: number
}

export function paginationSkip(p: PaginationParams): number {
  return (p.page - 1) * p.pageSize
}

export function paginationMeta(total: number, p: PaginationParams) {
  return { page: p.page, pageSize: p.pageSize, total }
}
