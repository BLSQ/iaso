import React, { FC } from 'react';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { useSafeIntl } from 'bluesquare-components';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { CaptionItem } from './CaptionItem';

type Props = {
    missionType: MissionTypeDa2Enum;
};

const styles = {
    icon: {
        fontSize: '1rem',
    },
} satisfies SxStyles;

export const MissionTypeCaption: FC<Props> = ({ missionType }) => {
    const { formatMessage } = useSafeIntl();
    switch (missionType) {
        case MissionTypeDa2Enum.enum.FORM_FILLING:
            return (
                <CaptionItem
                    icon={<DescriptionOutlinedIcon sx={styles.icon} />}
                    label={formatMessage(MESSAGES.form)}
                />
            );
        case MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM:
            return (
                <CaptionItem
                    icon={<PlaceOutlinedIcon sx={styles.icon} />}
                    label={formatMessage(MESSAGES.orgUnitAndFormChip)}
                />
            );
        case MissionTypeDa2Enum.enum.ENTITY_AND_FORM:
            return (
                <CaptionItem
                    icon={<BadgeOutlinedIcon sx={styles.icon} />}
                    label={formatMessage(MESSAGES.entityAndFormChip)}
                />
            );
        default:
            return null;
    }
};
