import Express from "express";

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}
