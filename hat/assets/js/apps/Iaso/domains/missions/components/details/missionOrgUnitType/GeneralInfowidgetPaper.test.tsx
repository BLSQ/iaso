import React from 'react';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { MissionTypeDropdownValueEnum } from 'Iaso/api/missions';
import { getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock } from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { GeneralInfoWidgetPaper } from './GeneralInfoWidgetPaper';

describe('GeneralInfoWidgetPaper test', () => {
    beforeAll(() => {
        faker.seed(5);
    });

    it('renders an inclusive icon if no max cardinality', () => {
        renderWithThemeAndIntlProvider(
            <GeneralInfoWidgetPaper
                // @ts-ignore
                mission={getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                    {
                        max_cardinality: null,
                        // @ts-ignore
                        mission_type: {
                            label: 'Org unit',
                            value: MissionTypeDropdownValueEnum.enum
                                .ORG_UNIT_AND_FORM,
                        },
                    },
                )}
            />,
        );
        expect(screen.getByTestId('AllInclusiveIcon')).toBeInTheDocument();
    });

    it('renders max cardinality if provided', () => {
        renderWithThemeAndIntlProvider(
            <GeneralInfoWidgetPaper
                // @ts-ignore
                mission={getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                    {
                        max_cardinality: 12,
                        // @ts-ignore
                        mission_type: {
                            label: 'Org unit',
                            value: MissionTypeDropdownValueEnum.enum
                                .ORG_UNIT_AND_FORM,
                        },
                    },
                )}
            />,
        );
        expect(screen.getByText(12)).toBeInTheDocument();
    });
});
