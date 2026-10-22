import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginatedResponse } from '../../src/utils/pagination';

describe('Pagination Utils', () => {
  it('should parse default pagination params when query is empty', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should parse custom page and limit', () => {
    const result = parsePagination({ page: '3', limit: '15' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(15);
    expect(result.offset).toBe(30);
  });

  it('should clamp limit to max 100', () => {
    const result = parsePagination({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('should clamp page to min 1', () => {
    const result = parsePagination({ page: '-5' });
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('should build formatted paginated response with totalPages', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const res = buildPaginatedResponse(data, 45, { page: 2, limit: 10, offset: 10 });
    expect(res.data).toEqual(data);
    expect(res.total).toBe(45);
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
    expect(res.totalPages).toBe(5);
  });
});
