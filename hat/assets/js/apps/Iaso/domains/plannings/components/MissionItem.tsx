import React, { FC } from 'react';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Card, IconButton, Stack, Typography } from '@mui/material';
import { MissionPolymorphicList } from 'Iaso/api/missions';
import { MissionInfoCaption } from 'Iaso/domains/missions/components/chips/MissionInfoCaption';
import { MissionTypeChip } from 'Iaso/domains/missions/components/chips/MissionTypeChip';
import { SxStyles } from 'Iaso/types/general';
import { planningPanelStyles } from './styles';

type Props = {
    mission: MissionPolymorphicList;
};

const styles = {
    card: {
        p: 2,
        flexShrink: 0,
        backgroundColor: '#FAFBFC', // TODO is it wise to use custom colors here?
        borderColor: '#EDF1F4', // TODO is it wise to use custom colors here ?
    },
    details: {
        mt: 1,
    },
} satisfies SxStyles;

export const MissionItem: FC<Props> = ({ mission }) => {
    return (
        <Card variant="outlined" sx={styles.card}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography variant="body2" fontWeight="bold">
                    {mission.name}
                </Typography>
                <Stack direction="row" gap={1}>
                    <IconButton size="small">
                        <VisibilityOutlinedIcon
                            sx={planningPanelStyles.smallIcon}
                        />
                    </IconButton>
                    <IconButton size="small">
                        <CreateOutlinedIcon
                            color="primary"
                            sx={planningPanelStyles.smallIcon}
                        />
                    </IconButton>
                    <IconButton size="small">
                        <LinkOffOutlinedIcon
                            sx={planningPanelStyles.smallIcon}
                        />
                    </IconButton>
                </Stack>
            </Stack>
            <Stack direction="row" gap={1} sx={styles.details}>
                <MissionTypeChip missionType={mission.mission_type} />
                <MissionInfoCaption mission={mission} />
            </Stack>
        </Card>
    );
};
