import { describe, it, expect } from 'vitest';
import { LeadStage } from '@estateflow/shared';

const ALLOWED_STAGE_TRANSITIONS: Record<string, string[]> = {
  NEW: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'DROPPED'],
  SITE_VISIT_SCHEDULED: ['NEGOTIATION', 'DROPPED'],
  NEGOTIATION: ['CLOSED', 'DROPPED'],
  CLOSED: [],
  DROPPED: [],
};

describe('Lead Pipeline Stage Transitions', () => {
  it('should allow valid stage transitions from NEW', () => {
    expect(ALLOWED_STAGE_TRANSITIONS[LeadStage.NEW]).toContain(LeadStage.SITE_VISIT_SCHEDULED);
    expect(ALLOWED_STAGE_TRANSITIONS[LeadStage.NEW]).toContain(LeadStage.NEGOTIATION);
    expect(ALLOWED_STAGE_TRANSITIONS[LeadStage.NEW]).toContain(LeadStage.DROPPED);
  });

  it('should prevent direct jump from NEW to CLOSED without negotiation', () => {
    expect(ALLOWED_STAGE_TRANSITIONS[LeadStage.NEW]).not.toContain(LeadStage.CLOSED);
  });

  it('should treat CLOSED and DROPPED as terminal pipeline stages', () => {
    expect(ALLOWED_STAGE_TRANSITIONS[LeadStage.CLOSED]).toHaveLength(0);
    expect(ALLOWED_STAGE_TRANSITIONS[LeadStage.DROPPED]).toHaveLength(0);
  });
});
