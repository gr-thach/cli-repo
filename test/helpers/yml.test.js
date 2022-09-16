const { upperCasePropertyPipeline, transformCustomConfigRules } = require('../../src/helpers/yml');

describe('Utils', () => {
  let validateInstallationConfig;
  let validateCustomConfigRules;
  beforeAll(async () => {
    ({ validateInstallationConfig, validateCustomConfigRules } = require('../../src/helpers/yml')); // eslint-disable-line global-require
  });
  beforeEach(() => {
    jest.resetModules();
  });

  describe('upperCasePropertyPipeline', () => {
    it('should uppercase value of property of object', () => {
      const data = {
        id: '123',
        severity: 'info',
        metadata: {
          grSeverity: 'low'
        }
      };
      const transformedData = upperCasePropertyPipeline(data, [
        'id',
        'severity',
        'metadata.grSeverity'
      ]);
      expect(transformedData.id).toEqual(data.id.toUpperCase());
      expect(transformedData.severity).toEqual(data.severity.toUpperCase());
      expect(transformedData.metadata.grSeverity).toEqual(data.metadata.grSeverity.toUpperCase());
    });
  });

  describe('transformCustomConfigRules', () => {
    it('should uppercase value of property of object', () => {
      const data = {
        rules: [
          {
            severity: 'Info',
            metadata: {
              grSeverity: 'low'
            }
          },
          {
            severity: 'WARNING',
            metadata: {
              grSeverity: 'Medium'
            }
          }
        ]
      };
      const transformedData = transformCustomConfigRules(data, 'semgrep');
      for (let i = 0; i < data.rules.length; i++) {
        expect(transformedData.rules[i].severity).toEqual(data.rules[i].severity.toUpperCase());
        expect(transformedData.rules[i].metadata.grSeverity).toEqual(
          data.rules[i].metadata.grSeverity.toUpperCase()
        );
      }
    });

    it('should return the object with uppercase severity and grSeverity', () => {
      const data = {
        rules: [
          {
            severity: 'error',
            metadata: {
              grSeverity: 'medium'
            }
          }
        ]
      };
      const transformedData = transformCustomConfigRules(data);
      for (let i = 0; i < data.rules.length; i++) {
        expect(transformedData.rules[i].severity).toEqual(data.rules[i].severity.toUpperCase());
        expect(transformedData.rules[i].metadata.grSeverity).toEqual(
          data.rules[i].metadata.grSeverity.toUpperCase()
        );
      }
    });
  });

  describe('validateInstallationConfig', () => {
    it('should throw error if can not parse yaml', () => {
      expect(() => {
        validateInstallationConfig('"bundles": "');
      }).toThrow('Unexpected token : in JSON at position 9');
      expect(() => {
        validateInstallationConfig('"bundles: \\""');
      }).toThrow('unexpected end of the stream within a double quoted scalar at line 2, column 1');
    });

    it('Properly checks field', () => {
      expect(() => {
        validateInstallationConfig(
          '"bundles: \\n  - javascript\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFiles\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: http://localhost\\n    notify: onAllScans\\n"'
        );
      }).not.toThrow();
      expect(() => {
        validateInstallationConfig(
          '"bundles: \\n  - haskell\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFiles\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: http://localhost\\n    notify: onAllScans\\n"'
        );
      }).toThrow();
      expect(() => {
        validateInstallationConfig(
          '"bundles: \\n  - javascript\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFile\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: http://localhost\\n    notify: onAllScans\\n"'
        );
      }).toThrow();
      expect(() => {
        validateInstallationConfig(
          '"bundles: \\n  - javascript\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFiles\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: localhost\\n    notify: onAllScans\\n"'
        );
      }).toThrow();
    });
  });

  describe('validateCustomConfigRules', () => {
    describe('validate customer config rule with semgrep validation', () => {
      it('should throw error if severity is not a value on the list INFO, WARNING, ERROR', () => {
        const customEngineRules = {
          rules: [
            {
              id: 'custom-guardrails-test-rule-go',
              patterns: [
                {
                  pattern: 'dangerousFunction(...)\n'
                },
                {
                  'pattern-not': 'dangerousFunction("...")\n'
                }
              ],
              message: 'The dangerousFunction is called.',
              severity: 'LOW',
              languages: ['go'],
              metadata: {
                grId: 'GR0002',
                grTitle: 'Use of dangerousFunction()',
                grDocs: 'https://docs.example.com/dont-use-dangerous-function'
              }
            }
          ]
        };
        expect(() => {
          validateCustomConfigRules(customEngineRules, 'semgrep');
        }).toThrow('rules[0].severity" must be one of [INFO, WARNING, ERROR]');
      });

      it('should throw error if metadata.grSeverity is not a value on the list LOW, MEDIUM, HIGH, CRITICAL', () => {
        const customEngineRules = {
          rules: [
            {
              id: 'custom-guardrails-test-rule-go',
              patterns: [
                {
                  pattern: 'dangerousFunction(...)\n'
                },
                {
                  'pattern-not': 'dangerousFunction("...")\n'
                }
              ],
              message: 'The dangerousFunction is called.',
              severity: 'ERROR',
              languages: ['go'],
              metadata: {
                grId: 'GR0002',
                grTitle: 'Use of dangerousFunction()',
                grDocs: 'https://docs.example.com/dont-use-dangerous-function',
                grSeverity: 'WARNING'
              }
            }
          ]
        };
        expect(() => {
          validateCustomConfigRules(customEngineRules, 'semgrep');
        }).toThrow('rules[0].metadata.grSeverity" must be one of [LOW, MEDIUM, HIGH, CRITICAL]');
      });
    });

    it('should throw error if metadata.grSeverity is not a value on the list LOW, MEDIUM, HIGH, CRITICAL', () => {
      const customEngineRules = {
        rules: [
          {
            id: 'custom-guardrails-test-rule-go',
            patterns: [
              {
                pattern: 'dangerousFunction(...)\n'
              },
              {
                'pattern-not': 'dangerousFunction("...")\n'
              }
            ],
            message: 'The dangerousFunction is called.',
            severity: 'ERROR',
            languages: ['go'],
            metadata: {
              grId: 'GR0002',
              grTitle: 'Use of dangerousFunction()',
              grDocs: 'https://docs.example.com/dont-use-dangerous-function',
              grSeverity: 'WARNING'
            }
          }
        ]
      };
      expect(() => {
        validateCustomConfigRules(customEngineRules, 'semgrep');
      }).toThrow('rules[0].metadata.grSeverity" must be one of [LOW, MEDIUM, HIGH, CRITICAL]');
    });

    it('should throw error if id is not a string', () => {
      const customEngineRules = {
        rules: [
          {
            id: 1,
            patterns: [
              {
                pattern: 'dangerousFunction(...)\n'
              },
              {
                'pattern-not': 'dangerousFunction("...")\n'
              }
            ],
            message: 'The dangerousFunction is called.',
            severity: 'ERROR',
            languages: ['go'],
            metadata: {
              grId: 'GR0002',
              grTitle: 'Use of dangerousFunction()',
              grDocs: 'https://docs.example.com/dont-use-dangerous-function',
              grSeverity: 'MEDIUM'
            }
          }
        ]
      };
      expect(() => {
        validateCustomConfigRules(customEngineRules, 'semgrep');
      }).toThrow('rules[0].id" must be a string');
    });

    it('should throw error if a value on languages array is not qualified the regex /[a-zA-Z0-9#.-]+/', () => {
      const customEngineRules = {
        rules: [
          {
            id: 'custom-guardrails-test-rule-go',
            patterns: [
              {
                pattern: 'dangerousFunction(...)\n'
              },
              {
                'pattern-not': 'dangerousFunction("...")\n'
              }
            ],
            message: 'The dangerousFunction is called.',
            severity: 'ERROR',
            languages: ['$$'],
            metadata: {
              grId: 'GR0002',
              grTitle: 'Use of dangerousFunction()',
              grDocs: 'https://docs.example.com/dont-use-dangerous-function',
              grSeverity: 'MEDIUM'
            }
          }
        ]
      };
      expect(() => {
        validateCustomConfigRules(customEngineRules, 'semgrep');
      }).toThrow(
        'rules[0].languages[0]" with value "$$" fails to match the required pattern: /[a-zA-Z0-9#.-]+/'
      );
    });

    it('should throw error if metadata.grId is not a string', () => {
      const customEngineRules = {
        rules: [
          {
            id: 'custom-guardrails-test-rule-go',
            patterns: [
              {
                pattern: 'dangerousFunction(...)\n'
              },
              {
                'pattern-not': 'dangerousFunction("...")\n'
              }
            ],
            message: 'The dangerousFunction is called.',
            severity: 'ERROR',
            languages: ['go'],
            metadata: {
              grId: 1,
              grTitle: 'Use of dangerousFunction()',
              grDocs: 'https://docs.example.com/dont-use-dangerous-function',
              grSeverity: 'WARNING'
            }
          }
        ]
      };
      expect(() => {
        validateCustomConfigRules(customEngineRules, 'semgrep');
      }).toThrow('rules[0].metadata.grId" must be a string');
    });

    it('should return the input as the output if every property is valid', () => {
      const customEngineRules = {
        rules: [
          {
            id: 'custom-guardrails-test-rule-go',
            patterns: [
              {
                pattern: 'dangerousFunction(...)\n'
              },
              {
                'pattern-not': 'dangerousFunction("...")\n'
              }
            ],
            message: 'The dangerousFunction is called.',
            severity: 'ERROR',
            languages: ['go'],
            metadata: {
              grId: 'GR0002',
              grTitle: 'Use of dangerousFunction()',
              grDocs: 'https://docs.example.com/dont-use-dangerous-function',
              grSeverity: 'WARNING'
            }
          }
        ]
      };
      const result = validateCustomConfigRules(customEngineRules);
      expect(customEngineRules).toEqual(result);
    });

    describe('validate customer config rule with not semgrep validation', () => {
      it('should not run any validation rules and expect the output equal the input', () => {
        const customEngineRules = {
          rules: [
            {
              id: 'custom-guardrails-test-rule-go',
              patterns: [
                {
                  pattern: 'dangerousFunction(...)\n'
                },
                {
                  'pattern-not': 'dangerousFunction("...")\n'
                }
              ],
              message: 'The dangerousFunction is called.',
              severity: 'ERROR',
              languages: ['go'],
              metadata: {
                grId: 'GR0002',
                grTitle: 'Use of dangerousFunction()',
                grDocs: 'https://docs.example.com/dont-use-dangerous-function',
                grSeverity: 'LOW'
              }
            }
          ]
        };
        const result = validateCustomConfigRules(customEngineRules);
        expect(customEngineRules).toEqual(result);
      });
    });
  });
});
