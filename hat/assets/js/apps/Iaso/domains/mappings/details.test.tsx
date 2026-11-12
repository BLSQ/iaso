import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import MappingDetails from './details';

const mocks = vi.hoisted(() => ({
    params: {} as Record<string, string>,
    query: {} as Record<string, unknown>,
}));

vi.mock('bluesquare-components', async importOriginal => ({
    ...(await importOriginal<typeof import('bluesquare-components')>()),
    LoadingSpinner: () => <div role="status">loading</div>,
    useGoBack: () => vi.fn(),
    useRedirectToReplace: () => vi.fn(),
}));
vi.mock('../../routing/hooks/useParamsObject', () => ({
    useParamsObject: () => mocks.params,
}));
vi.mock('./hooks', () => ({
    useGetMappingVersionDetail: () => mocks.query,
}));
vi.mock('./hooks/requests/useApplyPartialUpdate', () => ({
    useApplyPartialUpdate: () => ({ mutate: vi.fn() }),
}));
vi.mock('./hooks/requests/useApplyUpdate', () => ({
    useApplyUpdate: () => ({ mutate: vi.fn() }),
}));
// no redux store, no DHIS2 calls
vi.mock('../../components/nav/TopBarComponent', () => ({
    default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('./components/Dhis2SearchComponent', () => ({
    default: () => <div />,
}));
vi.mock('./components/ImportMappings/MappingImportActions', () => ({
    MappingImportActions: () => <div />,
}));

const data = {
    mappingVersion: {
        id: 5,
        mapping: { mapping_type: 'AGGREGATE', data_source: { id: 1 } },
        form_version: { version_id: '2026111201', form: { name: 'Census' } },
        dataset: { id: 'dsBelgium', name: 'Census Belgium' },
        derivate_settings: {},
        question_mappings: {},
    },
    formVersion: {
        form_id: 3,
        descriptor: {
            name: 'survey',
            type: 'survey',
            children: [
                { name: 'belgium', type: 'integer', label: 'Belgique' },
                { name: 'france', type: 'integer', label: 'France' },
            ],
        },
    },
};

const spinner = () => screen.queryByRole('status');
const pageTitle = () => screen.getByRole('heading', { level: 1 });

describe('MappingDetails', () => {
    beforeEach(() => {
        mocks.params = { accountId: '1', mappingVersionId: '5' };
    });

    it('shows a spinner instead of the page on the first load', () => {
        mocks.query = { isLoading: true, isFetching: true, data: undefined };
        renderWithThemeAndIntlProvider(<MappingDetails />);

        expect(spinner()).toBeInTheDocument();
        expect(pageTitle()).toHaveTextContent('Loading');
    });

    it('keeps the page without spinner while refetching after a save', () => {
        mocks.query = { isLoading: false, isFetching: true, data };
        renderWithThemeAndIntlProvider(<MappingDetails />);

        expect(spinner()).not.toBeInTheDocument();
        expect(pageTitle()).toHaveTextContent('Census');
        expect(screen.getByText('Belgique')).toBeInTheDocument();
    });
});
