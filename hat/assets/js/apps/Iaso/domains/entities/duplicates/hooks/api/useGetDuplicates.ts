/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { PaginationParams } from '../../../../../types/general';
import { waitFor } from '../../../../../utils';
import {
    mockDuplicatesDetailsResponse,
    mockDuplicatesDetailsTableData,
    mockDuplicatesTableResponse,
} from '../../mockDuplicationData';
import {
    DuplicateData,
    DuplicateEntityForTable,
    DuplicatesList,
} from '../../types';

const apiUrl = '/api/entityduplicates';

const getDuplicates = async (queryString: string) => {
    const url = `${apiUrl}/${queryString}`;
    console.log('GET', url);
    waitFor(1000);
    if (!queryString.includes('limit')) {
        return mockDuplicatesDetailsResponse();
    }
    return mockDuplicatesTableResponse({
        count: 5,
        has_next: true,
        has_previous: false,
        limit: 20,
    });
};

const formatParams = (params: Record<string, any>) => {
    const copy = { ...params };
    Object.keys(params).forEach(key => {
        if (copy[key] === undefined) {
            delete copy[key];
        }
    });
    if (params.pageSize) {
        copy.limit = params.pageSize;
        delete copy.pageSize;
    }
    if (params.accountId) {
        delete copy.accountId;
    }
    return copy;
};

export type DuplicatesGETParams = {
    params: Partial<PaginationParams> & {
        search?: string;
        entities?: string;
        entity_type?: any;
        submitter?: any;
        submitter_team?: any;
        end_date?: any;
        start_date?: any;
        org_unit?: any;
        similarity?: any;
        algorithm?: any;
        form?: any;
        fields?: any;
        ignored?: boolean;
    };
};

export const useGetDuplicates = ({
    params,
}: DuplicatesGETParams): UseQueryResult<
    DuplicatesList | DuplicateData[],
    any
> => {
    const queryString = new URLSearchParams(formatParams(params)).toString();
    return useSnackQuery({
        queryKey: ['entityDuplicates', queryString],
        queryFn: () => getDuplicates(queryString),
    });
};

const getDuplicatesDetails = async (queryString: string) => {
    const url = `${apiUrl}/details/${queryString}`;
    const result = mockDuplicatesDetailsTableData();
    console.log('details url', url);
    console.log('details', result);
    waitFor(1500);
    return result;
};

type DuplicatesDetailsGETParams = {
    params: {
        entities: string;
    };
};

const getFieldStatus = (base, compare): 'diff' | 'identical' => {
    if (base !== compare) return 'diff';
    return 'identical';
};
const getMergedEntityStatus = (final): 'dropped' | 'identical' => {
    if (!final) return 'dropped';
    return 'identical';
};

export const useGetDuplicateDetails = ({
    params,
}: DuplicatesDetailsGETParams): UseQueryResult<
    DuplicateEntityForTable[],
    unknown
> => {
    // TODO see with backend exact api
    const queryString = new URLSearchParams(formatParams(params)).toString();
    return useSnackQuery({
        queryKey: ['entityDuplicateDetails'],
        queryFn: () => getDuplicatesDetails(queryString),
        options: {
            select: data => {
                if (!data) return [];
                const result = data.map(row => {
                    return {
                        field: row.field,
                        entity1: {
                            value: row.entity1.value,
                            id: row.entity1.id,
                            status: getFieldStatus(
                                row.entity1.value,
                                row.entity2.value,
                            ),
                        },
                        entity2: {
                            value: row.entity2.value,
                            id: row.entity2.id,
                            status: getFieldStatus(
                                row.entity2.value,
                                row.entity1.value,
                            ),
                        },
                        final: {
                            value: row.final.value,
                            id: row.final.id,
                            status: getMergedEntityStatus(row.final.value),
                        },
                    };
                });
                return result;
            },
        },
    });
};
