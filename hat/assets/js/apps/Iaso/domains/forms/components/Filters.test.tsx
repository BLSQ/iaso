import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { FormResponse } from '../hooks/useGetForms';
import MESSAGES from '../messages';
import { Form } from '../types/forms';
import { Filters } from './Filters';

const mockFormsResponse = {
    forms: [{ id: 1, name: 'Form 1' } as Form],
} as FormResponse;

const renderFilters = (params = {}) =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <Filters
                isLoadingForms={false}
                forms={mockFormsResponse}
                params={{
                    pageSize: '10',
                    order: 'asc',
                    page: '1',
                    orgUnitId: '1',
                    ...params,
                }}
            />
        </MemoryRouter>,
    );

describe('Filters test', () => {
    it('should render the show only deleted checkbox in the drawer', async () => {
        renderFilters();
        // the whole filter Paper is clickable, not only the filter icon
        await userEvent.click(screen.getByText('No active filter'));
        await waitFor(() => {
            expect(
                screen.getByRole('checkbox', {
                    name: MESSAGES.onlyDeleted.defaultMessage,
                }),
            ).toBeInTheDocument();
        });
    });

    it('should show active filters as chips in the bar', async () => {
        renderFilters({ search: 'hello' });
        await waitFor(() => {
            expect(screen.getByText('Search: hello')).toBeInTheDocument();
            expect(screen.getByText('Active filters')).toBeInTheDocument();
        });
    });
});
