export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: FieldError[];
  requestId: string;
}

export interface LivenessResponse {
  status: 'ok';
}

export interface ReadinessResponse {
  status: 'ready';
  checks: {
    database: 'up';
  };
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}
