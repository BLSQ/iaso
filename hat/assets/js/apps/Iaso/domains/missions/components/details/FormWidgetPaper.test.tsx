import React from 'react';
import { screen, within } from '@testing-library/react';
import { getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock } from 'Iaso/api/missions/endpoints/missions/missions.msw';
import MESSAGES from 'Iaso/domains/missions/messages';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { FormWidgetPaper } from './FormWidgetPaper';

describe('FormWidgetPaper test', () => {
    it('renders an alert if no forms are provided', () => {
        renderWithThemeAndIntlProvider(
            <FormWidgetPaper
                mission={getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock(
                    {
                        forms: [],
                    },
                )}
            />,
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();

        expect(
            within(screen.getByRole('alert')).getByText(
                MESSAGES.noResultsFound.defaultMessage,
            ),
        ).toBeInTheDocument();
    });
    it('displays the formsand all inclusive icon if needed', () => {
        renderWithThemeAndIntlProvider(
            <FormWidgetPaper
                mission={getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock(
                    {
                        forms: [
                            {
                                form: 1,
                                form_name: 'form_name',
                                min_cardinality: 1,
                                max_cardinality: 12,
                            },
                            {
                                form: 2,
                                form_name: 'form_name_3',
                                min_cardinality: 1,
                                max_cardinality: null,
                            },
                        ],
                    },
                )}
            />,
        );

        expect(screen.queryByRole('alert')).toBeNull();

        expect(screen.getByText('form_name')).toBeInTheDocument();
        expect(screen.getByText(12)).toBeInTheDocument();
        expect(screen.getByText('form_name_3')).toBeInTheDocument();
        expect(screen.getByTestId('AllInclusiveIcon')).toBeInTheDocument();
    });
});
