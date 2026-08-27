import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { FormResponse } from '../hooks/useGetForms';
import MESSAGES from '../messages';
import { Form } from '../types/forms';
import { Filters } from './Filters';

const mockFormsResponse = {
    forms: [{ id: 1, name: 'Form 1' } as Form],
} as FormResponse;

describe('Filters test', () => {
    it('should render the show only deleted checkbox', async () => {
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
                    }}
                />
            </MemoryRouter>,
        );
        await waitFor(() => {
            expect(
                screen.getByRole('checkbox', {
                    name: MESSAGES.onlyDeleted.defaultMessage,
                }),
            ).toBeInTheDocument();
        });
    });
});
