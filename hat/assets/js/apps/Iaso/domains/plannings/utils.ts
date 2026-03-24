import { Planning } from './types';

export const canAssignPlanning = (planning?: Planning): boolean => {
    if (!planning) return false;
    const hasPipelines =
        Array.isArray(planning.pipeline_uuids) &&
        planning.pipeline_uuids.length > 0;
    const hasSampling = Boolean(planning.selected_sampling_result);
    if (!hasPipelines) return true;
    return hasSampling;
};
