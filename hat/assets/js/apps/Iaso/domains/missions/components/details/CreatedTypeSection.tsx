import React, { FC } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import {
    MissionEntityTypeRetrieve,
    MissionOrgUnitTypeRetrieve,
} from 'Iaso/api/missions';
import MESSAGES from '../../messages';
import { formatMaxCardinality } from '../../utils';
import {
    CREATED_TYPE_CONFIG,
    CreatedTypeMissionType,
    getMissionTypeOption,
} from '../missionTypeOptions';
import { DetailsSectionTitle } from './DetailsSectionTitle';
import { DetailsTable } from './DetailsTable';

type Props = {
    mission: MissionOrgUnitTypeRetrieve | MissionEntityTypeRetrieve;
};

export const CreatedTypeSection: FC<Props> = ({ mission }) => {
    const { min_cardinality, max_cardinality } = mission;
    const missionType = mission.mission_type as CreatedTypeMissionType;
    const typeName =
        'org_unit_type' in mission
            ? mission.org_unit_type.name
            : mission.entity_type.name;
    const { formatMessage } = useSafeIntl();
    const typeLabel = formatMessage(
        CREATED_TYPE_CONFIG[missionType].typeMessage,
    );
    const Icon = getMissionTypeOption(missionType)?.Icon;
    return (
        <Box>
            {Icon && <DetailsSectionTitle Icon={Icon} title={typeLabel} />}
            <DetailsTable
                rows={[
                    { label: typeLabel, value: typeName },
                    {
                        label: formatMessage(MESSAGES.cardinality),
                        value: formatMessage(MESSAGES.cardinalityRange, {
                            min: min_cardinality.toLocaleString(),
                            max: formatMaxCardinality(max_cardinality),
                        }),
                    },
                ]}
            />
        </Box>
    );
};
