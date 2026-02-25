/**
 * Standard API response shape with status, message, data, and optional meta (e.g. pagination).
 */
export interface ApiResponse<TData = unknown, TMeta = undefined> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data: TData;
  meta?: TMeta;
}

/**
 * Pagination metadata for list endpoints.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Builds a consistent success response.
 * Use for list endpoints that return data + pagination/sort/filter meta.
 */
export function formatResponse<TInput, TData, TMeta = undefined>(params: {
  status: 'success';
  statusCode: number;
  message: string;
  data: TData;
  meta?: TMeta;
}): ApiResponse<TData, TMeta> {
  return {
    status: params.status,
    statusCode: params.statusCode,
    message: params.message,
    data: params.data,
    ...(params.meta !== undefined && { meta: params.meta }),
  };
}
