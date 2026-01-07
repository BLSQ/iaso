import { Planning } from '../types';

export const useCanAssign = (planning?: Planning): boolean => {
    if (!planning) return false;

    const hasPipelines =
        Array.isArray(planning.pipeline_uuids) &&
        planning.pipeline_uuids.length > 0;
    const hasSampling = !!planning.selected_sampling_results;
    const isPublished = !!planning.published_at;

    if (!isPublished) return false;
    if (!hasPipelines) return true;
    return hasSampling;
};
