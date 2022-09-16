"use strict";
require('global-agent/bootstrap');
require('newrelic');
/* eslint-disable no-console */
const http = require('http');
const { env } = require('./config');
const reportError = require('./sentry');
const app = require('./src/app');
http.createServer(app).listen(env.PORT, () => console.log(`Listening on port ${env.PORT}`));
process.on('unhandledRejection', err => {
    reportError(err);
});
process.on('uncaughtException', err => {
    reportError(err);
});
//# sourceMappingURL=index.js.map