import { describe, it, expect } from 'vitest';
import { mockFormatMessage } from './safeIntl';

describe('mockFormatMessage', () => {
    it('renders the default message, its values filled in', () => {
        expect(mockFormatMessage({ defaultMessage: 'Hello' })).toBe('Hello');
        expect(
            mockFormatMessage(
                { defaultMessage: '{source} → {target} ({other})' },
                { source: 'dob', target: 2 },
            ),
        ).toBe('dob → 2 ({other})');
        expect(mockFormatMessage({})).toBe('');
    });
});
