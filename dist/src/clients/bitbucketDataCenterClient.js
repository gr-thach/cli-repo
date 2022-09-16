"use strict";
const axios = require('axios');
const crypto = require('crypto');
const oauth1a = require('oauth-1.0a');
class BitbucketDataCenterClient {
    constructor(bitbucketUrl, auth) {
        this.bitbucketUrl = bitbucketUrl;
        this.auth = auth;
        if (!['oauth', 'pat'].includes(auth.type)) {
            throw new Error(`Unknown auth type ${auth.type}.`);
        }
    }
    async get(path, params) {
        const request = {
            url: this.createUrl(path, params),
            method: 'GET'
        };
        const authHeaders = this.getAuthHeadersForRequest(request);
        return axios.get(request.url, { headers: authHeaders });
    }
    async post(path, params, body) {
        const request = {
            url: this.createUrl(path, params),
            method: 'POST',
            body
        };
        const authHeaders = this.getAuthHeadersForRequest(request);
        return axios.post(request.url, request.body, { headers: authHeaders });
    }
    async delete(path, params) {
        const request = {
            url: this.createUrl(path, params),
            method: 'DELETE'
        };
        const authHeaders = this.getAuthHeadersForRequest(request);
        return axios.delete(request.url, { headers: authHeaders });
    }
    async getCollection(path, params) {
        const { data } = await this.get(path, params);
        this.validatePaginatedResponse(data);
        if (data.isLastPage) {
            return data.values;
        }
        const nextResults = await this.getCollection(path, {
            ...params,
            start: data.nextPageStart
        });
        return data.values.concat(nextResults);
    }
    getAuthHeadersForRequest(request) {
        if (this.auth.type === 'pat') {
            return {
                Authorization: `Bearer ${this.auth.pat}`
            };
        }
        if (this.auth.type === 'oauth') {
            const self = this;
            const oauth = oauth1a({
                consumer: { key: this.auth.consumerKey, secret: this.auth.consumerSecret },
                signature_method: 'RSA-SHA1',
                hash_function(base_string) {
                    const sign = crypto.createSign('RSA-SHA1');
                    sign.update(base_string);
                    return sign.sign(self.auth.consumerSecret, 'base64');
                }
            });
            const authorization = oauth.authorize(request, {
                key: this.auth.accessToken,
                secret: this.auth.accessTokenSecret
            });
            return oauth.toHeader(authorization);
        }
        throw new Error(`Unknown auth type ${this.auth.type}.`);
    }
    createUrl(path, params) {
        const url = new URL(`${this.bitbucketUrl}/rest/api/1.0${path}`);
        if (path.includes('?')) {
            throw new Error("The path shouldn't contain a '?' character, you should add query parameters to the 'params' parameter instead.");
        }
        const encodedParams = this.encodeParams(params);
        if (encodedParams) {
            return `${url.href}?${encodedParams}`;
        }
        return url.href;
    }
    // eslint-disable-next-line class-methods-use-this
    encodeParams(params) {
        // Important! Do not encode spaces as '+', they must be encoded as %20.
        // This is because "oauth-1.0a" library is using decodeURIComponent (https://github.com/ddo/oauth-1.0a/blob/8c24a413ab36c7cd049d34a3d2d16996f24da0ad/oauth-1.0a.js#L224)
        // This is why we are not using URLSearchParams here, as it encodes spaces as '+'.
        const encodedParams = [];
        if (params) {
            // eslint-disable-next-line no-restricted-syntax
            for (const [key, value] of Object.entries(params)) {
                encodedParams.push(`${key}=${encodeURIComponent(value)}`);
            }
        }
        return encodedParams.join('&');
    }
    // eslint-disable-next-line class-methods-use-this
    validatePaginatedResponse(data) {
        if (!Array.isArray(data.values)) {
            throw new Error(`Expected paginated values field to be of type array, got ${typeof data.values}.`);
        }
        if (typeof data.isLastPage !== 'boolean') {
            throw new Error(`Expected 'isLastPage' to be a boolean, got ${typeof data.isLastPage}. Is this really a paginated resource?`);
        }
        if (!data.isLastPage) {
            if (typeof data.nextPageStart !== 'number') {
                throw new Error(`Expected 'nextPageStart' to be a number, got ${typeof data.nextPageStart}. Is this really a paginated resource?`);
            }
        }
    }
}
module.exports = BitbucketDataCenterClient;
//# sourceMappingURL=bitbucketDataCenterClient.js.map