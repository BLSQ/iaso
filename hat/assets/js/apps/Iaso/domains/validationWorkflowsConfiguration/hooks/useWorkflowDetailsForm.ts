import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows/models/validationWorkflowRetrieve.zod';

export type WorkflowDetailsDraft = {
    name: string;
    description: string;
    formIds: number[];
};

const toDraft = (
    workflow?: ValidationWorkflowRetrieve,
): WorkflowDetailsDraft => ({
    name: workflow?.name ?? '',
    description: workflow?.description ?? '',
    formIds: workflow?.forms?.map(form => form.id) ?? [],
});

const isSameDraft = (
    a: WorkflowDetailsDraft,
    b: WorkflowDetailsDraft,
): boolean =>
    a.name.trim() === b.name.trim() &&
    a.description === b.description &&
    a.formIds.length === b.formIds.length &&
    a.formIds.every(id => b.formIds.includes(id));

export const useWorkflowDetailsForm = (
    workflow?: ValidationWorkflowRetrieve,
) => {
    const initialDetails = useMemo(() => toDraft(workflow), [workflow]);
    const [details, setDetails] =
        useState<WorkflowDetailsDraft>(initialDetails);

    // Server data the details were last taken from
    const syncedDetails = useRef(initialDetails);
    // Set after a save: the next server data has to replace the saved details
    const isSyncRequested = useRef(false);

    useEffect(() => {
        if (syncedDetails.current === initialDetails) return;
        const hasLocalChanges = !isSameDraft(details, syncedDetails.current);

        const isSameAsServer = isSameDraft(details, initialDetails);
        if (hasLocalChanges && !isSameAsServer && !isSyncRequested.current)
            return;
        syncedDetails.current = initialDetails;
        isSyncRequested.current = false;
        setDetails(initialDetails);
    }, [initialDetails, details]);

    const syncOnNextUpdate = useCallback(() => {
        isSyncRequested.current = true;
    }, []);

    const isDirty = !isSameDraft(details, initialDetails);

    const updateDetails = useCallback(
        (changes: Partial<WorkflowDetailsDraft>) =>
            setDetails(current => ({ ...current, ...changes })),
        [],
    );

    const reset = useCallback(() => {
        syncedDetails.current = initialDetails;
        setDetails(initialDetails);
    }, [initialDetails]);

    return { details, isDirty, updateDetails, reset, syncOnNextUpdate };
};
