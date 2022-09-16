const yaml = require('js-yaml');
const Joi = require('@hapi/joi');
const lodashGet = require('lodash/get');
const lodashSet = require('lodash/set');

const allowedLanguages = [
  'c',
  'detect',
  'elixir',
  'general',
  'go',
  'java',
  'javascript',
  'php',
  'python',
  'ruby',
  'rust',
  'solidity',
  'terraform',
  'typescript',
  'mobile',
  'dotnet',
  'apex'
];

const bundlesSchema = Joi.alternatives().try(
  Joi.string().valid('auto'),
  Joi.array()
    .min(1)
    .items(
      Joi.valid(...allowedLanguages),
      Joi.object().pattern(
        Joi.string().valid(...allowedLanguages),
        Joi.array()
          .min(1)
          .items(Joi.string().regex(/[-_0-9a-zA-Z]+/))
      )
    )
);

const reportSchema = Joi.object().keys({
  pullRequest: Joi.object().keys({
    findings: Joi.any().valid('onAllFiles', 'onChangedFilesOnly', 'onChangedLinesOnly'),
    comment: Joi.boolean(),
    paranoid: Joi.boolean()
  })
});

const notificationsSchema = Joi.object().keys({
  slack: Joi.object().keys({
    enabled: Joi.boolean(),
    notify: Joi.any().valid('onAllScans', 'whenScanHasFindingsOnly', 'whenPRHasFindingsOnly'),
    webhookUrl: Joi.string()
      .empty(null)
      .uri()
  })
});

const preHookSchema = Joi.object().keys({
  enabled: Joi.boolean()
});

const engineRulesSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().pattern(
    Joi.string(),
    Joi.object().keys({ enable: Joi.boolean().required(), docs: Joi.string().empty('') })
  )
);

const guardrailsRulesSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().keys({
    enable: Joi.boolean().required(),
    title: Joi.string(),
    languages: Joi.object().pattern(Joi.string().valid(...allowedLanguages), Joi.boolean())
  })
);

const ignoreSchema = Joi.string().allow('', null);

const schema = Joi.object().keys({
  bundles: bundlesSchema,
  report: reportSchema,
  notifications: notificationsSchema,
  ignoreYmlConfig: Joi.boolean(),
  ignore: ignoreSchema,
  useGitClone: Joi.boolean(),
  ruleOverride: Joi.object().keys({
    engineRules: engineRulesSchema,
    GuardRailsRules: guardrailsRulesSchema
  }),
  excludeBundles: bundlesSchema,
  monorepo: Joi.array()
    .allow(false, null, '')
    .items(
      Joi.string(),
      Joi.object().pattern(
        /./,
        Joi.object().keys({
          bundles: bundlesSchema,
          report: reportSchema,
          notifications: notificationsSchema,
          ignoreYmlConfig: Joi.boolean(),
          ignore: ignoreSchema,
          useGitClone: Joi.boolean(),
          ruleOverride: Joi.object().keys({
            engineRules: engineRulesSchema,
            GuardRailsRules: guardrailsRulesSchema
          }),
          excludeBundles: bundlesSchema
        })
      )
    ),
  preHook: preHookSchema
});

const semgrepRulesSchema = Joi.object().keys({
  rules: Joi.array().items(
    Joi.object()
      .keys({
        id: Joi.string(),
        metadata: Joi.object()
          .keys({
            grId: Joi.string(),
            grSeverity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
          })
          .unknown(),
        message: Joi.string(),
        severity: Joi.string().valid('INFO', 'WARNING', 'ERROR'),
        languages: Joi.array()
          .min(1)
          .items(Joi.string().regex(/[a-zA-Z0-9#.-]+/))
      })
      .unknown()
  )
});

const parseMonorepo = monorepo => {
  if (monorepo && typeof monorepo === 'string') {
    return yaml.safeLoad(monorepo);
  }

  return false;
};

// temporary logic that transfer the value of ignoreFile (if set) to ignore
// and remove ignoreFile
const convertIgnoreFileToIgnore = config => {
  if (config.ignoreFile && config.ignoreFile.length) {
    // eslint-disable-next-line no-param-reassign
    config.ignore = config.ignoreFile;
    // eslint-disable-next-line no-param-reassign
    delete config.ignoreFile;
  }

  return config;
};

const validateInstallationConfig = configuration => {
  const configurationObject =
    typeof configuration === 'string' ? yaml.safeLoad(JSON.parse(configuration)) : configuration;
  configurationObject.monorepo = parseMonorepo(configurationObject.monorepo);

  const { error } = schema.validate(convertIgnoreFileToIgnore(configurationObject));
  if (error) {
    throw error;
  }
  return configurationObject;
};

const validateCustomConfigRules = (data, validation) => {
  if (validation === 'semgrep' || validation === 'yaml') {
    const { error } = semgrepRulesSchema.validate(data);
    if (error) {
      throw error;
    }
  }
  return data;
};

const upperCasePropertyPipeline = (data, properties) => {
  // Shallow copy still has side effect
  const transformedData = { ...data };
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const propertyValue = lodashGet(data, property);
    if (propertyValue) {
      lodashSet(transformedData, property, propertyValue.toUpperCase());
    }
  }
  return transformedData;
};

const transformCustomConfigRules = data => {
  // Shallow copy still has side effect
  const transformedData = { ...data };
  const rulesTransformedData = data.rules.map(rule =>
    upperCasePropertyPipeline(rule, ['severity', 'metadata.grSeverity'])
  );
  transformedData.rules = rulesTransformedData;
  return transformedData;
};

module.exports = {
  validateInstallationConfig,
  validateCustomConfigRules,
  transformCustomConfigRules,
  upperCasePropertyPipeline,
  allowedLanguages
};
