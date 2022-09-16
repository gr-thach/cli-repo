export interface EngineConfig {
  idEngineConfig?: string;
  fkAccount: number;
  specId: string;
  format: 'yaml' | 'json';
  validation: string;
  rules?: string;
  envVars?: string;
  engine: {
    name: string;
    idEngine: number;
    language: string;
  };
}

export interface CustomConfigSpec {
  specId: string;
  validation: string;
  format: string;
  engine: {
    idEngine: number;
    name: string;
    language: string;
  };
}

export interface CustomEngineRule {
  id: string;
  metadata: {
    [key: string]: string;
  };
  fkAccount: number;
}

export interface CustomEngineRuleFile {
  rules: CustomEngineRule[];
}

export interface CustomEngineRuleSchema {
  name: string;
  fkEngine: number;
  fkAccount: number;
  grId: string;
  title: string;
  docs?: string;
  enable?: boolean;
  order?: string;
  cwe?: string;
  cwecategory?: string;
  cvssVector?: string;
  cvssScore?: string;
  cvssSeverity?: string;
  asvs?: string;
  capec?: string;
  owasp?: string;
}

export interface CustomEngineRuleDao {
  name: string;
  fkEngine: number;
  fkAccount: number;
  rule: {
    name: string;
  };
  title: string;
  docs?: string;
  enable?: boolean;
  order?: string;
  cwe?: string;
  cwecategory?: string;
  cvssVector?: string;
  cvssScore?: string;
  cvssSeverity?: string;
  asvs?: string;
  capec?: string;
  owasp?: string;
}
