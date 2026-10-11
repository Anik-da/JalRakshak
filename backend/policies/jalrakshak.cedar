// ==============================================================================
// JalRakshak AI — AWS Cedar Policy Definitions
// Open Source Authorization Language by AWS
// WeMakeDevs Environmental Hacks 2026
// ==============================================================================

// 1. Administrators can perform moderation and view audit logs
permit (
  principal in JalRakshak::Role::"ADMIN",
  action in [
    JalRakshak::Action::"verifyReport",
    JalRakshak::Action::"rejectReport",
    JalRakshak::Action::"viewAuditLogs",
    JalRakshak::Action::"triggerScheduledAlerts"
  ],
  resource
);

// 2. Authenticated users and administrators can submit flood reports
permit (
  principal,
  action in [
    JalRakshak::Action::"createReport",
    JalRakshak::Action::"uploadPhoto",
    JalRakshak::Action::"submitGroundTruthFeedback"
  ],
  resource
)
when {
  principal.isAnonymous != true
};

// 3. Public read access to hazard maps, intelligence, and simulations
permit (
  principal,
  action in [
    JalRakshak::Action::"viewMap",
    JalRakshak::Action::"viewRiskIntelligence",
    JalRakshak::Action::"runRainfallSimulation",
    JalRakshak::Action::"searchIncidents"
  ],
  resource
);

// 4. Users can only manage their own alert preferences and notification history
permit (
  principal,
  action in [
    JalRakshak::Action::"getAlertPreferences",
    JalRakshak::Action::"updateAlertPreferences",
    JalRakshak::Action::"getNotifications",
    JalRakshak::Action::"markNotificationRead"
  ],
  resource
)
when {
  resource.owner == principal.id || principal in JalRakshak::Role::"ADMIN"
};

// 5. Explicit safety guard: forbid actions from banned users
forbid (
  principal,
  action,
  resource
)
when {
  principal.isBanned == true
};
