import { ErrorRequestHandler } from "express";
import { ErrorMessage, ErrorMessageType } from "../error";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req,
  res,
  next
) => {
  if (res.headersSent) return next(err);

  const customError = ErrorMessage[err.message];
  if (customError) {
    res.status(customError.code).send(customError.message);
    return;
  }

  res.status(500).send("internal error");
};
