"use strict";
const { sign } = require('jsonwebtoken');
const Keygrip = require('keygrip');
const axios = require('axios');
const lodashGet = require('lodash/get');
const { aesEncrypt, aesDecrypt } = require('../src/helpers/encryption');
// How to use:
// CORE_API_URI= GUARDRAILS_GIT_TOKENS_SECRET= GUARDRAILS_JWT_TOKEN_SECRET= GUARDRAILS_SESSION_KEY_1= GUARDRAILS_SESSION_KEY_2= npm run generateusertoken 00000000-0000-0000-0000-000000000000
const CORE_API_URI = process.env.CORE_API_URI || 'http://core-api:3000';
const { BITBUCKET_SITE_URL, BITBUCKET_OAUTH_CLIENT_ID, BITBUCKET_OAUTH_CLIENT_SECRET, GUARDRAILS_GIT_TOKENS_SECRET, GUARDRAILS_JWT_TOKEN_SECRET, GUARDRAILS_SESSION_KEY_1, GUARDRAILS_SESSION_KEY_2 } = process.env;
const toCamelcase = s => {
    return s.replace(/([_][a-z])/gi, $1 => {
        return $1.toUpperCase().replace('_', '');
    });
};
const refreshBitbucketAccessToken = async (refreshToken) => {
    const bodyFormData = new URLSearchParams();
    bodyFormData.append('refresh_token', refreshToken);
    bodyFormData.append('grant_type', 'refresh_token');
    const response = await axios({
        method: 'post',
        url: `${BITBUCKET_SITE_URL}/site/oauth2/access_token`,
        auth: {
            username: BITBUCKET_OAUTH_CLIENT_ID,
            password: BITBUCKET_OAUTH_CLIENT_SECRET
        },
        data: bodyFormData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return lodashGet(response, 'data.access_token');
};
const generateUserToken = async () => {
    const idUser = process.argv.length >= 3 && process.argv[2];
    const req = await axios({
        url: `${CORE_API_URI}/users/${idUser}`,
        method: 'get'
    });
    const user = lodashGet(req, 'data');
    if (!user) {
        console.log('User id not found !');
    }
    const provider = user.provider.toLowerCase();
    let accessToken = user.providerAccessToken;
    if (provider === 'bitbucket') {
        const refreshToken = aesDecrypt(user.providerRefreshToken, GUARDRAILS_GIT_TOKENS_SECRET);
        const newAccessToken = await refreshBitbucketAccessToken(refreshToken);
        accessToken = aesEncrypt(newAccessToken, GUARDRAILS_GIT_TOKENS_SECRET) || accessToken;
    }
    const expiresAt = new Date(Date.now() + 900 * 1000).getTime(); // 15 mins
    const data = {
        provider,
        providerInternalId: user.providerInternalId,
        [`${toCamelcase(provider)}Nickname`]: user.login,
        [`${toCamelcase(provider)}AccessToken`]: accessToken,
        [`${toCamelcase(provider)}AccessTokenSecret`]: user.providerAccessTokenSecret,
        exp: expiresAt / 1000,
        user: {
            id: user.providerInternalId,
            username: user.login,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl
        }
    };
    const token = sign(data, GUARDRAILS_JWT_TOKEN_SECRET);
    const base64Token = Buffer.from(JSON.stringify({ jwt: token })).toString('base64');
    const kg = Keygrip([GUARDRAILS_SESSION_KEY_1, GUARDRAILS_SESSION_KEY_2]);
    const sig = kg.sign(`gr.auth.token=${base64Token}`);
    console.log('* Remember to delete current cookie since js unable to delete httpOnly cookies');
    console.log('Set cookie js:');
    console.log('---');
    console.log(`document.cookie="gr.auth.is.authenticated=true;secure;SameSite=Lax;max-age=900;domain=.guardrails.io;path=/;";document.cookie="gr.auth.token=${base64Token};secure;SameSite=Lax;max-age=900;domain=.guardrails.io;path=/;";document.cookie="gr.auth.token.sig=${sig};secure;SameSite=Lax;max-age=900;domain=.guardrails.io;path=/;";window.location='/';`);
};
generateUserToken();
//# sourceMappingURL=generateUserToken.js.map