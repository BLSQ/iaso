import { useCallback } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import {
    UpdateAssignments,
    useUpdateAssignments,
} from '../api/useUpdateAssignments';
import { useConfirmPublishedChange } from './PublishedPlanningConfirmation';

// Asks for confirmation first when the planning is published.
export const useChangeAssignments = (): UpdateAssignments => {
    const { planning } = useAssignmentsContext();
    const updateAssignments = useUpdateAssignments(planning.id);
    const confirmPublishedChange = useConfirmPublishedChange();
    return useCallback(
        changes => confirmPublishedChange(() => updateAssignments(changes)),
        [confirmPublishedChange, updateAssignments],
    );
};
