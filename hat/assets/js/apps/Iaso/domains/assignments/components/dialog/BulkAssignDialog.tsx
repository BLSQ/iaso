import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import CheckBox from '@mui/icons-material/CheckBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import {
    Button,
    DialogActions,
    DialogTitle,
    Dialog,
    Box,
    Divider,
    Grid,
} from '@mui/material';
import { LoadingSpinner, Table, useSafeIntl } from 'bluesquare-components';
import { UrlParams } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning, PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { useGetPlanningOrgUnitsChildrenPaginated } from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';
import { SubTeam, User } from 'Iaso/domains/teams/types/team';
import { getStickyTableHeadStyles } from 'Iaso/styles/utils';
import { SxStyles } from 'Iaso/types/general';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
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
    orgUniTypeList?: OrgUnitTypeHierarchyDropdownValues;
};

const defaultParams: UrlParams = {
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
    tableContainer: {
        borderTop: theme => `1px solid ${theme.palette.lightGray.border}`,
        ...getStickyTableHeadStyles('60vh'),
    },
    multiSelectButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        alignSelf: 'center',
    },
};

export const BulkAssignDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    selectedParentOrgUnit,
    planning,
    selectedUser,
    selectedTeam,
    orgUniTypeList,
}) => {
    const hasMultipleTargets: boolean = Boolean(
        planning.target_org_unit_type_details?.length &&
        planning.target_org_unit_type_details?.length > 1,
    );
    const columns = useGetBulkAssignColumns(hasMultipleTargets);
    const { formatMessage } = useSafeIntl();
    const [selectedOrgUnitTypes, setSelectedOrgUnitTypes] = useState<number[]>(
        planning.target_org_unit_type_details?.map(t => t.id) ?? [],
    );
    const [params, setParams] = useState<AssignmentParams>({
        ...defaultParams,
        planningId: `${planning.id}`,
        orgUnitParentId: `${selectedParentOrgUnit.id}`,
        orgUnitTypeIds: selectedOrgUnitTypes.join(','),
    });

    const orgUniTypesOptions = useMemo(() => {
        return orgUniTypeList?.filter(t =>
            planning.target_org_unit_type_details?.some(
                ot => ot.id === t.value,
            ),
        );
    }, [orgUniTypeList, planning.target_org_unit_type_details]);

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
    const targetOrgUnitType =
        planning.target_org_unit_type_details?.map(t => t.name).join(', ') ??
        '';
    const { mutateAsync: saveBulkAssignments, isLoading: isSaving } =
        useBulkSaveAssignments();
    const handleSaveBulkAssignments = async () => {
        saveBulkAssignments({
            planning: planning.id,
            team: selectedTeam?.id,
            user: selectedUser?.id,
            org_unit_parent_id: selectedParentOrgUnit.id,
            org_unit_type_ids: selectedOrgUnitTypes,
            select_all: selection.selectAll,
            selected_ids: selection.selectedItems.map((item: any) => item.id),
            unselected_ids: selection.unSelectedItems.map(
                (item: any) => item.id,
            ),
        }).then(() => onClose());
    };
    const handleChangeOrgUnitTypes = useCallback(
        (_key: string, value: string) => {
            handleUnselectAll();
            const newSelectedOrgUnitTypes = commaSeparatedIdsToArray(value);
            setSelectedOrgUnitTypes(newSelectedOrgUnitTypes);
            setParams(prev => ({
                ...prev,
                orgUnitTypeIds: newSelectedOrgUnitTypes.join(','),
                page: '1',
            }));
        },
        [handleUnselectAll],
    );
    const assignButtonDisabled =
        selection.selectedItems.length === 0 && !selection.selectAll;
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            sx={styles.root}
        >
            {isSaving && <LoadingSpinner />}
            <DialogTitle>
                {formatMessage(MESSAGES.bulkAssign, {
                    targetOrgUnitType,
                    parentOrgUnitName: selectedParentOrgUnit.name,
                })}
            </DialogTitle>
            {hasMultipleTargets && (
                <Grid container sx={{ px: 2, mb: 2 }} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <InputComponent
                            type="select"
                            multi
                            disabled={!orgUniTypeList}
                            keyValue="orgUnitTypeIds"
                            onChange={handleChangeOrgUnitTypes}
                            value={selectedOrgUnitTypes}
                            label={MESSAGES.targetOrgUnitType}
                            options={orgUniTypesOptions}
                            loading={!orgUniTypeList}
                            clearable={false}
                        />
                    </Grid>
                    <Grid item xs={12} md={6} sx={styles.multiSelectButtons}>
                        <Button
                            onClick={() =>
                                handleSelectAll([], [], data?.count ?? 0)
                            }
                            variant="outlined"
                            color={
                                selection.selectAll ? 'primary' : 'secondary'
                            }
                            sx={{
                                mr: 1,
                            }}
                        >
                            <CheckBox sx={{ marginRight: 1 }} />
                            {formatMessage(MESSAGES.selectAll)}
                        </Button>
                        <Button
                            onClick={handleUnselectAll}
                            variant="outlined"
                            color="secondary"
                        >
                            <IndeterminateCheckBoxIcon
                                sx={{ marginRight: 1 }}
                            />
                            {formatMessage(MESSAGES.unSelectAll)}
                        </Button>
                    </Grid>
                </Grid>
            )}
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
                    params={params}
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
                <Divider />
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
