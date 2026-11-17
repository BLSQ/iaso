import React, { FC } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionPolymorphicRetrieve } from 'Iaso/api/missions';
import MESSAGES from '../../messages';
import { MissionTypeBadge } from '../MissionTypeBadge';
import { DetailsSectionTitle } from './DetailsSectionTitle';
import { DetailsTable } from './DetailsTable';

type Props = {
    mission: MissionPolymorphicRetrieve;
};

export const GeneralInfoSection: FC<Props> = ({ mission }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            <DetailsSectionTitle
                Icon={InfoOutlinedIcon}
                title={formatMessage(MESSAGES.generalInfoTitle)}
            />
            <DetailsTable
                rows={[
                    {
                        label: formatMessage(MESSAGES.description),
                        value: mission.description,
                    },
                    {
                        label: formatMessage(MESSAGES.missionType),
                        value: (
                            <MissionTypeBadge
                                missionType={mission.mission_type}
                                size="small"
                            />
                        ),
                    },
                ]}
            />
        </Box>
    );
};
