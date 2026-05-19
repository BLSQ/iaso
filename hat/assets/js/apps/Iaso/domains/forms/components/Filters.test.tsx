import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import MESSAGES from '../messages';
import { Filters } from './Filters';

describe('Filters test', () => {
    it('should render the show only deleted checkbox', async () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Filters
                    isLoadingForms={false}
                    forms={{ forms: [1] }}
                    params={{}}
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
