import React, { FunctionComponent, useState } from 'react';
import CheckBox from '@mui/icons-material/CheckBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import {
    Button,
    DialogActions,
    DialogTitle,
    Dialog,
    Box,
    IconButton,
    Tooltip,
} from '@mui/material';
import { LoadingSpinner, Table, useSafeIntl } from 'bluesquare-components';
import { Planning, PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { useGetPlanningOrgUnitsChildrenPaginated } from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';
import { SubTeam, User } from 'Iaso/domains/teams/types/team';
import { stickyTableContainerStyles } from 'Iaso/styles/utils';
import { SxStyles } from 'Iaso/types/general';
import { useTableSelection } from 'Iaso/utils/table';
import { useBulkSaveAssignments } from '../../hooks/requests/useSaveAssignment';
import MESSAGES from '../../messages';
import { AssignmentParams } from '../../types/assigment';
import { useGetBulkAssignColumns } from './useGetBulkAssignColumns';

type Props = {
    open: boolean;
    onClose: () => void;
    selectedParentOrgUnit: PlanningOrgUnits;
    planning: Planning;
    selectedUser?: User;
    selectedTeam?: SubTeam;
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
    multiSelectIcons: {
        position: 'absolute',
        top: 2,
        right: theme => theme.spacing(1),
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 10,
    },
};

export const BulkAssignDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    selectedParentOrgUnit,
    planning,
    selectedUser,
    selectedTeam,
}) => {
    const [params, setParams] = useState<AssignmentParams>({
        ...defaultParams,
        planningId: `${planning.id}`,
        orgUnitParentId: `${selectedParentOrgUnit.id}`,
    });

    const { data, isLoading } = useGetPlanningOrgUnitsChildrenPaginated(
        `${planning.id}`,
        params,
    );
    const {
        selection,
        handleUnselectAll,
        handleSelectAll,
        handleTableSelection,
    } = useTableSelection<PlanningOrgUnits>({
        count: data?.count ?? 0,
        initialSelection: {
            selectedItems: [],
            unSelectedItems: [],
            selectAll: true,
            selectCount: 0,
        },
    });
    const columns = useGetBulkAssignColumns();
    const { formatMessage } = useSafeIntl();
    const targetOrgUnitType = planning.target_org_unit_type_details
        ?.map(t => t.name)
        .join(', ');
    const { mutateAsync: saveBulkAssignments, isLoading: isSaving } =
        useBulkSaveAssignments();
    const handleSaveBulkAssignments = async () => {
        await saveBulkAssignments({
            planning: planning.id,
            team: selectedTeam?.id,
            user: selectedUser?.id,
            org_unit_parent_id: selectedParentOrgUnit.id,
            select_all: selection.selectAll,
            selected_ids: selection.selectedItems.map((item: any) => item.id),
            unselected_ids: selection.unSelectedItems.map(
                (item: any) => item.id,
            ),
        });
        onClose();
    };
    const hasMultipleTargets =
        planning.target_org_unit_type_details?.length &&
        planning.target_org_unit_type_details?.length > 1;
    const assignButtonDisabled =
        selection.selectedItems.length === 0 && !selection.selectAll;
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            sx={styles.root}
        >
            {isSaving && <LoadingSpinner />}
            <DialogTitle>
                {formatMessage(MESSAGES.bulkAssign, {
                    targetOrgUnitType: targetOrgUnitType ?? '',
                    parentOrgUnitName: selectedParentOrgUnit.name,
                })}
            </DialogTitle>
            <Box position="relative">
                <Box sx={styles.multiSelectIcons}>
                    <Tooltip title={formatMessage(MESSAGES.selectAll)}>
                        <IconButton
                            size="small"
                            color={selection.selectAll ? 'primary' : 'default'}
                            aria-label={formatMessage(MESSAGES.selectAll)}
                            onClick={() =>
                                handleSelectAll([], [], data?.count ?? 0)
                            }
                        >
                            <CheckBox />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={formatMessage(MESSAGES.unSelectAll)}>
                        <IconButton
                            size="small"
                            aria-label={formatMessage(MESSAGES.unSelectAll)}
                            onClick={handleUnselectAll}
                        >
                            <IndeterminateCheckBoxIcon />
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
                            handleTableSelection(
                                selectionType,
                                items,
                                data?.count,
                            )
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
            </Box>
            <DialogActions>
                <Button onClick={onClose}>
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                <Button
                    onClick={handleSaveBulkAssignments}
                    disabled={assignButtonDisabled}
                >
                    {formatMessage(MESSAGES.assign)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
