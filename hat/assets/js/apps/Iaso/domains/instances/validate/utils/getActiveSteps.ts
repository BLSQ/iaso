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
    const timeline = getWorkflowTimeline(workflow);
    const activeSteps = getActiveStepsFromTimeline(timeline);
    const selectedNodeSlug =
        timeline.find(step => `${step.id}` === selectedStep)
            ?.node_template_slug ?? '';

    return { activeSteps, selectedNodeSlug };
};
