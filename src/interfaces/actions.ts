// type ActionObject = { [key: string]: string | number | boolean | undefined | null };

export interface BaseAction {
  fkRepository: number;
  fkRule: number;
  fkAccount: number;
  path: string;
}

export interface GenericAction extends BaseAction {
  lineContent: string | null;
}

export interface ScaAction extends BaseAction {
  dependencyName: string | null | undefined;
  transitiveDependency: string | boolean | null | undefined;
  dependencyVersion?: string;
}

interface GrPartialRule {
  idRule: number;
  name?: string;
  title?: string;
}

interface GrPartialEngineRule {
  idEngineRule: number;
  name?: string;
}

interface GrPartialRepository {
  idRepository: number;
  name?: string;
}

interface GrPartialAccount {
  idAccount: number;
  login?: string;
}

export enum ActionStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export enum ActionType {
  WONT_FIX = 'WONT_FIX',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  MARK_AS_FIXED = 'MARK_AS_FIXED',
  MARK_AS_VULNERABILITY = 'MARK_AS_VULNERABILITY'
}
export interface Action {
  idAction: number;
  action: ActionType;
  path: string;
  lineNumber?: number;
  lineContent?: string;
  dependencyName?: string;
  dependencyVersion?: string;
  transitiveDependency?: string;
  rule: GrPartialRule;
  engineRule: GrPartialEngineRule;
  repository: GrPartialRepository;
  account: GrPartialAccount;
  status?: ActionStatus;
}
