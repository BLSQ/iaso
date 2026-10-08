import { Timeline } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';

export function canValidateOrBypass(timeline: Timeline): boolean {
    return canValidate(timeline) || canBypass(timeline);
}

export function canValidate(timeline: Timeline): boolean {
    return timeline.status === 'UNKNOWN' && timeline.user_can_do_actions;
}

export function canBypass(timeline: Timeline): boolean {
    return timeline.type === 'NEXT_BYPASS' && timeline.user_can_do_actions;
}
