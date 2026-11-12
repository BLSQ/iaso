import { useCallback, useEffect, useMemo, useState } from 'react';
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
    a.name === b.name &&
    Boolean(a.canSkipPreviousNodes) === Boolean(b.canSkipPreviousNodes) &&
    a.roleIds.length === b.roleIds.length &&
    a.roleIds.every(id => b.roleIds.includes(id));

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

    // Server data changed (save, add or delete): start again from it.
    useEffect(() => {
        setSteps(initialSteps);
    }, [initialSteps]);

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

    const reset = useCallback(() => setSteps(initialSteps), [initialSteps]);

    return {
        steps,
        changedSteps,
        isOrderChanged,
        isDirty,
        updateStep,
        moveStep,
        reset,
    };
};
