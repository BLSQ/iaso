import React, { FC, SyntheticEvent, useCallback } from 'react';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { AssignmentsView } from '../../../types';
import { AssignmentsMap } from './AssignmentsMap';

const styles = {
    panel: {
        flex: '1 1 520px',
        minWidth: 0,
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        pr: 2,
        borderBottom: 1,
        borderColor: 'divider',
    },
    listPlaceholder: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
    },
} satisfies SxStyles;

type Props = {
    tree: TeamTreeNode;
};

export const AssignmentsMainPanel: FC<Props> = ({ tree }) => {
    const { formatMessage } = useSafeIntl();
    const { view, updateParams } = useAssignmentsParams();
    const handleChangeView = useCallback(
        (_event: SyntheticEvent, newView: AssignmentsView) =>
            updateParams({ view: newView }),
        [updateParams],
    );

    return (
        <Paper sx={styles.panel}>
            <Box sx={styles.header}>
                <Tabs value={view} onChange={handleChangeView}>
                    <Tab
                        value="map"
                        label={formatMessage(MESSAGES.map)}
                        icon={<MapIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        value="list"
                        label={formatMessage(MESSAGES.list)}
                        icon={<ListIcon />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>
            {view === 'map' && <AssignmentsMap tree={tree} />}
            {view === 'list' && (
                <Box sx={styles.listPlaceholder}>
                    <Typography color="text.secondary">
                        {formatMessage(MESSAGES.orgUnitsListPlaceholder)}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};
