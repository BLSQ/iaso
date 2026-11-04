import React, { ChangeEvent, FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { Card, IconButton, Pagination, Stack, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { planningPanelStyles } from '../shared/styles';
import { AddMissionsDialog } from './AddMissionsDialog';
import { MissionItem } from './MissionItem';
import { NoMissionPlaceholder } from './NoMissionPlaceholder';

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
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        py: 1,
    },
} satisfies SxStyles;

export const MissionPanel: FC = () => {
    const {
        savedMissions,
        pendingMissions,
        isFetchingMissions,
        setMissionsPage,
        createMission,
        formik,
        planning,
        isReadOnly,
    } = usePlanningContext();
    const linkedMissionIds = formik.values.missions ?? [];
    const { formatMessage } = useSafeIntl();
    const handlePageChange = useCallback(
        (_event: ChangeEvent<unknown>, page: number) => setMissionsPage(page),
        [setMissionsPage],
    );
    const pageCount = savedMissions?.pages ?? 0;
    const currentPage = savedMissions?.page ?? 1;
    const hasNoMission =
        !isFetchingMissions &&
        pendingMissions.length === 0 &&
        (savedMissions?.results?.length ?? 0) === 0;
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
                            numericValues({ count: linkedMissionIds.length }),
                        )}
                    </Typography>
                </Stack>
                {!isReadOnly && (
                    <Stack direction="row" gap={1} my={1}>
                        <AddMissionsDialog />
                        <IconButton
                            color="primary"
                            onClick={createMission}
                            disabled={!planning}
                        >
                            <AddIcon />
                        </IconButton>
                    </Stack>
                )}
            </Stack>
            {hasNoMission && <NoMissionPlaceholder />}
            <Stack direction="column" gap={1} sx={styles.list}>
                {currentPage === 1 &&
                    pendingMissions.map(mission => (
                        <MissionItem
                            key={mission.id}
                            mission={mission}
                            status="added"
                        />
                    ))}
                {savedMissions?.results?.map(mission => (
                    <MissionItem
                        key={mission.id}
                        mission={mission}
                        status={
                            linkedMissionIds.includes(mission.id)
                                ? 'linked'
                                : 'unlinked'
                        }
                    />
                ))}
            </Stack>
            {pageCount > 1 && (
                <Pagination
                    sx={styles.pagination}
                    count={pageCount}
                    page={currentPage}
                    onChange={handlePageChange}
                    size="small"
                    color="primary"
                />
            )}
        </Card>
    );
};
