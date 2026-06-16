import React, { FunctionComponent, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import {
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Dialog,
    Box,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Table } from 'bluesquare-components';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { useGetPlanningOrgUnitsChildrenPaginated } from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';
import { stickyTableContainerStyles } from 'Iaso/styles/utils';
import { SxStyles } from 'Iaso/types/general';
import { useTableSelection } from 'Iaso/utils/table';
import { AssignmentParams } from '../../types/assigment';
import { useGetBulkAssignColumns } from './useGetBulkAssignColumns';

type Props = {
    open: boolean;
    onClose: () => void;
    selectedParentOrgUnit: PlanningOrgUnits;
    planningId: string;
};

const defaultParams: Partial<AssignmentParams> = {
    pageSize: '10',
    page: '1',
    order: 'name',
};
const styles: SxStyles = {
    root: {
        '& .MuiSpeedDial-root': {
            display: 'none',
        },
    },
    tableContainer: stickyTableContainerStyles,
};

export const BulkAssignDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    selectedParentOrgUnit,
    planningId,
}) => {
    const [params, setParams] = useState<AssignmentParams>({
        ...defaultParams,
        planningId,
        orgUnitParentId: `${selectedParentOrgUnit.id}`,
    });

    const {
        selection,
        handleUnselectAll,
        handleSelectAll,
        handleTableSelection,
    } = useTableSelection();
    const { data, isLoading } = useGetPlanningOrgUnitsChildrenPaginated(
        planningId,
        params,
    );
    const columns = useGetBulkAssignColumns();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            sx={styles.root}
        >
            <DialogTitle>Bulk Assign</DialogTitle>
            <DialogContent>
                <DialogContentText>Bulk Assign</DialogContentText>
            </DialogContent>
            <Box display="flex" justifyContent="flex-end" gap={1} mr={2}>
                <Tooltip title="Select all">
                    <IconButton
                        color="primary"
                        aria-label="Select all"
                        onClick={() =>
                            handleSelectAll([], [], data?.count ?? 0)
                        }
                    >
                        <CheckCircleIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Unselect all">
                    <IconButton
                        color="primary"
                        aria-label="Unselect all"
                        onClick={handleUnselectAll}
                    >
                        <UnpublishedIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={styles.tableContainer}>
                <Table
                    data={data?.results ?? []}
                    count={data?.count ?? 0}
                    pages={data?.pages ?? 0}
                    marginBottom={false}
                    marginTop={false}
                    columns={columns}
                    extraProps={{
                        loading: isLoading,
                    }}
                    multiSelect
                    selection={selection}
                    setTableSelection={(selectionType, items) =>
                        handleTableSelection(selectionType, items, data?.count)
                    }
                    countOnTop={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    onTableParamsChange={newParams =>
                        setParams({
                            ...params,
                            ...newParams,
                        })
                    }
                    elevation={0}
                />
            </Box>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onClose}>Assign</Button>
            </DialogActions>
        </Dialog>
    );
};
