/* eslint-disable no-console */
const Sentry = require('@sentry/node');
const { env } = require('./config');
const { getContextFromAxiosError } = require('./src/helpers/common');

const useSentry = env.SENTRY_DSN && env.SENTRY_DSN !== '';

if (useSentry) {
  const release =
    (env.NEW_RELIC_METADATA_KUBERNETES_CONTAINER_IMAGE_NAME &&
      env.NEW_RELIC_METADATA_KUBERNETES_CONTAINER_IMAGE_NAME.toString().split(':')[1]) ||
    '';
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    release
  });
}

async function reportError(error, context = {}) {
  let eventId = '';
  // When running tests, consoole.warn will break them
  if (process.env.NODE_ENV !== 'test') {
    console.warn(error);
  }

  if (!useSentry) {
    return eventId;
  }

  let sentryContext = context;

  if (error.isAxiosError) {
    try {
      sentryContext = {
        ...sentryContext,
        axios: getContextFromAxiosError(error)
      };
    } catch (err) {
      console.log('Failed to create axios error context.', err);
    }
  }

  // When having sentry initialized ...
  if (typeof error === 'string') {
    Sentry.withScope(scope => {
      scope.setExtras(sentryContext);
      eventId = Sentry.captureMessage(error);
    });
  } else {
    Sentry.withScope(scope => {
      scope.setExtras(sentryContext);
      eventId = Sentry.captureException(error);
    });
  }

  await Sentry.flush();

  return eventId;
}

module.exports = reportError;
