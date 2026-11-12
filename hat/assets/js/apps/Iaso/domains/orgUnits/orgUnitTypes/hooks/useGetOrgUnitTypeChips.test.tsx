import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { ChipListItem, textPlaceholder } from 'bluesquare-components';
import { describe, expect, it, vi } from 'vitest';
import {
    OrgUnitTypeChipSource,
    useGetOrgUnitTypeChips,
} from './useGetOrgUnitTypeChips';

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        ChipList: ({
            items,
            color,
        }: {
            items: ChipListItem[];
            color?: string;
        }) => (
            <ul data-testid="chip-list" data-color={color ?? 'undefined'}>
                {items.map(item => (
                    <li key={String(item.id)} data-id={String(item.id)}>
                        {item.label}
                    </li>
                ))}
            </ul>
        ),
    };
});

const makeOrgUnitType = (
    overrides: Partial<OrgUnitTypeChipSource> = {},
): OrgUnitTypeChipSource => ({
    id: 1,
    short_name: 'DIST',
    name: 'District',
    ...overrides,
});

describe('useGetOrgUnitTypeChips', () => {
    const renderChips = (
        orgUnitTypes: OrgUnitTypeChipSource[] | null | undefined,
    ) => {
        const { result } = renderHook(() => useGetOrgUnitTypeChips());
        const chips = result.current(orgUnitTypes);
        if (typeof chips !== 'string') {
            render(chips);
        }
        return chips;
    };

    it('returns the placeholder when there are no org unit types', () => {
        expect(renderChips([])).toBe(textPlaceholder);
    });

    it('returns the placeholder when org unit types are missing', () => {
        expect(renderChips(undefined)).toBe(textPlaceholder);
        expect(renderChips(null)).toBe(textPlaceholder);
    });

    it('renders a ChipList with short_name labels and secondary color', () => {
        renderChips([
            makeOrgUnitType({ id: 1, short_name: 'REG', name: 'Region' }),
            makeOrgUnitType({ id: 2, short_name: 'DIST', name: 'District' }),
        ]);

        expect(screen.getByTestId('chip-list')).toHaveAttribute(
            'data-color',
            'secondary',
        );
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('REG');
        expect(items[0]).toHaveAttribute('data-id', '1');
        expect(items[1]).toHaveTextContent('DIST');
        expect(items[1]).toHaveAttribute('data-id', '2');
    });

    it('falls back to name when short_name is missing', () => {
        renderChips([{ id: 9, name: 'Facility' }]);

        expect(screen.getByRole('listitem')).toHaveTextContent('Facility');
        expect(screen.getByRole('listitem')).toHaveAttribute('data-id', '9');
    });

    it('falls back to name when short_name is null', () => {
        renderChips([
            makeOrgUnitType({ id: 3, short_name: null, name: 'Village' }),
        ]);

        expect(screen.getByRole('listitem')).toHaveTextContent('Village');
    });

    it('returns a stable function', () => {
        const { result, rerender } = renderHook(() => useGetOrgUnitTypeChips());
        const first = result.current;
        rerender();
        expect(result.current).toBe(first);
    });
});
