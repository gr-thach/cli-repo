interface BBDCPersonalProjectOwner {
  name: string;
  emailAddress: string;
  id: number;
  displayName: string;
  active: boolean;
  slug: string;
  type: string; // 'NORMAL'
  links: {}[];
}

export interface BBDCProject {
  key: string;
  id: number;
  name: string;
  description: string;
  public: boolean;
  type: string; // 'NORMAL' | 'PERSONAL'
}

export interface BBDCPersonalProject extends BBDCProject {
  owner: BBDCPersonalProjectOwner;
}

export interface BBDCRepository {
  id: number;
  slug: string;
  name: string;
  hierarchyId: string;
  scmId: string;
  state: string; // AVAILABLE
  statusMessage: string; // Available
  forkable: boolean;
  origin?: {}; // TODO
  project: {
    key: string;
  };
  public: boolean;
  links: {}[];
  // description: string; // Seems like we don't have this
  // default_branch: string; // Seems like we don't have this
}

export interface BBDCUser {
  id: number;
}

export interface BBDCWebhook {
  name: string;
}

export interface BBDCBranch {
  id: string;
  name: string; // this extra field will be filled with displayId, this is done on the BBDC Service
  displayId: string;
  type: string; // 'BRANCH'
  latestCommit: string;
  latestChangeset: string;
  isDefault: boolean;
}
