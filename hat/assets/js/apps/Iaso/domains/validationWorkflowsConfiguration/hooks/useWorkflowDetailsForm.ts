import { useCallback, useEffect, useMemo, useState } from 'react';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';

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

    useEffect(() => {
        setDetails(initialDetails);
    }, [initialDetails]);

    const isDirty = !isSameDraft(details, initialDetails);

    const updateDetails = useCallback(
        (changes: Partial<WorkflowDetailsDraft>) =>
            setDetails(current => ({ ...current, ...changes })),
        [],
    );

    const reset = useCallback(
        () => setDetails(initialDetails),
        [initialDetails],
    );

    return { details, isDirty, updateDetails, reset };
};
