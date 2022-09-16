"use strict";
const get = require('lodash/get');
const boom = require('@hapi/boom');
const { env } = require('../../config');
const reportError = require('../../sentry');
const JiraServerError = require('../errors/jiraServerError');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = async (err, req, res, next) => {
    if (err instanceof JiraServerError) {
        // We don't want to send errors that we get from Jira servers to Sentry because there is nothing
        // we can do to resolve those issues as it is the users who are the ones who are responsible for the Jira servers.
        const badGateway = boom.badGateway(err.message);
        // We do want to log those errors to the console though, so we can help our customers with debugging the issues (if needed).
        // eslint-disable-next-line no-console
        console.log(err);
        return res.status(badGateway.output.statusCode).send(badGateway.output.payload);
    }
    let eventId;
    const statusCode = get(err, 'output.statusCode');
    // explicitly set cases for not sending errors to sentry
    if (![400, 401, 402, 403, 404].includes(statusCode)) {
        const context = {
            url: req.url,
            method: req.method,
            headers: req.headers,
            query: req.query,
            body: req.body
        };
        eventId = await reportError(err, context);
    }
    const showMoreDetails = ['development', 'staging'].includes(env.ENVIRONMENT);
    if (showMoreDetails && err.isCoreApiGQLError) {
        const status = get(err, 'response.data.status', 400);
        const errors = get(err, 'response.data.errors');
        const unhandledError = boom.boomify(err, { statusCode: status });
        return res.status(unhandledError.output.statusCode).send({
            ...unhandledError.output.payload,
            ...(errors && { errors }),
            eventId
        });
    }
    if (showMoreDetails && err.isCoreApiError) {
        const status = get(err, 'response.data.status');
        const message = get(err, 'response.data.message');
        const validation = get(err, 'response.data.validation');
        const unhandledError = boom.boomify(err, { statusCode: status });
        return res.status(unhandledError.output.statusCode).send({
            ...unhandledError.output.payload,
            ...(message && { message }),
            ...(validation && { validation }),
            eventId
        });
    }
    if (!err.isBoom) {
        const unhandledError = boom.badImplementation(err);
        return res
            .status(unhandledError.output.statusCode)
            .send({ ...unhandledError.output.payload, eventId });
    }
    return res.status(err.output.statusCode).send({ ...err.output.payload, ...err.data, eventId });
};
module.exports = errorHandler;
//# sourceMappingURL=errorHandler.js.map