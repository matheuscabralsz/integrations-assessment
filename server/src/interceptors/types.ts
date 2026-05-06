export type RequestInterceptor = (init: RequestInit) => RequestInit | Promise<RequestInit>;

export type ResponseInterceptor = (
  res: Response,
  ctx: { path: string },
) => Response | Promise<Response>;
