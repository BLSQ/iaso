import React, { FC, SyntheticEvent, useCallback } from 'react';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import { Box, Paper, Tab, Tabs } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { AssignmentsView } from '../../../types';
import { AssignmentsMap } from './AssignmentsMap';
import { OrgUnitsTable } from './OrgUnitsTable';

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
        px: 2,
        borderBottom: 1,
        borderColor: 'divider',
    },
} satisfies SxStyles;

export const AssignmentsMainPanel: FC = () => {
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
            {view === 'map' && <AssignmentsMap />}
            {view === 'list' && <OrgUnitsTable />}
        </Paper>
    );
};
