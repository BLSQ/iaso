import React, { FC } from 'react';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { Card, IconButton, Stack, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../contexts/PlanningContext';
import MESSAGES from '../messages';
import { AddMissionsDialog } from './AddMissionsDialog';
import { MissionItem } from './MissionItem';
import { planningPanelStyles } from './styles';

const styles = {
    card: {
        ...planningPanelStyles.card,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
    },
    title: {
        textTransform: 'uppercase',
    },
    list: {
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
    },
} satisfies SxStyles;

export const MissionPanel: FC = () => {
    const { missions, isFetchingMissions, createMission } =
        usePlanningContext();
    const { formatMessage } = useSafeIntl();
    return (
        <Card sx={styles.card} variant="outlined">
            {isFetchingMissions && <LoadingSpinner absolute fixed={false} />}
            <Stack direction="row" justifyContent="space-between">
                <Stack gap={1} direction="row" alignItems="center" my={2}>
                    <AssignmentOutlinedIcon
                        sx={planningPanelStyles.smallIcon}
                        color="primary"
                    />
                    <Typography
                        display="inline"
                        fontWeight="bold"
                        sx={styles.title}
                    >
                        {formatMessage(MESSAGES.missions)}
                    </Typography>
                    <Typography variant="caption" display="inline">
                        {formatMessage(
                            MESSAGES.linkedMissionsCount,
                            numericValues({ count: missions.length }),
                        )}
                    </Typography>
                </Stack>
                <Stack direction="row" gap={1} my={1}>
                    <AddMissionsDialog />
                    <IconButton color="primary" onClick={createMission}>
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
