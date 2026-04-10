export const customInstance = async <T>(
  url: string,
  {
    method,
    params,
    body,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: any;
    body?: BodyType<unknown>;
    responseType?: string;
  },
): Promise<T> => {
  const response = await fetch(url, {
    method,
    body,
  });
  return response.json();
};
export default customInstance;
// // Override the return error type for react-query and swr
// export type ErrorType<Error> = AxiosError<Error>;
// // Wrap the body type if needed (e.g., for case transformation)
// export type BodyType<BodyData> = CamelCase<BodyData>;