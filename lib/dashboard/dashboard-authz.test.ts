import { describe, it, expect } from 'vitest'
import { roleRank, hasMinRole } from './roles'
import {
  isUuid,
  sanitizeFilename,
  isDownloadable,
  clampPage,
  clampPageSize,
} from './validation'
import { safeReturnTo } from '@/lib/auth/return-url'

describe('role hierarchy', () => {
  it('ranks owner > admin > member', () => {
    expect(roleRank('owner')).toBeGreaterThan(roleRank('admin'))
    expect(roleRank('admin')).toBeGreaterThan(roleRank('member'))
  })
  it('hasMinRole is satisfied at or above the threshold', () => {
    expect(hasMinRole('owner', 'admin')).toBe(true)
    expect(hasMinRole('admin', 'admin')).toBe(true)
    expect(hasMinRole('member', 'admin')).toBe(false)
    expect(hasMinRole('member', 'member')).toBe(true)
  })
})

describe('isUuid', () => {
  it('accepts a v4 uuid', () => {
    expect(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true)
  })
  it('rejects non-uuids and object-path smuggling', () => {
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid('../../etc/passwd')).toBe(false)
    expect(isUuid('seed/primary/clean-brief.csv')).toBe(false)
    expect(isUuid('')).toBe(false)
    expect(isUuid(null)).toBe(false)
  })
})

describe('sanitizeFilename', () => {
  it('strips path separators and control chars', () => {
    expect(sanitizeFilename('../../evil.pdf')).not.toContain('/')
    expect(sanitizeFilename('a\\b\\c.pdf')).not.toContain('\\')
  })
  it('falls back to a safe default when empty', () => {
    expect(sanitizeFilename('')).toBe('attachment')
    expect(sanitizeFilename('...')).toBe('attachment')
  })
})

describe('isDownloadable', () => {
  const clean = { leadId: 'x', uploadStatus: 'completed', scanStatus: 'clean' }
  it('allows clean + completed + associated', () => {
    expect(isDownloadable(clean)).toBe(true)
  })
  it('denies unassociated', () => {
    expect(isDownloadable({ ...clean, leadId: null })).toBe(false)
  })
  it('denies rejected', () => {
    expect(isDownloadable({ ...clean, scanStatus: 'rejected' })).toBe(false)
  })
  it('denies not-yet-completed uploads', () => {
    expect(isDownloadable({ ...clean, uploadStatus: 'authorized' })).toBe(false)
    expect(isDownloadable({ ...clean, scanStatus: 'pending' })).toBe(false)
  })
})

describe('clampPage / clampPageSize', () => {
  it('clamps page to >= 1', () => {
    expect(clampPage('0')).toBe(1)
    expect(clampPage('-4')).toBe(1)
    expect(clampPage('abc')).toBe(1)
    expect(clampPage('3')).toBe(3)
  })
  it('clamps page size within [1, max]', () => {
    expect(clampPageSize('0')).toBe(25)
    expect(clampPageSize('999')).toBe(100)
    expect(clampPageSize('10')).toBe(10)
    expect(clampPageSize('nope')).toBe(25)
  })
})

describe('safeReturnTo (open-redirect guard)', () => {
  it('allows same-origin paths', () => {
    expect(safeReturnTo('/dashboard/leads')).toBe('/dashboard/leads')
    expect(safeReturnTo('/dashboard/leads/abc?x=1')).toBe('/dashboard/leads/abc?x=1')
  })
  it('defaults to /dashboard for empty input', () => {
    expect(safeReturnTo(undefined)).toBe('/dashboard')
    expect(safeReturnTo(null)).toBe('/dashboard')
    expect(safeReturnTo('')).toBe('/dashboard')
  })
  it('blocks protocol-relative and absolute URLs', () => {
    expect(safeReturnTo('//evil.com')).toBe('/dashboard')
    expect(safeReturnTo('https://evil.com')).toBe('/dashboard')
    expect(safeReturnTo('/\\evil.com')).toBe('/dashboard')
    expect(safeReturnTo('/path\\with\\backslash')).toBe('/dashboard')
  })
})
