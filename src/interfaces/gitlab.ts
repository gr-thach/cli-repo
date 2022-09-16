export interface GitlabGroup {
  id: number;
  web_url: string;
  name: string;
  path: string;
  description: string;
  visibility: string; // 'private' | ?
  share_with_group_lock: boolean;
  require_two_factor_authentication: boolean;
  two_factor_grace_period: number;
  project_creation_level: string;
  auto_devops_enabled: null; // ?
  subgroup_creation_level: string;
  emails_disabled: null; // ?
  mentions_disabled: null; // ?
  lfs_enabled: boolean;
  default_branch_protection: number;
  avatar_url: string | null;
  request_access_enabled: boolean;
  full_name: string;
  full_path: string;
  created_at: string; // '2021-01-26T04:48:30.067Z'
  parent_id: number | null;
  ldap_cn: null; // ?
  ldap_access: null; // ?
}

export interface GitlabPermissions {
  access_level: number;
  notification_level: number;
}

export interface GitlabRepository {
  id: number;
  description: string;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  created_at: string; // '2016-06-06T04:57:54.226Z'
  default_branch: string;
  tag_list: [];
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  readme_url: string;
  avatar_url: string | null;
  forks_count: number;
  star_count: number;
  last_activity_at: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string; // 'user'
    full_path: string;
    parent_id: number | null;
    avatar_url: string;
    web_url: string;
  };
  container_registry_image_prefix: string;
  _links: {
    self: string;
    issues: string;
    merge_requests: string;
    repo_branches: string;
    labels: string;
    events: string;
    members: string;
  };
  packages_enabled: null; // ?
  empty_repo: boolean;
  archived: boolean;
  visibility: string; // 'private' | 'public' ?
  owner: {
    id: number;
    name: string;
    username: string;
    state: string; // 'active' | what else?
    avatar_url: string;
    web_url: string;
  };
  resolve_outdated_diff_discussions: null; // ?
  container_registry_enabled: boolean;
  issues_enabled: boolean;
  merge_requests_enabled: boolean;
  wiki_enabled: boolean;
  jobs_enabled: boolean;
  snippets_enabled: boolean;
  service_desk_enabled: boolean | null;
  service_desk_address: boolean | null;
  can_create_merge_request_in: boolean;
  issues_access_level: string; // 'enabled' | what else?
  repository_access_level: string; // 'enabled' | what else?
  merge_requests_access_level: string; // 'enabled' | what else?
  forking_access_level: string; // 'enabled' | what else?
  wiki_access_level: string; // 'enabled' | what else?
  builds_access_level: string; // 'enabled' | what else?
  snippets_access_level: string; // 'enabled' | what else?
  pages_access_level: string; // 'public' | what else?
  operations_access_level: string; // 'enabled' | what else?
  analytics_access_level: string; // 'enabled' | what else?
  emails_disabled: boolean | null; // ?
  shared_runners_enabled: boolean;
  lfs_enabled: boolean;
  creator_id: number;
  import_status: string; // 'none' | what else?
  open_issues_count: number;
  ci_default_git_depth: null; // ?
  ci_forward_deployment_enabled: null; // ?
  public_jobs: boolean;
  build_timeout: number; // seconds
  auto_cancel_pending_pipelines: string; // 'enabled' | what else
  build_coverage_regex: null; // ?
  ci_config_path: null; // ?
  shared_with_groups: []; // ?
  only_allow_merge_if_pipeline_succeeds: boolean;
  allow_merge_on_skipped_pipeline: null; // ?
  restrict_user_defined_variables: boolean;
  request_access_enabled: boolean;
  only_allow_merge_if_all_discussions_are_resolved: null; // ?
  remove_source_branch_after_merge: null; // ?
  printing_merge_request_link_enabled: boolean;
  merge_method: string; // 'merge' | what else?
  suggestion_commit_message: null; // ?
  auto_devops_enabled: boolean;
  auto_devops_deploy_strategy: string; // 'continuous' | what else?
  autoclose_referenced_issues: boolean;
  external_authorization_classification_label: string; // ?
  requirements_enabled: boolean;
  security_and_compliance_enabled: boolean;
  compliance_frameworks: []; // ?
  permissions: {
    project_access: GitlabPermissions;
    group_access: GitlabPermissions | null;
  };
}

export interface GitlabWebhook {
  url: string;
}

export interface GitlabMember {
  id: number;
  username: string;
}

export interface GitlabUser {
  id: number;
  path: string;
  kind: string; // 'user'
  name: string;
  username: string;
  state: string; // 'active' | 'blocked'
  avatar_url: string;
  web_url: string;
  created_at: string;
  bio: string;
  bio_html: string;
  location: string;
  public_email: string;
  skype: string;
  linkedin: string;
  twitter: string;
  website_url: string;
  organization: string;
  job_title: string;
  bot: boolean;
  work_information: null;
  followers: number;
  following: number;
  last_sign_in_at: string; // '2021-03-19T12:37:39.122Z' <-- this is the date format for all "_at" attrs
  confirmed_at: string;
  last_activity_on: string; // '2021-03-23'
  email: string;
  theme_id: number | null;
  color_scheme_id: number;
  projects_limit: number;
  current_sign_in_at: string;
  identities: { provider: string; extern_uid: number }[];
  can_create_group: boolean;
  can_create_project: boolean;
  two_factor_enabled: boolean;
  external: boolean;
  private_profile: boolean;
  shared_runners_minutes_limit: number;
  extra_shared_runners_minutes_limit: number | null;
}

export interface GitlabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: {
    author_email: string;
    author_name: string;
    authored_date: string; // date
    committed_date: string; // date
    committer_email: string;
    committer_name: string;
    id: string;
    short_id: string;
    title: string;
    message: string;
    parent_ids: string[];
  };
}
