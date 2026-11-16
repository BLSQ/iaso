import React, { FC, SyntheticEvent, useCallback } from 'react';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import Paper from '@mui/material/Paper/Paper';
import Stack from '@mui/material/Stack/Stack';
import Tab from '@mui/material/Tab/Tab';
import Tabs from '@mui/material/Tabs/Tabs';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { AssignmentsView } from '../../../types';
import { BulkAssignButton } from '../assign/BulkAssignButton';
import { EmptyAreaButton } from '../assign/EmptyAreaButton';
import { FindOrgUnitField } from '../findOrgUnit/FindOrgUnitField';
import { AssignmentsMap } from './AssignmentsMap';
import { OnlyAssignableToggle } from './OnlyAssignableToggle';
import { OnlyUnassignedToggle } from './OnlyUnassignedToggle';
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
    filters: {
        flex: '0 1 340px',
        justifyContent: 'flex-end',
        minWidth: 0,
    },
} satisfies SxStyles;

export const AssignmentsMainPanel: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { view, updateParams } = useAssignmentsParams();
    const { isAssignMode } = useAssignmentsContext();
    const handleChangeView = useCallback(
        (_event: SyntheticEvent, newView: AssignmentsView) =>
            updateParams({ view: newView }),
        [updateParams],
    );

    return (
        <Paper sx={styles.panel}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={styles.header}
            >
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
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={1}
                    sx={styles.filters}
                >
                    {isAssignMode && (
                        <>
                            <BulkAssignButton />
                            <EmptyAreaButton />
                        </>
                    )}
                    {isAssignMode && view === 'list' && (
                        <OnlyAssignableToggle />
                    )}
                    <OnlyUnassignedToggle />
                    <FindOrgUnitField />
                </Stack>
            </Stack>
            {view === 'map' && <AssignmentsMap />}
            {view === 'list' && <OrgUnitsTable />}
        </Paper>
    );
};
