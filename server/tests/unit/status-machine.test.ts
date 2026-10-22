import { describe, it, expect } from 'vitest';
import { ALLOWED_STATUS_TRANSITIONS, PropertyStatus } from '@estateflow/shared';

describe('Listing Status State Machine', () => {
  it('should allow DRAFT to transition to ACTIVE', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.DRAFT]).toContain(PropertyStatus.ACTIVE);
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.DRAFT]).not.toContain(PropertyStatus.SOLD);
  });

  it('should allow ACTIVE to transition to UNDER_OFFER or INACTIVE', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.ACTIVE]).toEqual([
      PropertyStatus.UNDER_OFFER,
      PropertyStatus.INACTIVE,
    ]);
  });

  it('should allow UNDER_OFFER to transition to ACTIVE, SOLD, or RENTED', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.UNDER_OFFER]).toEqual([
      PropertyStatus.ACTIVE,
      PropertyStatus.SOLD,
      PropertyStatus.RENTED,
    ]);
  });

  it('should treat SOLD and RENTED as terminal states', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.SOLD]).toHaveLength(0);
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.RENTED]).toHaveLength(0);
  });

  it('should allow INACTIVE to transition back to ACTIVE', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[PropertyStatus.INACTIVE]).toContain(PropertyStatus.ACTIVE);
  });
});
