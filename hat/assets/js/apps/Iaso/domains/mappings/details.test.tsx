import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import MappingDetails from './details';

// jsdom has no scrollIntoView, used by the question tree
Element.prototype.scrollIntoView = vi.fn();

const mocks = vi.hoisted(() => ({
    params: {} as Record<string, string>,
    query: {} as Record<string, unknown>,
    redirectToReplace: vi.fn(),
    applyPartialUpdate: vi.fn(),
}));

vi.mock('bluesquare-components', async importOriginal => ({
    ...(await importOriginal<typeof import('bluesquare-components')>()),
    LoadingSpinner: () => <div role="status">loading</div>,
    useGoBack: () => vi.fn(),
    useRedirectToReplace: () => mocks.redirectToReplace,
}));
vi.mock('../../routing/hooks/useParamsObject', () => ({
    useParamsObject: () => mocks.params,
}));
vi.mock('./hooks', () => ({
    useGetMappingVersionDetail: () => mocks.query,
}));
vi.mock('./hooks/requests/useApplyPartialUpdate', () => ({
    useApplyPartialUpdate: () => ({ mutate: mocks.applyPartialUpdate }),
}));
vi.mock('./hooks/requests/useApplyUpdate', () => ({
    useApplyUpdate: () => ({ mutate: vi.fn() }),
}));
// no redux store, no DHIS2 calls
vi.mock('../../components/nav/TopBarComponent', () => ({
    default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('./components/Dhis2SearchComponent', () => ({
    default: ({
        onChange,
    }: {
        onChange: (name: string, value: Record<string, any>) => void;
    }) => (
        <button
            type="button"
            onClick={() => onChange('de', { id: 'deFrance', name: 'France' })}
        >
            propose
        </button>
    ),
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
const generalPanel = () => screen.queryByText('General informations');
// the Name field of the question panel
const selectedQuestionName = () =>
    screen.queryByRole('group', { name: 'Name' })?.children[1].textContent;
const pageTitle = () => screen.getByRole('heading', { level: 1 });

describe('MappingDetails', () => {
    beforeEach(() => {
        mocks.params = { accountId: '1', mappingVersionId: '5' };
        mocks.redirectToReplace.mockClear();
        mocks.applyPartialUpdate.mockClear();
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

    describe('selected question', () => {
        beforeEach(() => {
            mocks.query = { isLoading: false, isFetching: false, data };
        });

        it('follows the question of the URL, also on Back/Forward', () => {
            mocks.params = { ...mocks.params, questionName: 'france' };
            const { rerender } = renderWithThemeAndIntlProvider(
                <MappingDetails />,
            );
            expect(selectedQuestionName()).toBe('france');

            // Back to the URL without question
            mocks.params = { accountId: '1', mappingVersionId: '5' };
            rerender(<MappingDetails />);
            expect(selectedQuestionName()).toBeUndefined();
            expect(generalPanel()).toBeInTheDocument();

            // Forward to another question
            mocks.params = { ...mocks.params, questionName: 'belgium' };
            rerender(<MappingDetails />);
            expect(selectedQuestionName()).toBe('belgium');
            expect(generalPanel()).not.toBeInTheDocument();
        });

        it('shows the general information for an unknown question', () => {
            mocks.params = { ...mocks.params, questionName: 'spain' };
            renderWithThemeAndIntlProvider(<MappingDetails />);

            expect(selectedQuestionName()).toBeUndefined();
            expect(generalPanel()).toBeInTheDocument();
        });

        it('puts the clicked question in the URL', () => {
            renderWithThemeAndIntlProvider(<MappingDetails />);

            fireEvent.click(screen.getByText('France'));

            expect(mocks.redirectToReplace).toHaveBeenCalledWith(
                'forms/mapping',
                { mappingVersionId: 5, questionName: 'france' },
            );
        });

        it('removes the question from the URL on Esc', () => {
            mocks.params = { ...mocks.params, questionName: 'france' };
            renderWithThemeAndIntlProvider(<MappingDetails />);

            fireEvent.keyDown(window, { key: 'Escape' });

            expect(mocks.redirectToReplace).toHaveBeenCalledWith(
                'forms/mapping',
                { mappingVersionId: '5' },
            );
        });
    });

    it('saves the confirmed mapping of the selected question', () => {
        mocks.query = { isLoading: false, isFetching: false, data };
        mocks.params = { ...mocks.params, questionName: 'france' };
        renderWithThemeAndIntlProvider(<MappingDetails />);

        fireEvent.click(screen.getByRole('button', { name: 'propose' }));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(mocks.applyPartialUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                mappingVersionId: 5,
                questionName: 'france',
            }),
            // so the form clears its proposal once saved
            { onSuccess: expect.any(Function) },
        );
    });
});
