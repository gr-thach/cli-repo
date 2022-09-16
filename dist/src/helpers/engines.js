"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformAllowFor = exports.extractManifestDataFromCustomEngineFile = void 0;
const unzipper_1 = __importDefault(require("unzipper"));
const path_1 = __importDefault(require("path"));
const stream_1 = __importDefault(require("stream"));
const parseManifestContent = (mainfestContent) => {
    const mainfestJson = JSON.parse(mainfestContent);
    return {
        name: mainfestJson.name,
        version: mainfestJson.version,
        description: mainfestJson.description,
        allowFor: mainfestJson.allowFor,
        runForLanguage: mainfestJson.runForLanguage,
        rules: mainfestJson.rules
    };
};
const extractManifestDataFromCustomEngineFile = async (fileData) => {
    const manifestFileName = 'guardrails.json';
    const bufferStream = new stream_1.default.PassThrough();
    bufferStream.end(fileData);
    return new Promise((resolve, reject) => {
        let manifestFileFound = false;
        bufferStream
            .pipe(unzipper_1.default.Parse())
            .on('error', reject)
            .on('entry', async (entry) => {
            try {
                const dirname = path_1.default.dirname(entry.path);
                const fileName = path_1.default.basename(entry.path);
                const isRoot = dirname.split(path_1.default.sep).length <= 1;
                if (!manifestFileFound && fileName === manifestFileName && isRoot) {
                    manifestFileFound = true;
                    const content = (await entry.buffer()).toString();
                    resolve(parseManifestContent(content));
                }
                else {
                    entry.autodrain();
                }
            }
            catch (e) {
                reject(e);
            }
        });
    });
};
exports.extractManifestDataFromCustomEngineFile = extractManifestDataFromCustomEngineFile;
const allowedAccountsToAllowedLogins = (allowedAccounts) => {
    return Object.keys(allowedAccounts).reduce((acc, accountId) => {
        const account = allowedAccounts[accountId];
        const provider = account.provider.toLowerCase();
        if (!acc[provider]) {
            acc[provider] = {};
        }
        acc[provider][account.login] = parseInt(accountId, 10);
        return acc;
    }, {});
};
const transformAllowFor = (allowFor, allowedAccounts) => {
    const allowedLogins = allowedAccountsToAllowedLogins(allowedAccounts);
    const summary = {
        included: 0,
        excluded: 0
    };
    const newAllowFor = [];
    if (allowFor && allowFor.providers) {
        ['github', 'gitlab', 'bitbucket', 'bitbucket_data_center'].forEach(provider => {
            if (allowFor.providers[provider]) {
                allowFor.providers[provider].forEach(accountLogin => {
                    if (allowedLogins[provider] && allowedLogins[provider][accountLogin]) {
                        newAllowFor.push(allowedLogins[provider][accountLogin]);
                        summary.included++;
                    }
                    else {
                        summary.excluded++;
                    }
                });
            }
        });
    }
    return { newAllowFor, summary };
};
exports.transformAllowFor = transformAllowFor;
//# sourceMappingURL=engines.js.map