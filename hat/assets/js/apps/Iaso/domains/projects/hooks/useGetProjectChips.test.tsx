import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { ChipListItem, textPlaceholder } from 'bluesquare-components';
import { describe, expect, it, vi } from 'vitest';
import {
    ProjectChipSource,
    useGetProjectChips,
} from './useGetProjectChips';

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        ChipList: ({ items }: { items: ChipListItem[] }) => (
            <ul data-testid="chip-list">
                {items.map(item => (
                    <li
                        key={String(item.id)}
                        data-id={String(item.id)}
                        data-color={
                            item.color === undefined
                                ? 'undefined'
                                : String(item.color)
                        }
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        ),
    };
});

const makeProject = (
    overrides: Partial<ProjectChipSource> = {},
): ProjectChipSource => ({
    id: 1,
    name: 'Census',
    ...overrides,
});

describe('useGetProjectChips', () => {
    const renderChips = (projects: ProjectChipSource[] | null | undefined) => {
        const { result } = renderHook(() => useGetProjectChips());
        const chips = result.current(projects);
        if (typeof chips !== 'string') {
            render(chips);
        }
        return chips;
    };

    it('returns the placeholder when there are no projects', () => {
        expect(renderChips([])).toBe(textPlaceholder);
    });

    it('returns the placeholder when projects is missing', () => {
        expect(renderChips(undefined)).toBe(textPlaceholder);
        expect(renderChips(null)).toBe(textPlaceholder);
    });

    it('renders a ChipList with project id, name and color', () => {
        renderChips([
            makeProject({ id: 1, name: 'Census', color: '#00a' }),
            makeProject({ id: 2, name: 'Polio', color: '#f80' }),
        ]);

        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('Census');
        expect(items[0]).toHaveAttribute('data-id', '1');
        expect(items[0]).toHaveAttribute('data-color', '#00a');
        expect(items[1]).toHaveTextContent('Polio');
        expect(items[1]).toHaveAttribute('data-id', '2');
        expect(items[1]).toHaveAttribute('data-color', '#f80');
    });

    it('accepts a partial project payload that only has chip fields', () => {
        renderChips([{ id: 9, name: 'SNT' }]);

        expect(screen.getByRole('listitem')).toHaveTextContent('SNT');
        expect(screen.getByRole('listitem')).toHaveAttribute('data-id', '9');
        expect(screen.getByRole('listitem')).toHaveAttribute(
            'data-color',
            'undefined',
        );
    });

    it('turns a null color into undefined so ChipList can use its default', () => {
        renderChips([makeProject({ id: 3, name: 'Malaria', color: null })]);

        expect(screen.getByRole('listitem')).toHaveAttribute(
            'data-color',
            'undefined',
        );
        expect(screen.getByRole('listitem')).toHaveTextContent('Malaria');
    });

    it('returns a stable function', () => {
        const { result, rerender } = renderHook(() => useGetProjectChips());
        const first = result.current;
        rerender();
        expect(result.current).toBe(first);
    });
});
