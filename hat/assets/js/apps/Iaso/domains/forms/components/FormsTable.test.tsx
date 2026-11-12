import React from 'react';
import { render } from '@testing-library/react';
import { getOrderArray } from 'bluesquare-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsParams } from '../types/forms';
import { FormsTable } from './FormsTable';

const mockUseGetForms = vi.fn();
const mockUseFormsTableColumns = vi.fn();
const mockUseColumnsSelectDrawer = vi.fn();
const mockToolbarProps = vi.fn();
const mockTableProps = vi.fn();

vi.mock('../hooks/useGetForms', () => ({
    tableDefaults: { order: '-updated_at', limit: 10, page: 1 },
    useGetForms: (...args: unknown[]) => mockUseGetForms(...args),
}));

vi.mock('../config', () => ({
    useFormsTableColumns: (...args: unknown[]) =>
        mockUseFormsTableColumns(...args),
}));

vi.mock('../hooks/useColumnsSelectDrawer', () => ({
    useColumnsSelectDrawer: (...args: unknown[]) =>
        mockUseColumnsSelectDrawer(...args),
}));

vi.mock('../../../routing/hooks/usePrefixedParams', () => ({
    usePrefixedParams: (_prefix: string | undefined, params: FormsParams) =>
        params,
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage || msg.id || '',
        }),
        getOrderArray: actual.getOrderArray,
    };
});

vi.mock('./FormsTableToolbar', () => ({
    FormsTableToolbar: (props: Record<string, unknown>) => {
        mockToolbarProps(props);
        return <div data-testid="forms-toolbar" />;
    },
}));

vi.mock('../../../components/tables/TableWithDeepLink', () => ({
    TableWithDeepLink: (props: Record<string, unknown>) => {
        mockTableProps(props);
        return <div data-testid="forms-table" />;
    },
}));

describe('FormsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetForms.mockReturnValue({
            data: {
                forms: [{ id: 1 }],
                count: 1,
                pages: 1,
                limit: 10,
            },
            isFetching: false,
        });
        mockUseFormsTableColumns.mockReturnValue([
            { id: 'name', Header: 'Name' },
            { id: 'instances_count', Header: 'Submissions' },
            { id: 'actions', Header: 'Actions' },
        ]);
        mockUseColumnsSelectDrawer.mockReturnValue({
            visibleColumns: [{ id: 'name', Header: 'Name' }],
            options: [],
            setOptions: vi.fn(),
            handleApplyOptions: vi.fn(),
            isDisabled: true,
        });
    });

    it('wires default sort, hides table count and passes instances_count warning', () => {
        render(
            <FormsTable
                baseUrl="/forms"
                params={
                    {
                        pageSize: '10',
                        page: '1',
                        order: '-updated_at',
                    } as FormsParams
                }
            />,
        );

        expect(mockUseColumnsSelectDrawer).toHaveBeenCalledWith(
            expect.any(Array),
            expect.any(Object),
            '/forms',
            expect.objectContaining({
                instances_count: expect.any(String),
            }),
        );

        expect(mockTableProps).toHaveBeenCalledWith(
            expect.objectContaining({
                showCount: false,
                defaultSorted: getOrderArray('-updated_at'),
                columns: [{ id: 'name', Header: 'Name' }],
            }),
        );

        expect(mockToolbarProps).toHaveBeenCalledWith(
            expect.objectContaining({
                hasForms: true,
                displayColumnsSelectDrawer: true,
            }),
        );
    });
});
