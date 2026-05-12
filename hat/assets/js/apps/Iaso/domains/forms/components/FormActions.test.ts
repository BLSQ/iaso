import { shouldShowRestoreAction } from './FormActions';

describe('shouldShowRestoreAction', () => {
    it('shows restore for all rows in onlyDeleted mode', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: true,
                showDeleted: false,
                deletedAt: null,
            }),
        ).toBe(true);
    });

    it('shows restore for deleted rows in showDeleted mode', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: false,
                showDeleted: true,
                deletedAt: '2026-04-20T10:00:00Z',
            }),
        ).toBe(true);
    });

    it('keeps normal actions for non-deleted rows in showDeleted mode', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: false,
                showDeleted: true,
                deletedAt: null,
            }),
        ).toBe(false);
    });

    it('keeps normal actions when no deleted filter is active', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: false,
                showDeleted: false,
                deletedAt: '2026-04-20T10:00:00Z',
            }),
        ).toBe(false);
    });
});
