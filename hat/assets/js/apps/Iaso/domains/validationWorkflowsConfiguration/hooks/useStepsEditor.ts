import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';

export type NodeTemplate = NonNullable<
    ValidationWorkflowRetrieve['node_templates']
>[number];

export type StepDraft = {
    slug: string;
    name: string;
    description?: string;
    canSkipPreviousNodes?: boolean;
    roleIds: number[];
};

const toDraft = (node: NodeTemplate): StepDraft => ({
    slug: node.slug,
    name: node.name,
    description: node.description,
    canSkipPreviousNodes: node.can_skip_previous_nodes,
    roleIds: node.roles_required?.map(role => role.id) ?? [],
});

const isSameDraft = (a: StepDraft, b: StepDraft): boolean =>
    a.name.trim() === b.name.trim() &&
    (a.description ?? '') === (b.description ?? '') &&
    Boolean(a.canSkipPreviousNodes) === Boolean(b.canSkipPreviousNodes) &&
    a.roleIds.length === b.roleIds.length &&
    a.roleIds.every(id => b.roleIds.includes(id));

const isSameSteps = (a: StepDraft[], b: StepDraft[]): boolean =>
    a.length === b.length &&
    a.every(
        (step, index) =>
            step.slug === b[index].slug && isSameDraft(step, b[index]),
    );

export type StepErrors = Record<string, string | undefined>;

type ErrorMessages = { required: string; duplicate: string };

export const getStepErrors = (
    steps: StepDraft[],
    messages: ErrorMessages,
): StepErrors => {
    const nameCounts = new Map<string, number>();
    steps.forEach(({ name }) => {
        const key = name.trim().toLowerCase();
        nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    });
    return Object.fromEntries(
        steps.map(({ slug, name }) => {
            const key = name.trim().toLowerCase();
            if (!key) return [slug, messages.required];
            if ((nameCounts.get(key) ?? 0) > 1)
                return [slug, messages.duplicate];
            return [slug, undefined];
        }),
    );
};

export const useStepsEditor = (nodes: NodeTemplate[]) => {
    const initialSteps = useMemo(() => nodes.map(toDraft), [nodes]);
    const [steps, setSteps] = useState<StepDraft[]>(initialSteps);

    // Server data the steps were last taken from
    const syncedSteps = useRef(initialSteps);
    // Set after a save: the next server data has to replace the saved steps
    const isSyncRequested = useRef(false);

    useEffect(() => {
        if (syncedSteps.current === initialSteps) return;
        const hasLocalChanges = !isSameSteps(steps, syncedSteps.current);
        if (hasLocalChanges && !isSyncRequested.current) return;
        syncedSteps.current = initialSteps;
        isSyncRequested.current = false;
        setSteps(initialSteps);
    }, [initialSteps, steps]);

    const syncOnNextUpdate = useCallback(() => {
        isSyncRequested.current = true;
    }, []);

    const isOrderChanged = useMemo(
        () =>
            steps.some(
                (step, index) => step.slug !== initialSteps[index]?.slug,
            ),
        [steps, initialSteps],
    );

    const changedSteps = useMemo(() => {
        const initialBySlug = new Map(initialSteps.map(s => [s.slug, s]));
        return steps.filter(step => {
            const initial = initialBySlug.get(step.slug);
            return !initial || !isSameDraft(step, initial);
        });
    }, [steps, initialSteps]);

    const isDirty = isOrderChanged || changedSteps.length > 0;

    const updateStep = useCallback(
        (slug: string, changes: Partial<StepDraft>) =>
            setSteps(current =>
                current.map(step =>
                    step.slug === slug ? { ...step, ...changes } : step,
                ),
            ),
        [],
    );

    const moveStep = useCallback(
        (activeSlug: string, overSlug: string) =>
            setSteps(current => {
                const from = current.findIndex(s => s.slug === activeSlug);
                const to = current.findIndex(s => s.slug === overSlug);
                return from < 0 || to < 0
                    ? current
                    : arrayMove(current, from, to);
            }),
        [],
    );

    const reset = useCallback(() => {
        syncedSteps.current = initialSteps;
        setSteps(initialSteps);
    }, [initialSteps]);

    return {
        steps,
        changedSteps,
        isOrderChanged,
        isDirty,
        updateStep,
        moveStep,
        reset,
        syncOnNextUpdate,
    };
};

export type StepsEditorState = ReturnType<typeof useStepsEditor>;
