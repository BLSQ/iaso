import React, { FC } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import MESSAGES from '../../messages';
import { formatMaxCardinality } from '../../utils';
import {
    CreatedTypeMissionType,
    getMissionTypeOption,
} from '../missionTypeOptions';
import { DetailsSectionTitle } from './DetailsSectionTitle';
import { DetailsTable } from './DetailsTable';

const TYPE_MESSAGES = {
    [MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM]: MESSAGES.orgUnitType,
    [MissionTypeDa2Enum.enum.ENTITY_AND_FORM]: MESSAGES.entityType,
};

type Props = {
    missionType: CreatedTypeMissionType;
    typeName: string;
    minCardinality: number;
    maxCardinality?: number | null;
};

export const CreatedTypeSection: FC<Props> = ({
    missionType,
    typeName,
    minCardinality,
    maxCardinality,
}) => {
    const { formatMessage } = useSafeIntl();
    const typeLabel = formatMessage(TYPE_MESSAGES[missionType]);
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
                            min: minCardinality.toLocaleString(),
                            max: formatMaxCardinality(maxCardinality),
                        }),
                    },
                ]}
            />
        </Box>
    );
};
