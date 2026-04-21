import { shouldShowDeletedColumn } from './index';

describe('shouldShowDeletedColumn', () => {
    it('shows deleted_at in onlyDeleted mode', () => {
        expect(shouldShowDeletedColumn(true, false)).toBe(true);
    });

    it('shows deleted_at in showDeleted mode', () => {
        expect(shouldShowDeletedColumn(false, true)).toBe(true);
    });

    it('hides deleted_at when no deleted filter is active', () => {
        expect(shouldShowDeletedColumn(false, false)).toBe(false);
    });
});
