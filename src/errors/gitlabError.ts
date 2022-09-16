class GitlabError extends Error {
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
    this.name = 'GitlabError';
    this.functionName = functionName;
    this.status = status;
    this.method = method;
    this.url = url;
  }
}

export default GitlabError;
