import React, { FC } from 'react';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import { Stack } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionPolymorphicList, MissionTypeDa2Enum } from 'Iaso/api/missions';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { CaptionItem } from './CaptionItem';

type Props = {
    mission: MissionPolymorphicList;
};

const styles = {
    icon: {
        fontSize: '1rem',
    },
} satisfies SxStyles;

export const MissionInfoCaption: FC<Props> = ({ mission }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Stack direction="row" alignItems="center" gap={1.5}>
            {mission.mission_type ===
                MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM && (
                <CaptionItem
                    icon={<PublicOutlinedIcon sx={styles.icon} />}
                    label={mission.org_unit_type.name}
                />
            )}
            {mission.mission_type ===
                MissionTypeDa2Enum.enum.ENTITY_AND_FORM && (
                <CaptionItem
                    icon={<BadgeOutlinedIcon sx={styles.icon} />}
                    label={mission.entity_type.name}
                />
            )}
            <CaptionItem
                icon={<DescriptionOutlinedIcon sx={styles.icon} />}
                label={formatMessage(
                    MESSAGES.formsCount,
                    numericValues({ count: mission.forms_count }),
                )}
            />
        </Stack>
    );
};
