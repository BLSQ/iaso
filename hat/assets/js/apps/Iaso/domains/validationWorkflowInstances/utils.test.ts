import { describe, expect, it } from 'vitest';
import { daysSince, getSubmissionLabel, getSubmissionUrl } from './utils';

const form = { id: 7, name: 'Pièce justificative' };

describe('getSubmissionLabel', () => {
    it('uses the label keys values when there are some', () => {
        expect(
            getSubmissionLabel({ id: 12, form, display_name: 'FAC-2026-0412' }),
        ).toBe('Pièce justificative — FAC-2026-0412');
    });

    it('falls back to the submission id', () => {
        expect(getSubmissionLabel({ id: 12, form, display_name: null })).toBe(
            'Pièce justificative — #12',
        );
        expect(getSubmissionLabel({ id: 12, form, display_name: '' })).toBe(
            'Pièce justificative — #12',
        );
    });
});

describe('getSubmissionUrl', () => {
    it('opens the submission in validation mode by default', () => {
        expect(getSubmissionUrl({ item: { id: 12, form }, accountId: 3 })).toBe(
            '/forms/submission/referenceFormId/7/instanceId/12/accountId/3/isValidating/true/',
        );
    });

    it('can open the submission without validation mode', () => {
        expect(
            getSubmissionUrl({
                item: { id: 12, form },
                accountId: 3,
                isValidating: false,
            }),
        ).toBe(
            '/forms/submission/referenceFormId/7/instanceId/12/accountId/3/',
        );
    });
});

describe('daysSince', () => {
    it('counts the full days elapsed', () => {
        expect(daysSince('2026-03-01T10:00:00Z', '2026-03-12T09:00:00Z')).toBe(
            10,
        );
        expect(daysSince('2026-03-01T10:00:00Z', '2026-03-12T11:00:00Z')).toBe(
            11,
        );
    });

    it('is never negative', () => {
        expect(daysSince('2026-03-12T10:00:00Z', '2026-03-01T10:00:00Z')).toBe(
            0,
        );
    });
});
