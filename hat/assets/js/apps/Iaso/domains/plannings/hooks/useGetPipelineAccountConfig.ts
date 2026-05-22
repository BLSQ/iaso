import { useMemo } from 'react';

import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';

type PipelineConfig = {
    id: string;
    parameters: Record<string, any>;
};

export const useGetPipelineAccountConfig = (
    pipelineId?: string,
): Record<string, any> | undefined => {
    const { data } = useGetPipelineConfig();
    return useMemo(() => {
        const config = data?.config ?? {};
        return config?.pipelines?.find(
            (pipeline: PipelineConfig) => pipeline.id === pipelineId,
        );
    }, [data, pipelineId]);
};
