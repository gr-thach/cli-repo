/* eslint-disable no-unused-vars */
export enum PlanFeatureName {
  LANG_EXCLUSIONS = 'LANG_EXCLUSIONS',
  SCANNING_ON = 'SCANNING_ON',
  // INSIGHTS = 'INSIGHTS',
  RETENTION = 'RETENTION',
  // CUSTOM_CONFIG = 'CUSTOM_CONFIG',
  // API = 'API',
  // SSO = 'SSO',
  // CUSTOM_ENGINES = 'CUSTOM_ENGINES',
  PRIVATE_REPOSITORIES = 'PRIVATE_REPOSITORIES'
}

export enum SpecialPlanCode {
  ONPREMISE = 'ONPREMISE'
}

export enum PlanCode {
  OPEN_SOURCE = 'GR_OPEN_SOURCE',
  INDIVIDUAL = 'GR_INDIVIDUAL',
  STARTUP = 'GR_STARTUP',
  BUSINESS = 'GR_BUSINESS',
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum SubscriptionInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface PlanFeature {
  feature: PlanFeatureName;
  value: string; // "NONE" | "ALL" | "YES" | "NO" | "UNLIMITED" | "PR" | number
}

export interface Plan {
  idPlan: number;
  name: string;
  code: PlanCode;
  description: string;
  bullets: string;
  queuePriority: number;
  createdAt: string;
  updatedAt: string;
  features: Array<PlanFeature>;
}

export interface Subscription {
  idSubscription: number;
  fkPlan: number;
  plan: Plan;
  interval: SubscriptionInterval;
  periodStart: string | null;
  periodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string;
  status: SubscriptionStatus | null;
  hadFreeTrial: boolean;
  isCheckoutCompleted: boolean;
  trialEnd: number;
  cancelAtPeriodEnd: boolean;
  extraRepositories: number;
  updatedAt: string;
}

export interface SubscriptionPatch {
  idSubscription?: number;
  fkPlan?: number;
  plan?: Plan;
  interval?: SubscriptionInterval;
  periodStart?: string | null;
  periodEnd?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string;
  status?: SubscriptionStatus | null;
  hadFreeTrial?: boolean;
  isCheckoutCompleted?: boolean;
  trialEnd?: number;
  cancelAtPeriodEnd?: boolean;
  extraRepositories?: number;
  updatedAt: string;
}
