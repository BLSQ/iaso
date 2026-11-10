import React from 'react';
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
        Count: ({ count }: { count?: number }) => (
            <div data-testid="forms-count">{count}</div>
        ),
    };
});

vi.mock('../../../components/tables/ColumnSelectDrawer', () => ({
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
    }: {
        options: { key: string; url: string }[];
    }) => (
        <ul data-testid="download-options">
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
        } as FormsParams;

        renderWithThemeAndIntlProvider(
            <FormsTableToolbar
                count={12}
                isLoading={false}
                params={params}
                columnsSelect={columnsSelect}
            />,
        );

        expect(screen.getByTestId('forms-count')).toHaveTextContent('12');
        expect(screen.getByTestId('columns-select-drawer')).toBeInTheDocument();

        const csv = screen
            .getByTestId('download-options')
            .querySelector('[data-url*="csv=true"]');
        expect(csv?.getAttribute('data-url')).toContain('order=-updated_at');
        expect(csv?.getAttribute('data-url')).toContain(
            'fields=projects%2Cname%2Cupdated_at%2Corg_unit_types',
        );
        expect(csv?.getAttribute('data-url')).toContain('search=malaria');
        expect(csv?.getAttribute('data-url')).not.toContain('page=');
        expect(csv?.getAttribute('data-url')).not.toContain('created_at');
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
