export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface AuthSettings {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyAddTo?: 'header' | 'query';
}

export type BodyType = 'none' | 'json' | 'form-data' | 'raw';

export interface RequestBody {
  type: BodyType;
  rawContent?: string;
  formData?: KeyValuePair[];
}

export interface HttpRequest {
  id: string;
  name?: string;
  method: HttpMethod;
  url: string;
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  auth: AuthSettings;
  body: RequestBody;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  executionTimeMs: number;
  sizeBytes: number;
  contentType?: string;
  isError?: boolean;
  errorDetails?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  request: HttpRequest;
  response: HttpResponse | null;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  requests: HttpRequest[];
  createdAt: number;
  updatedAt: number;
}
