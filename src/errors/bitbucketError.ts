class BitbucketError extends Error {
  functionName: string;

  status: number | undefined;

  method: string | undefined;

  url: string | undefined;

  constructor(
    message: string,
    functionName: string,
    status: number | undefined,
    method: string | undefined,
    url: string | undefined
  ) {
    super(message);
    this.name = 'BitbucketError';
    this.functionName = functionName;
    this.status = status;
    this.method = method;
    this.url = url;
  }
}

export default BitbucketError;
