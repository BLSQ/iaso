import React from 'react';
import { screen } from '@testing-library/react';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { CreatedTypeSection } from './CreatedTypeSection';

describe('CreatedTypeSection', () => {
    it('renders an inclusive icon if no max cardinality', () => {
        renderWithThemeAndIntlProvider(
            <CreatedTypeSection
                missionType={MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM}
                typeName="Province"
                minCardinality={1}
                maxCardinality={null}
            />,
        );
        expect(screen.getByText(/∞/)).toBeInTheDocument();
    });

    it('renders max cardinality if provided', () => {
        renderWithThemeAndIntlProvider(
            <CreatedTypeSection
                missionType={MissionTypeDa2Enum.enum.ENTITY_AND_FORM}
                typeName="Child Under 5"
                minCardinality={1}
                maxCardinality={12}
            />,
        );
        expect(screen.getByText('min 1 · max 12')).toBeInTheDocument();
    });

    it('renders the labels matching the mission type', () => {
        renderWithThemeAndIntlProvider(
            <CreatedTypeSection
                missionType={MissionTypeDa2Enum.enum.ENTITY_AND_FORM}
                typeName="Child Under 5"
                minCardinality={1}
            />,
        );
        expect(screen.getAllByText('Entity type')).toHaveLength(2);
        expect(screen.getByText('Child Under 5')).toBeInTheDocument();
    });
});
