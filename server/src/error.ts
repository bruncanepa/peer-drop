export type ErrorMessageType = { key: string; message: string; code: number };

const NOT_FOUND: ErrorMessageType = {
  key: "NOT_FOUND",
  code: 404,
  message: "not found",
};

export const ErrorMessage: Record<string, ErrorMessageType> = { NOT_FOUND };
