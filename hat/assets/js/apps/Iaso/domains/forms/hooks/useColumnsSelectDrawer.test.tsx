import { renderHook, act } from '@testing-library/react';
import { Column } from 'bluesquare-components';
import { describe, expect, it, vi } from 'vitest';
import { FormsParams } from '../types/forms';
import { DEFAULT_VISIBLE_COLUMNS } from './useGetForms';
import { useColumnsSelectDrawer } from './useColumnsSelectDrawer';

const mockRedirectToReplace = vi.fn();

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectToReplace: () => mockRedirectToReplace,
    };
});

const columns = [
    { id: 'projects', Header: 'Projects' },
    { id: 'name', Header: 'Name' },
    { id: 'updated_at', Header: 'Updated' },
    { id: 'org_unit_types', Header: 'Type' },
    { id: 'period_type', Header: 'Period type' },
    { id: 'single_per_period', Header: 'Single per period' },
    { id: 'instances_count', Header: 'Submissions' },
    { id: 'actions', Header: 'Actions' },
] as Column[];

const params = {
    pageSize: '10',
    order: '-updated_at',
    page: '1',
} as FormsParams;

describe('useColumnsSelectDrawer', () => {
    it('defaults active options to DEFAULT_VISIBLE_COLUMNS', () => {
        const { result } = renderHook(() =>
            useColumnsSelectDrawer(columns, params, '/forms'),
        );

        const activeKeys = result.current.options
            .filter(option => option.active)
            .map(option => option.key);
        expect(activeKeys.sort()).toEqual([...DEFAULT_VISIBLE_COLUMNS].sort());
        expect(activeKeys).not.toContain('period_type');
        expect(activeKeys).not.toContain('single_per_period');
        expect(activeKeys).not.toContain('instances_count');
    });

    it('attaches warnings to matching options', () => {
        const { result } = renderHook(() =>
            useColumnsSelectDrawer(columns, params, '/forms', {
                instances_count: 'slow',
            }),
        );

        const submissions = result.current.options.find(
            option => option.key === 'instances_count',
        );
        expect(submissions?.warning).toBe('slow');
        expect(
            result.current.options.find(option => option.key === 'name')
                ?.warning,
        ).toBeUndefined();
    });

    it('excludes actions from selectable options but keeps it in visibleColumns', () => {
        const { result } = renderHook(() =>
            useColumnsSelectDrawer(columns, params, '/forms'),
        );

        expect(
            result.current.options.find(option => option.key === 'actions'),
        ).toBeUndefined();
        expect(
            result.current.visibleColumns.some(column => column.id === 'actions'),
        ).toBe(true);
    });

    it('applies selected fields to the url', () => {
        const { result } = renderHook(() =>
            useColumnsSelectDrawer(columns, params, '/forms'),
        );

        act(() => {
            result.current.setOptions(
                result.current.options.map(option =>
                    option.key === 'period_type'
                        ? { ...option, active: true }
                        : option,
                ),
            );
        });

        act(() => {
            result.current.handleApplyOptions();
        });

        expect(mockRedirectToReplace).toHaveBeenCalledWith(
            '/forms',
            expect.objectContaining({
                fields: expect.stringContaining('period_type'),
            }),
        );
    });
});
