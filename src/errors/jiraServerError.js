class JiraServerError extends Error {
  constructor(message, statusCode, originalError) {
    super(message);
    this.name = 'JiraServerError';
    this.originalError = originalError;
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, JiraServerError.prototype);
  }
}

module.exports = JiraServerError;
