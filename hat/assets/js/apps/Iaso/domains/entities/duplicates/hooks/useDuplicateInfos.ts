import { useMemo } from 'react';

const findAlgorithmsUsed = (algos: any[]): ('namesim' | 'invert')[] => {
    const allTypes = algos.map(algo => algo.type);
    return [...new Set(allTypes)];
};

// fields is tableState
const calculateRemainingUnmatched = (fields: any[]) => {
    return fields.filter(field => !field.final.value).length;
};

export const useDuplicateInfos = ({ tableState, duplicatesInfos, params }) => {
    return useMemo(() => {
        return {
            unmatchedRemaining: calculateRemainingUnmatched(tableState),
            formName: duplicatesInfos?.[0].form.name ?? '',
            algorithmRuns: duplicatesInfos?.[0].algorithms.length ?? 0,
            algorithmsUsed: findAlgorithmsUsed(
                duplicatesInfos?.[0].algorithms ?? [],
            ),
            similarityScore: duplicatesInfos?.[0].similarity_star,
            isLoading: !duplicatesInfos?.length,
            entityIds: params?.entities ?? '',
        };
    }, [duplicatesInfos, params?.entities, tableState]);
};
