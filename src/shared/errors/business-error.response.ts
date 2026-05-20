export interface BusinessErrorField {
  field: string;
  code: string;
  message: string;
}

export interface BusinessErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: BusinessErrorField[];
  timestamp: string;
}
