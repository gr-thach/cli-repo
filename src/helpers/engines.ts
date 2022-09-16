import unzipper from 'unzipper';
import path from 'path';
import stream from 'stream';
import { AllowedAccounts } from '../interfaces';

interface ManifestAllowFor {
  providers: { [key: string]: string[] };
}

interface ManifestContent {
  name: string;
  version: string;
  description: string;
  allowFor: ManifestAllowFor;
  runForLanguage: string;
  rules: string;
}

const parseManifestContent = (mainfestContent: string): ManifestContent => {
  const mainfestJson: ManifestContent = JSON.parse(mainfestContent);
  return {
    name: mainfestJson.name,
    version: mainfestJson.version,
    description: mainfestJson.description,
    allowFor: mainfestJson.allowFor,
    runForLanguage: mainfestJson.runForLanguage,
    rules: mainfestJson.rules
  };
};

export const extractManifestDataFromCustomEngineFile = async (
  fileData: Buffer
): Promise<ManifestContent> => {
  const manifestFileName = 'guardrails.json';
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileData);

  return new Promise((resolve, reject) => {
    let manifestFileFound = false;
    bufferStream
      .pipe(unzipper.Parse())
      .on('error', reject)
      .on('entry', async entry => {
        try {
          const dirname = path.dirname(entry.path);
          const fileName = path.basename(entry.path);
          const isRoot = dirname.split(path.sep).length <= 1;
          if (!manifestFileFound && fileName === manifestFileName && isRoot) {
            manifestFileFound = true;
            const content = (await entry.buffer()).toString();
            resolve(parseManifestContent(content));
          } else {
            entry.autodrain();
          }
        } catch (e) {
          reject(e);
        }
      });
  });
};

const allowedAccountsToAllowedLogins = (allowedAccounts: AllowedAccounts) => {
  return Object.keys(allowedAccounts).reduce<{ [provider: string]: { [login: string]: number } }>(
    (acc, accountId) => {
      const account = allowedAccounts[accountId];
      const provider = account.provider.toLowerCase();
      if (!acc[provider]) {
        acc[provider] = {};
      }
      acc[provider][account.login] = parseInt(accountId, 10);
      return acc;
    },
    {}
  );
};

export const transformAllowFor = (allowFor: ManifestAllowFor, allowedAccounts: AllowedAccounts) => {
  const allowedLogins = allowedAccountsToAllowedLogins(allowedAccounts);
  const summary = {
    included: 0,
    excluded: 0
  };
  const newAllowFor: number[] = [];
  if (allowFor && allowFor.providers) {
    ['github', 'gitlab', 'bitbucket', 'bitbucket_data_center'].forEach(provider => {
      if (allowFor.providers[provider]) {
        allowFor.providers[provider].forEach(accountLogin => {
          if (allowedLogins[provider] && allowedLogins[provider][accountLogin]) {
            newAllowFor.push(allowedLogins[provider][accountLogin]);
            summary.included++;
          } else {
            summary.excluded++;
          }
        });
      }
    });
  }
  return { newAllowFor, summary };
};
