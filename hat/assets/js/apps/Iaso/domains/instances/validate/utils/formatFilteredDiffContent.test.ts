import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogContentSource } from '../../compare/components/CompareInstanceLogs';

const { mockFormatLogContent } = vi.hoisted(() => ({
    mockFormatLogContent: vi.fn(
        (
            previousResult: Partial<LogContentSource> | undefined,
            currentResult: Partial<LogContentSource> | undefined,
        ) => ({
            logA: previousResult?.new_value?.[0]?.fields,
            logB: currentResult?.new_value?.[0]?.fields,
            fields: currentResult?.possible_fields,
        }),
    ),
}));

vi.mock(
    '../../compare/components/CompareInstanceLogs',
    async importOriginal => {
        const actual =
            await importOriginal<
                typeof import('../../compare/components/CompareInstanceLogs')
            >();
        return {
            ...actual,
            formatLogContent: mockFormatLogContent,
        };
    },
);

import {
    formatFilteredDiffContent,
    getChangedKeysFromDiff,
} from './formatFilteredDiffContent';

const previousResult: Partial<LogContentSource> = {
    new_value: [
        {
            fields: {
                json: { field_a: 'old', field_b: 'unchanged' },
            },
        },
    ],
    possible_fields: [{ name: 'field_a' }, { name: 'field_b' }],
};

const currentResult: Partial<LogContentSource> = {
    new_value: [
        {
            fields: {
                json: { field_a: 'new', field_b: 'unchanged' },
            },
        },
    ],
    possible_fields: [{ name: 'field_a' }, { name: 'field_b' }],
};

describe('getChangedKeysFromDiff', () => {
    it('extracts last path segment as field key', () => {
        expect(getChangedKeysFromDiff([{ path: '/json/field_a' }])).toEqual([
            'field_a',
        ]);
    });

    it('uses last segment for nested paths', () => {
        expect(
            getChangedKeysFromDiff([{ path: '/json/parent/child' }]),
        ).toEqual(['child']);
    });

    it('returns empty array for undefined diff', () => {
        expect(getChangedKeysFromDiff(undefined)).toEqual([]);
    });
});

describe('formatFilteredDiffContent', () => {
    beforeEach(() => {
        mockFormatLogContent.mockClear();
    });

    it('filters json to changed keys on both sides', () => {
        const result = formatFilteredDiffContent(
            previousResult,
            currentResult,
            ['field_a'],
        );

        expect(result.logA?.json).toEqual({ field_a: 'old' });
        expect(result.logB?.json).toEqual({ field_a: 'new' });
        expect(result.logA?.json).not.toHaveProperty('field_b');
        expect(result.logB?.json).not.toHaveProperty('field_b');
    });

    it('filters possible_fields on both sides before formatting', () => {
        formatFilteredDiffContent(previousResult, currentResult, ['field_a']);

        const [filteredPrevious, filteredCurrent] =
            mockFormatLogContent.mock.calls[0];

        expect(filteredPrevious.possible_fields).toEqual([{ name: 'field_a' }]);
        expect(filteredCurrent.possible_fields).toEqual([{ name: 'field_a' }]);
    });

    it('exposes filtered fields through formatLogContent output', () => {
        const result = formatFilteredDiffContent(
            previousResult,
            currentResult,
            ['field_a'],
        );

        expect(result.fields).toEqual([{ name: 'field_a' }]);
        expect(result.fields).not.toContainEqual({ name: 'field_b' });
    });
});
