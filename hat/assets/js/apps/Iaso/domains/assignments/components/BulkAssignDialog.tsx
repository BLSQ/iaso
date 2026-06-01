import React, { FunctionComponent } from 'react';
import {
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Dialog,
} from '@mui/material';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { useGetPlanningOrgUnitsChildrenPaginated } from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';

type Props = {
    open: boolean;
    onClose: () => void;
    selectedParentOrgUnit?: PlanningOrgUnits;
};

export const BulkAssignDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    selectedParentOrgUnit,
    planningId,
}) => {
    console.log('selectedParentOrgUnit', selectedParentOrgUnit);

    const { data, isLoading } = useGetPlanningOrgUnitsChildrenPaginated(
        planningId,
        params,
    );
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Bulk Assign</DialogTitle>
            <DialogContent>
                <DialogContentText>Bulk Assign</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onClose}>Assign</Button>
            </DialogActions>
        </Dialog>
    );
};
