import { useCallback } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useUpdateAssignments } from '../api/useUpdateAssignments';
import { useConfirmPublishedChange } from './PublishedPlanningConfirmation';

// The server also removes the assignments made inside the org units.
export const useUnassignOrgUnits = (): ((orgUnitIds: number[]) => void) => {
    const { planning } = useAssignmentsContext();
    const updateAssignments = useUpdateAssignments(planning.id);
    const confirmPublishedChange = useConfirmPublishedChange();
    return useCallback(
        orgUnitIds =>
            confirmPublishedChange(() => updateAssignments({ orgUnitIds })),
        [confirmPublishedChange, updateAssignments],
    );
};
