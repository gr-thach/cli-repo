import { Finding } from './finding';

/* eslint-disable no-unused-vars */
export enum ScanType {
  PRE_HOOK = 'PRE_HOOK',
  CLI = 'CLI',
  BRANCH = 'BRANCH',
  PULL = 'PULL'
}

export interface ScanStatus {
  idScanStatus: number;
  name: 'queued' | 'scanning' | 'success' | 'error';
}

export interface ScanResult {
  idScanResult: number;
  name: 'pass' | 'fail';
}

export interface EngineRunFinding {
  finding: Finding;
  duplicatedWith: string;
  isVulnerability: boolean;
  filterReason: number;
}

export interface Engine {
  idEngine: number;
  name: string;
  description: string;
}

export interface EngineRun {
  idEngineRun: number;
  startedAt: string;
  finishedAt: string;
  engine: Engine;

  engineRunsFindings?: EngineRunFinding[];
}

export interface LastScan {
  fkRepository: number;
  totalVulnerabilities: number;
  branch: string;
  finishedAt: string;
}

export interface Scan {
  idScan: string;
  type: ScanType;
  branch: string;
  sha: string;
  githookMetadata: {
    ref: string;
    commit?: {
      message: string;
    };
    config: Record<string, unknown>;
    sender: {
      login: string;
      avatar_url: string;
    };
  };
  totalVulnerabilities: number;
  newVulnerabilities: number;
  queuedAt: string;
  scanningAt: string;
  finishedAt: string;
  prNumber: number | null;
  repository: {
    // Repository;
    idRepository: number;
    name: string;
    isEnabled: boolean;
  };
  status: ScanStatus;
  result: ScanResult;
  engineRuns: EngineRun[];
  isParanoid: boolean | null;
}
