class GithubError extends Error {
  functionName: string;

  status: number | undefined;

  method: string | undefined;

  url: string | undefined;

  documentationUrl: string | undefined;

  constructor(
    message: string,
    functionName: string,
    status: number | undefined,
    method: string | undefined,
    url: string | undefined,
    documentationUrl: string | undefined
  ) {
    super(message);
    this.name = 'GithubError';
    this.functionName = functionName;
    this.status = status;
    this.method = method;
    this.url = url;
    this.documentationUrl = documentationUrl;
  }
}

export default GithubError;
