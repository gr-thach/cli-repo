"use strict";
/* eslint-disable consistent-return */
const JiraApi = require('jira-client');
const JiraServerError = require('../errors/jiraServerError');
class JiraService {
    constructor(url, username, password) {
        JiraService.validateUrl(url);
        const parsedUrl = new URL(url);
        this.client = new JiraApi({
            protocol: parsedUrl.protocol === 'https:' ? 'https' : 'http',
            host: parsedUrl.host,
            base: parsedUrl.pathname !== '/' ? parsedUrl.pathname : undefined,
            username,
            password,
            apiVersion: '2',
            strictSSL: parsedUrl.protocol === 'https:'
        });
    }
    static validateUrl(urlStr) {
        const url = new URL(urlStr);
        if (!['https:', 'http:'].includes(url.protocol)) {
            throw new Error(`${url.protocol} is not a supported protocol.`);
        }
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            throw new Error(`${url.hostname} is an invalid hostname`);
        }
        const pathName = url.pathname.replace(/\/+$/, ''); // Removes one or more trailing slashes from the URL.
        if (urlStr !== `${url.protocol}//${url.host}${pathName}`) {
            // This will make sure the user hasn't added username:password in the url and/or added query parameters like ?test=abc.
            throw new Error(`Url should be in the format {protocol}://{host}{path} (where path is optional). Did you mean to write "${url.protocol}//${url.host}${pathName}"?`);
        }
    }
    async testConnection() {
        try {
            // If we can get the current user then we assume that the connection and
            // authentication with the Jira server is working as expected.
            return await this.client.getCurrentUser();
        }
        catch (err) {
            this.handleError(err);
        }
    }
    async getProjects() {
        try {
            return await this.client.listProjects();
        }
        catch (err) {
            this.handleError(err);
        }
    }
    async getProject(jiraProjectId) {
        if (!jiraProjectId) {
            throw new Error(`Unable to get Jira project. Jira project id is not defined (${jiraProjectId}).`);
        }
        try {
            return await this.client.getProject(jiraProjectId);
        }
        catch (err) {
            this.handleError(err);
        }
    }
    async getIssueTypes(jiraProjectId) {
        if (!jiraProjectId) {
            throw new Error(`Unable to get Jira project. Jira project id is not defined (${jiraProjectId}).`);
        }
        try {
            const project = await this.getProject(jiraProjectId);
            return project && project.issueTypes;
        }
        catch (err) {
            this.handleError(err);
        }
    }
    async createIssue(summary, description, projectId, issueTypeId) {
        const issue = {
            fields: {
                summary,
                description,
                project: {
                    id: projectId
                },
                issuetype: {
                    id: issueTypeId
                }
            }
        };
        try {
            return await this.client.addNewIssue(issue);
        }
        catch (err) {
            this.handleError(err);
        }
    }
    // eslint-disable-next-line class-methods-use-this
    handleError(err) {
        if (err.statusCode === 401) {
            throw new JiraServerError('Unable to authenticate with Jira. Api url, username and/or password is invalid.', err.statusCode, err);
        }
        else if (err.statusCode === 404) {
            throw new JiraServerError('Received status code 404 (Not Found) from Jira. Is the api url not correctly configured or does the resource not exist?', err.statusCode, err);
        }
        else if (err.cause && err.cause.code === 'ENOTFOUND') {
            throw new JiraServerError('Unable to connect to Jira server. Is the api url correct?', err.statusCode, err);
        }
        else {
            throw new JiraServerError(`Received an unexpected error from Jira server, got response with status code ${err.statusCode}.`, err.statusCode, err);
        }
    }
}
module.exports = JiraService;
//# sourceMappingURL=jira.js.map