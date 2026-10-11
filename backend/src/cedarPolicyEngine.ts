/**
 * JalRakshak AI — AWS Cedar Policy Engine Integration
 * Open source policy language & authorization engine developed by AWS.
 *
 * Implements deterministic attribute-based (ABAC) and role-based (RBAC)
 * authorization based on backend/policies/jalrakshak.cedar.
 */

export interface CedarPrincipal {
  id: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
  email?: string;
  isBanned?: boolean;
  isAnonymous?: boolean;
}

export interface CedarAction {
  name:
    | 'verifyReport'
    | 'rejectReport'
    | 'viewAuditLogs'
    | 'triggerScheduledAlerts'
    | 'createReport'
    | 'uploadPhoto'
    | 'submitGroundTruthFeedback'
    | 'viewMap'
    | 'viewRiskIntelligence'
    | 'runRainfallSimulation'
    | 'searchIncidents'
    | 'getAlertPreferences'
    | 'updateAlertPreferences'
    | 'getNotifications'
    | 'markNotificationRead';
}

export interface CedarResource {
  type: string;
  id?: string;
  owner?: string;
}

export interface CedarDecision {
  decision: 'ALLOW' | 'DENY';
  reason: string;
  matchingPolicies: string[];
}

/**
 * Evaluates an authorization request against the Cedar policy rules.
 */
export function evaluateCedarPolicy(
  principal: CedarPrincipal,
  action: CedarAction['name'],
  resource: CedarResource
): CedarDecision {
  // 1. Explicit safety guard: forbid actions from banned users
  if (principal.isBanned) {
    return {
      decision: 'DENY',
      reason: 'FORBID: Principal is flagged as banned under Cedar policy safety rule #5.',
      matchingPolicies: ['policy-5-forbid-banned'],
    };
  }

  // 2. Administrators have permit on moderation and admin endpoints
  if (
    principal.role === 'ADMIN' &&
    ['verifyReport', 'rejectReport', 'viewAuditLogs', 'triggerScheduledAlerts'].includes(action)
  ) {
    return {
      decision: 'ALLOW',
      reason: 'PERMIT: Administrator authorized under Cedar policy rule #1.',
      matchingPolicies: ['policy-1-admin-moderation'],
    };
  }

  // Non-admins cannot perform administrative moderation
  if (['verifyReport', 'rejectReport', 'viewAuditLogs', 'triggerScheduledAlerts'].includes(action)) {
    return {
      decision: 'DENY',
      reason: 'DENY: Administrative action requires JalRakshak::Role::"ADMIN".',
      matchingPolicies: [],
    };
  }

  // 3. Authenticated users and administrators can submit reports and feedback
  if (
    ['createReport', 'uploadPhoto', 'submitGroundTruthFeedback'].includes(action)
  ) {
    if (principal.isAnonymous || principal.role === 'GUEST') {
      return {
        decision: 'DENY',
        reason: 'DENY: Submitting field observations requires verified authenticated session under Cedar rule #2.',
        matchingPolicies: [],
      };
    }
    return {
      decision: 'ALLOW',
      reason: 'PERMIT: Authenticated contributor authorized under Cedar rule #2.',
      matchingPolicies: ['policy-2-authenticated-reporting'],
    };
  }

  // 4. Public read access to maps, risk intelligence, simulations, and OpenSearch
  if (
    ['viewMap', 'viewRiskIntelligence', 'runRainfallSimulation', 'searchIncidents'].includes(action)
  ) {
    return {
      decision: 'ALLOW',
      reason: 'PERMIT: Public cartographic and intelligence telemetry permitted under Cedar rule #3.',
      matchingPolicies: ['policy-3-public-read-access'],
    };
  }

  // 5. User-scoped access to alert preferences and notification history
  if (
    ['getAlertPreferences', 'updateAlertPreferences', 'getNotifications', 'markNotificationRead'].includes(action)
  ) {
    if (principal.role === 'ADMIN' || (resource.owner && resource.owner === principal.id)) {
      return {
        decision: 'ALLOW',
        reason: 'PERMIT: Resource owner or administrator matched under Cedar rule #4.',
        matchingPolicies: ['policy-4-user-scoped-preferences'],
      };
    }
    return {
      decision: 'DENY',
      reason: 'DENY: Cannot access alert telemetry owned by a different user.',
      matchingPolicies: [],
    };
  }

  return {
    decision: 'DENY',
    reason: 'DEFAULT_DENY: No matching permit policy satisfied.',
    matchingPolicies: [],
  };
}
