import React, { FC } from 'react';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { Card, IconButton, Stack, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../contexts/PlanningContext';
import { MissionItem } from './MissionItem';
import { planningPanelStyles } from './styles';

const styles = {
    card: {
        ...planningPanelStyles.card,
        display: 'flex',
        flexDirection: 'column',
    },
    list: {
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
    },
} satisfies SxStyles;

export const MissionPanel: FC = () => {
    const { missions } = usePlanningContext();
    return (
        <Card sx={styles.card} variant="outlined">
            <Stack direction="row" justifyContent="space-between">
                <Stack gap={1} direction="row" alignItems="center" my={2}>
                    <AssignmentOutlinedIcon
                        sx={planningPanelStyles.smallIcon}
                        color="primary"
                    />
                    <Typography display="inline" fontWeight="bold">
                        MISSIONS
                    </Typography>
                    <Typography variant="caption" display="inline">
                        3 linked
                    </Typography>
                </Stack>
                <Stack direction="row" gap={1} my={1}>
                    <IconButton color="primary">
                        <PlaylistAddIcon />
                    </IconButton>
                    <IconButton color="primary">
                        <AddIcon />
                    </IconButton>
                </Stack>
            </Stack>
            <Stack direction="column" gap={1} sx={styles.list}>
                {missions.map(mission => (
                    <MissionItem key={mission.id} mission={mission} />
                ))}
            </Stack>
        </Card>
    );
};
