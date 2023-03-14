import { useMemo } from 'react';
import { DuplicateData } from '../../types';

const findAlgorithmsUsed = (algos: any[]): ('namesim' | 'invert')[] => {
    const allTypes = algos.map(algo => algo.type);
    return [...new Set(allTypes)];
};

// fields is tableState
const calculateRemainingUnmatched = (fields: any[] = []): number => {
    return fields.filter(field => !field?.final.value).length;
};

type DuplicateInfos = {
    unmatchedRemaining: number;
    formName: string;
    algorithmRuns: number;
    algorithmsUsed: ('namesim' | 'invert')[];
    similarityScore: number;
    isLoading: boolean;
    entityIds: [number, number];
};

type UseDuplicateInfosArgs = {
    tableState: Record<string, any>[];
    duplicatesInfos: DuplicateData[];
    params: { accountId?: string; entities: string };
};

export const useDuplicateInfos = ({
    tableState,
    duplicatesInfos,
    params,
}: UseDuplicateInfosArgs): DuplicateInfos => {
    return useMemo(() => {
        const ids = params?.entities ?? '';
        const entityIds = ids.split(',').map(id => parseInt(id, 10));
        return {
            unmatchedRemaining: calculateRemainingUnmatched(tableState),
            formName: duplicatesInfos?.[0].form.name ?? '',
            algorithmRuns: duplicatesInfos?.[0].algorithms.length ?? 0,
            algorithmsUsed: findAlgorithmsUsed(
                duplicatesInfos?.[0].algorithms ?? [],
            ),
            similarityScore: duplicatesInfos?.[0].similarity_star,
            isLoading: !duplicatesInfos?.length,
            // TODO prevent longer arrays of ids
            entityIds: entityIds as [number, number],
        };
    }, [duplicatesInfos, params?.entities, tableState]);
};
