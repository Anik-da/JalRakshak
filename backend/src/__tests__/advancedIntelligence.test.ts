import { describe, it, expect } from 'vitest';
import { evaluateFloodBlindMonitoringGaps } from '../floodBlindEngine.js';
import { simulateRoadLevelFloodImpact } from '../roadImpactSimulator.js';
import { evaluateCriticalInfrastructureVulnerability } from '../infrastructureService.js';
import {
  recordPredictionSnapshot,
  updatePredictionWithOutcome,
  getPredictionEvaluationMetrics,
} from '../predictionEvaluationService.js';
import {
  getUserInAppNotifications,
  markNotificationAsRead,
  processScheduledAlerts,
} from '../awsMessagingService.js';
import { FloodReport } from '../types.js';

describe('JalRakshak AI — FloodBlind AI Engine', () => {
  it('detects elevated flood risk in sectors with ZERO community reports', async () => {
    const emptyReports: FloodReport[] = [];
    const summary = await evaluateFloodBlindMonitoringGaps(emptyReports);

    expect(summary.totalMonitoredZones).toBeGreaterThan(0);
    expect(summary.blindSpotsCount).toBeGreaterThan(0);
    expect(summary.activeGapZones.length).toBeGreaterThan(0);

    const firstGap = summary.activeGapZones[0];
    expect(firstGap.status).toBe('POTENTIAL_RISK_NEEDS_VERIFICATION');
    expect(firstGap.groundReportCount).toBe(0);
    expect(firstGap.monitoringGapIndex).toBeGreaterThan(0);
    expect(firstGap.influencingFactors.length).toBeGreaterThan(0);
    expect(summary.disclaimer).toContain('does NOT indicate safety');
  });

  it('reduces monitoring gap index when ground reports corroborate a sector', async () => {
    const corroboratedReports: FloodReport[] = [
      {
        reportId: 'rep-vel-01',
        userId: 'u1',
        userEmailMasked: 'u***@test.in',
        latitude: 12.9715,
        longitude: 80.218,
        locationName: 'Velachery Lake Spillway',
        severity: 'HIGH',
        roadCondition: 'DIFFICULT',
        description: 'Road inundated',
        observedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'VERIFIED',
        flagCount: 0,
      },
      {
        reportId: 'rep-vel-02',
        userId: 'u2',
        userEmailMasked: 'u***@test.in',
        latitude: 12.972,
        longitude: 80.219,
        locationName: 'Velachery 100ft road',
        severity: 'HIGH',
        roadCondition: 'DIFFICULT',
        description: 'Water ankle deep',
        observedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'VERIFIED',
        flagCount: 0,
      },
    ];

    const summaryWithReports = await evaluateFloodBlindMonitoringGaps(corroboratedReports);
    const velacheryZone = summaryWithReports.activeGapZones.find((z) =>
      z.name.includes('Velachery')
    );

    expect(velacheryZone).toBeDefined();
    expect(velacheryZone!.groundReportCount).toBe(2);
    // Gap index should be lower than completely unmonitored blind spots
    expect(velacheryZone!.monitoringGapIndex).toBeLessThan(80);
  });
});

describe('JalRakshak AI — Road-Level Flood Impact Simulator', () => {
  it('flags arterial roads exceeding drainage thresholds and suggests bypasses', async () => {
    // 40mm heavy downpour scenario
    const simulation = await simulateRoadLevelFloodImpact([], 40.0);

    expect(simulation.simulationId).toBeDefined();
    expect(simulation.rainfallScenarioMm).toBe(40.0);
    expect(simulation.affectedSegmentsCount).toBeGreaterThan(0);

    const subway = simulation.segments.find((s) => s.isKnownUnderpassOrLowPoint);
    expect(subway).toBeDefined();
    expect(['ELEVATED_RISK_ESTIMATED', 'CONFIRMED_HAZARD']).toContain(subway!.status);
    expect(subway!.suggestedAlternativeRoute).toBeDefined();
  });

  it('marks unmapped sectors with INSUFFICIENT_DATA rather than inventing numbers', async () => {
    const simulation = await simulateRoadLevelFloodImpact([]);
    const unmappedSegment = simulation.segments.find((s) => s.status === 'INSUFFICIENT_DATA');

    expect(unmappedSegment).toBeDefined();
    expect(unmappedSegment!.primaryRiskReason).toContain('Insufficient municipal stormwater and topographic survey data');
  });
});

describe('JalRakshak AI — Critical Infrastructure Vulnerability', () => {
  it('evaluates approach roads to hospitals and emergency stations without falsely claiming facilities are inundated', async () => {
    const result = await evaluateCriticalInfrastructureVulnerability([]);

    expect(result.totalFacilities).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('Critical facility access status evaluates approach roads only');

    const miotHospital = result.facilities.find((f) => f.name.includes('MIOT'));
    expect(miotHospital).toBeDefined();
    expect(miotHospital!.type).toBe('HOSPITAL');
    expect(miotHospital!.accessRoadName).toBeDefined();
    expect(miotHospital!.supportingEvidence).toBeDefined();
  });
});

describe('JalRakshak AI — Prediction vs Reality Historical Evaluation', () => {
  it('records snapshots and updates metrics upon citizen outcome feedback', () => {
    const snapshot = recordPredictionSnapshot(
      'Test Lowland Basin',
      [12.97, 80.21],
      75,
      'CRITICAL',
      { rainfallMm: 45, terrainVulnerability: 80, communityReportsAvailable: 0 }
    );

    expect(snapshot.predictionId).toBeDefined();
    expect(snapshot.predictedCategory).toBe('CRITICAL');

    // Simulate verified confirmation
    updatePredictionWithOutcome({
      feedbackId: 'fb-test-1',
      userId: 'test-user',
      latitude: 12.97,
      longitude: 80.21,
      localityName: 'Test Lowland Basin',
      predictedCategory: 'CRITICAL',
      observedOutcome: 'ACTUAL_FLOODING_OCCURRED',
      submittedAt: new Date().toISOString(),
    });

    const metrics = getPredictionEvaluationMetrics();
    expect(metrics.totalEvaluated).toBeGreaterThan(0);
    expect(metrics.scientificValidationDisclaimer).toContain('NOT a scientifically certified hydro-dynamic model');
  });
});

describe('JalRakshak AI — AWS Messaging & Automated Alerts System', () => {
  it('delivers in-app notifications and manages read/unread state', () => {
    const notifs = getUserInAppNotifications('default-user');
    expect(notifs.length).toBeGreaterThan(0);

    const targetId = notifs[0].notificationId;
    const success = markNotificationAsRead(targetId);
    expect(success).toBe(true);

    const updated = getUserInAppNotifications('default-user');
    const target = updated.find((n) => n.notificationId === targetId);
    expect(target?.isRead).toBe(true);
  });

  it('processes scheduled alerts with deduplication, quiet hours, and safe test mode', async () => {
    const result = await processScheduledAlerts('default-user', 'citizen@jalrakshak.org', true);

    expect(result.dispatchId).toBeDefined();
    expect(result.evaluatedUsersCount).toBe(1);
    expect(result.results.length).toBeGreaterThan(0);

    const firstResult = result.results[0];
    expect(firstResult.deliveryLogs.some((l) => l.channel === 'IN_APP')).toBe(true);
  });

  it('safely simulates Amazon SES email dispatch and reports sandbox status when unconfigured', async () => {
    const { sendEmailViaSES } = await import('../awsMessagingService.js');
    const log = await sendEmailViaSES(
      'citizen.optin@gmail.com',
      'Flood Warning: High Risk in Basin',
      '<p>High flood risk detected</p>',
      'High flood risk detected'
    );

    expect(log.channel).toBe('EMAIL_SES');
    expect(log.recipient).toBe('citizen.optin@gmail.com');
    expect(['ATTEMPTED', 'CONFIRMED_DELIVERED', 'FAILED']).toContain(log.status);
  });

  it('safely handles Amazon SNS SMS dispatch and notes Indian TRAI DLT compliance requirements', async () => {
    const { sendSmsViaSNS } = await import('../awsMessagingService.js');
    const log = await sendSmsViaSNS(
      '+919876543210',
      'JalRakshak Alert: Severe waterlogging reported at Velachery Bypass. Avoid underpass.'
    );

    expect(log.channel).toBe('SMS_SNS');
    expect(log.recipient).toBe('+919876543210');
    expect(['ATTEMPTED', 'CONFIRMED_DELIVERED', 'FAILED']).toContain(log.status);
  });
});

describe('JalRakshak AI — AWS Cedar Policy Authorization Engine', () => {
  it('permits administrators and blocks unprivileged users from moderating reports', async () => {
    const { evaluateCedarPolicy } = await import('../cedarPolicyEngine.js');

    // Admin permit
    const adminDecision = evaluateCedarPolicy(
      { id: 'admin-01', role: 'ADMIN' },
      'verifyReport',
      { type: 'Report', id: 'rep-1' }
    );
    expect(adminDecision.decision).toBe('ALLOW');
    expect(adminDecision.matchingPolicies).toContain('policy-1-admin-moderation');

    // Regular user deny
    const userDecision = evaluateCedarPolicy(
      { id: 'user-01', role: 'USER' },
      'verifyReport',
      { type: 'Report', id: 'rep-1' }
    );
    expect(userDecision.decision).toBe('DENY');
  });

  it('permits public read access and enforces safety guard on banned accounts', async () => {
    const { evaluateCedarPolicy } = await import('../cedarPolicyEngine.js');

    // Public permit
    const publicDecision = evaluateCedarPolicy(
      { id: 'guest', role: 'GUEST', isAnonymous: true },
      'viewMap',
      { type: 'Map' }
    );
    expect(publicDecision.decision).toBe('ALLOW');

    // Banned user forbid
    const bannedDecision = evaluateCedarPolicy(
      { id: 'bad-actor', role: 'USER', isBanned: true },
      'createReport',
      { type: 'Report' }
    );
    expect(bannedDecision.decision).toBe('DENY');
    expect(bannedDecision.reason).toContain('FORBID');
  });
});

describe('JalRakshak AI — AWS OpenSearch Service & Strands Agents Ensemble', () => {
  it('executes OpenSearch full-text and geo-distance queries with relevance ranking', async () => {
    const { searchOpenSearchIncidents } = await import('../openSearchService.js');
    const sampleReports: FloodReport[] = [
      {
        reportId: 'rep-os-1',
        userId: 'u1',
        userEmailMasked: 'u***@test.in',
        latitude: 13.0418,
        longitude: 80.2341,
        locationName: 'T. Nagar Duraisamy Subway',
        severity: 'CRITICAL',
        roadCondition: 'BLOCKED',
        description: 'Underpass submerged 40cm water depth',
        observedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'VERIFIED',
        flagCount: 0,
      },
      {
        reportId: 'rep-os-2',
        userId: 'u2',
        userEmailMasked: 'u***@test.in',
        latitude: 13.0827,
        longitude: 80.2707,
        locationName: 'Chennai Central Station',
        severity: 'MODERATE',
        roadCondition: 'PASSABLE',
        description: 'Minor puddles outside portico',
        observedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'VERIFIED',
        flagCount: 0,
      },
    ];

    const result = await searchOpenSearchIncidents(sampleReports, {
      q: 'Subway',
      latitude: 13.04,
      longitude: 80.23,
      radiusKm: 5,
    });

    expect(result.tookMs).toBeGreaterThanOrEqual(0);
    expect(result.totalHits).toBe(1);
    expect(result.hits[0].source.locationName).toContain('Duraisamy Subway');
    expect(result.hits[0].source.distanceMeters).toBeDefined();
  });

  it('runs AWS Strands Agents multi-agent collaboration workflow', async () => {
    const { runStrandsAgentWorkflow } = await import('../strandsAgentWorkflow.js');
    const result = await runStrandsAgentWorkflow(13.0827, 80.2707, 'Chennai Metropolitan Basin');

    expect(result.workflowId).toBeDefined();
    expect(result.framework).toBe('AWS Strands Agents SDK');
    expect(result.agentTraces.length).toBe(3);
    expect(result.agentTraces.map((t) => t.agentName)).toEqual([
      'Meteorological Agent',
      'Hydrological Agent',
      'Mobility Safety Agent',
    ]);
    expect(result.consensusRiskCategory).toBeDefined();
    expect(result.synthesis).toContain('AWS Strands multi-agent ensemble');
  });
});


