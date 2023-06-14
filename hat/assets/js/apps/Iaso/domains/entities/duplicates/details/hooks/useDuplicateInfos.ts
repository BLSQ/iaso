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
    algorithmsUsed: ('namesim' | 'invert' | 'levenshtein')[];
    similarityScore: number;
    isLoading: boolean;
    entityIds: [number, number];
};

type UseDuplicateInfosArgs = {
    tableState: Record<string, any>[];
    duplicatesInfos: { results: DuplicateData[] };
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
            formName: duplicatesInfos?.results?.[0]?.form.name ?? '',
            algorithmRuns: duplicatesInfos?.results?.[0]?.analyzis.length ?? 0,
            algorithmsUsed: findAlgorithmsUsed(
                duplicatesInfos?.results?.[0]?.analyzis ?? [],
            ),
            similarityScore: duplicatesInfos?.results?.[0]?.similarity_star,
            isLoading: (duplicatesInfos?.results ?? []).length === 0,
            // TODO prevent longer arrays of ids
            entityIds: entityIds as [number, number],
        };
    }, [duplicatesInfos, params?.entities, tableState]);
};
