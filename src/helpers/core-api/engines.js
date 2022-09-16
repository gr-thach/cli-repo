const lodashGet = require('lodash/get');
const lodashGroupBy = require('lodash/groupBy');
const { coreAxios, wrapper, gql } = require('./index');

const listEngines = async accountId => {
  const query = gql`
    query {
      engines(condition: { enable: true, deletedAt: null }) {
        nodes {
          idEngine
          fkAccount
          name
          language
          allowFor
          isPrivate
          version
        }
      }
    }
  `;

  const { data } = await coreAxios.post('/graphql', { query });
  let engines = lodashGet(data, 'data.engines.nodes', []).filter(engine => {
    if (engine.fkAccount) {
      const allowedAccounts = engine.allowFor;
      return Array.isArray(allowedAccounts) && allowedAccounts.includes(accountId);
    }
    return true;
  });
  engines = engines.map(engine => ({
    ...engine,
    name: engine.name.replace(`${engine.language}-`, '')
  }));
  return lodashGroupBy(engines, e => e.language);
};

const listEngineRules = async accountId => {
  const query = gql`
    query {
      engines(condition: { enable: true, deletedAt: null }, orderBy: [LANGUAGE_ASC, NAME_ASC]) {
        nodes {
          name
          fkAccount
          allowFor
          language
          engineRules: engineRulesByFkEngine(condition: { deletedAt: null }) {
            nodes {
              idEngineRule
              name
              title
              docs
              enable
              cvssSeverity
              cvssScore
              cvssVector
              rule: ruleByFkRule {
                idRule
                name
                docs
              }
            }
          }
        }
      }
    }
  `;

  const { data } = await coreAxios.post('/graphql', { query });

  return lodashGet(data, 'data.engines.nodes', [])
    .filter(engine => {
      if (engine.fkAccount) {
        const allowedAccounts = engine.allowFor;
        return Array.isArray(allowedAccounts) && allowedAccounts.includes(accountId);
      }
      return true;
    })
    .map(x => ({
      engineName: x.name,
      engineLanguage: x.language,
      rules: x.engineRules.nodes
    }));
};

const importCustomEngine = async (accountId, manifestData) => {
  const { data } = await coreAxios.post('/engines/custom', {
    accountId,
    manifestData
  });

  return data;
};

module.exports = {
  listEngines: wrapper(listEngines),
  listEngineRules: wrapper(listEngineRules),
  importCustomEngine: wrapper(importCustomEngine)
};
