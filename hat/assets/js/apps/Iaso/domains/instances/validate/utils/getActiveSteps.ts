import {
    Timeline,
    ValidationNodeRetrieveResponse,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';

export const getWorkflowTimeline = (
    workflow: ValidationNodeRetrieveResponse | undefined,
): Timeline[] => workflow?.submissions?.[0]?.timeline ?? [];

const getActiveStepsFromTimeline = (timeline: Timeline[]): Timeline[] =>
    timeline
        .filter((step: Timeline) => step.user_can_do_actions)
        .filter(
            (step: Timeline) =>
                step.status !== 'ACCEPTED' && step.status !== 'SKIPPED',
        );

export const getActiveSteps = (
    workflow: ValidationNodeRetrieveResponse | undefined,
): Timeline[] => getActiveStepsFromTimeline(getWorkflowTimeline(workflow));

export const getValidationStepContext = (
    workflow: ValidationNodeRetrieveResponse | undefined,
    selectedStep: string | undefined,
) => {
    const activeSteps = getActiveStepsFromTimeline(
        getWorkflowTimeline(workflow),
    );
    const selectedActiveStep = activeSteps.find(
        step => `${step.id}` === selectedStep,
    );

    // Timeline is in descending order; the next expected step is the last active one.
    const expectedNextStepId = activeSteps.at(-1)?.id ?? null;

    return {
        activeSteps,
        expectedNextStepId,
        selectedNodeSlug: selectedActiveStep?.node_template_slug ?? '',
        isSelectedStepActive: Boolean(selectedActiveStep),
    };
};
