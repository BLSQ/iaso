/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { PaginationParams } from '../../../../../types/general';
import {
    DuplicateData,
    DuplicateDetailData,
    DuplicatesList,
} from '../../types';
import { getRequest } from '../../../../../libs/Api';

const apiUrl = '/api/entityduplicates';

const getDuplicates = async (queryString: string) => {
    const url = `${apiUrl}/?${queryString}`;
    return getRequest(url);
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
        entity?: string;
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
    const url = `${apiUrl}/detail/?${queryString}`;
    return getRequest(url);
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
    DuplicateDetailData,
    unknown
> => {
    // TODO see with backend exact api
    const queryString = new URLSearchParams(formatParams(params)).toString();
    return useSnackQuery({
        queryKey: ['entityDuplicateDetails'],
        queryFn: () => getDuplicatesDetails(queryString),
        options: {
            select: data => {
                if (!data)
                    return { fields: [], descriptor1: {}, descriptor2: {} };

                const fields_result = data.fields.map(row => {
                    return {
                        // We keep "field" i.o "the_field" as key to avoid a bug with the table
                        field: row.the_field,
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

                return {
                    fields: fields_result,
                    descriptor1: data.descriptor1,
                    descriptor2: data.descriptor2,
                };
            },
        },
    });
};
