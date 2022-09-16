export const getEndpoint = (app, method, path) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [urlPath, callback] of app[method].mock.calls) {
    if (path === urlPath) {
      return callback;
    }
  }

  throw new Error(`No endpoint found with path '${path}'.`);
};
