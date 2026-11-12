import React, { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { FormsParams } from '../types/forms';
import { FormsTableToolbar } from './FormsTableToolbar';

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        TableToolbar: ({
            count,
            columnsSelect,
            download,
            extraActions,
        }: {
            count?: number;
            columnsSelect?: ReactNode;
            download?: ReactNode;
            extraActions?: ReactNode;
        }) => (
            <div data-testid="base-table-toolbar">
                <div data-testid="forms-count">{count}</div>
                {columnsSelect}
                {download}
                {extraActions}
            </div>
        ),
    };
});

vi.mock('Iaso/components/tables/ColumnSelectDrawer', () => ({
    ColumnsSelectDrawer: () => <div data-testid="columns-select-drawer" />,
}));

vi.mock('Iaso/components/DownloadMenuButton', () => ({
    useDownloadOption: () => (key: string, url: string) => ({
        key,
        label: key.toUpperCase(),
        url,
    }),
    DownloadMenuButton: ({
        options,
        disabled,
    }: {
        options: { key: string; url: string }[];
        disabled?: boolean;
    }) => (
        <ul data-testid="download-options" data-disabled={String(disabled)}>
            {options.map(option => (
                <li key={option.key} data-url={option.url}>
                    {option.key}
                </li>
            ))}
        </ul>
    ),
}));

const columnsSelect = {
    options: [],
    setOptions: vi.fn(),
    handleApplyOptions: vi.fn(),
    isDisabled: false,
};

describe('FormsTableToolbar', () => {
    it('renders count, columns drawer and download links using table defaults', () => {
        const params = {
            pageSize: '10',
            page: '2',
            accountId: '1',
            search: 'malaria',
            showDeleted: '1',
            onlyDeleted: '1',
        } as FormsParams;

        renderWithThemeAndIntlProvider(
            <FormsTableToolbar
                count={12}
                isLoading={false}
                params={params}
                columnsSelect={columnsSelect}
                hasForms
            />,
        );

        expect(screen.getByTestId('forms-count')).toHaveTextContent('12');
        expect(screen.getByTestId('columns-select-drawer')).toBeInTheDocument();

        const csv = screen
            .getByTestId('download-options')
            .querySelector('[data-url*="csv=true"]');
        const csvUrl = csv?.getAttribute('data-url') ?? '';
        expect(csvUrl).toContain('order=-updated_at');
        expect(csvUrl).toContain(
            'fields=projects%2Cname%2Cupdated_at%2Corg_unit_types',
        );
        expect(csvUrl).toContain('search=malaria');
        expect(csvUrl).toContain('show_deleted=1');
        expect(csvUrl).toContain('only_deleted=1');
        expect(csvUrl).not.toContain('page=');
        expect(csvUrl).not.toContain('created_at');
        expect(screen.getByTestId('download-options')).toHaveAttribute(
            'data-disabled',
            'false',
        );
    });

    it('disables export while loading or when there are no forms', () => {
        const { rerender } = renderWithThemeAndIntlProvider(
            <FormsTableToolbar
                count={0}
                isLoading
                params={{ pageSize: '10', page: '1' } as FormsParams}
                columnsSelect={columnsSelect}
                hasForms={false}
            />,
        );

        expect(screen.getByTestId('download-options')).toHaveAttribute(
            'data-disabled',
            'true',
        );

        rerender(
            <FormsTableToolbar
                count={0}
                isLoading={false}
                params={{ pageSize: '10', page: '1' } as FormsParams}
                columnsSelect={columnsSelect}
                hasForms={false}
            />,
        );
        expect(screen.getByTestId('download-options')).toHaveAttribute(
            'data-disabled',
            'true',
        );

        rerender(
            <FormsTableToolbar
                count={3}
                isLoading={false}
                params={{ pageSize: '10', page: '1' } as FormsParams}
                columnsSelect={columnsSelect}
                hasForms
            />,
        );
        expect(screen.getByTestId('download-options')).toHaveAttribute(
            'data-disabled',
            'false',
        );
    });

    it('can hide the columns select drawer', () => {
        renderWithThemeAndIntlProvider(
            <FormsTableToolbar
                count={0}
                isLoading={false}
                params={
                    {
                        pageSize: '10',
                        page: '1',
                    } as FormsParams
                }
                columnsSelect={columnsSelect}
                displayColumnsSelectDrawer={false}
            />,
        );

        expect(
            screen.queryByTestId('columns-select-drawer'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('download-options')).toBeInTheDocument();
    });
});
