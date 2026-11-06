import React from 'react';
import { screen } from '@testing-library/react';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import {
    getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock,
    getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock,
} from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { CreatedTypeSection } from './CreatedTypeSection';

describe('CreatedTypeSection', () => {
    it('renders an infinity symbol if no max cardinality', () => {
        renderWithThemeAndIntlProvider(
            <CreatedTypeSection
                // @ts-ignore
                mission={getApiMicroplanningMissionsRetrieveResponseMissionOrgUnitTypeRetrieveTypedMock(
                    {
                        mission_type: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
                        min_cardinality: 1,
                        max_cardinality: null,
                    },
                )}
            />,
        );
        expect(screen.getByText('min 1 · max ∞')).toBeInTheDocument();
    });

    it('renders the entity type name and max cardinality', () => {
        const mission =
            getApiMicroplanningMissionsRetrieveResponseMissionEntityTypeRetrieveTypedMock(
                {
                    mission_type: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
                    min_cardinality: 1,
                    max_cardinality: 12,
                },
            );
        renderWithThemeAndIntlProvider(
            // @ts-ignore
            <CreatedTypeSection mission={mission} />,
        );
        expect(screen.getAllByText('Entity type')).toHaveLength(2);
        expect(screen.getByText(mission.entity_type.name)).toBeInTheDocument();
        expect(screen.getByText('min 1 · max 12')).toBeInTheDocument();
    });
});
