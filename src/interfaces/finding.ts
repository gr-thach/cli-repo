import { ActionType } from './actions';

export enum FindingAutomaticStatus {
  VULNERABILITY = 'VULNERABILITY',
  FIXED = 'FIXED'
}

export type FindingStatus = ActionType | FindingAutomaticStatus;

export interface FindingEngineRule {
  idEngineRule: number;
  name: string;
  engine: {
    language: string;
  };
}

export interface FindingCustomEngineRule {
  idCustomEngineRule: number;
  name: string;
  engine: {
    language: string;
  };
}
export interface Finding {
  idFinding: string;
  fkRepository: number;
  repository: {
    idRepository: number;
    name: string;
    fkAccount: number;
  };
  branch: string;
  path: string;
  lineNumber: number;
  fkEngineRule: number | null;
  fkCustomEngineRule: number | null;
  fkRule: number;
  rule: {
    idRule: number;
    name: string;
    title: string;
    docs: string;
  };
  fkSeverity: number | null; // can it be null?
  severity: {
    idSeverity: number;
    name: string;
  };
  score: number | null;
  status: FindingStatus | null;
  metadata: {} | null;
  language: string | null;
  type: string | null;
  lineContent: string | null;
  ticketLink: string | null;
  introducedBy: string | null;
  introducedAt: string | null;
  fixedBy: string | null;
  fixedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum FindingCodeBlockError {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNKNOWN = 'UNKNOWN',
  NO_SCAN = 'NO_SCAN'
}
