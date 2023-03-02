/* eslint-disable camelcase */
import { cloneDeep } from 'lodash';
import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { PaginationParams } from '../../../../types/general';
import { waitFor } from '../../../../utils';
import { mockDuplicatesTableResponse } from '../mockDuplicationData';
import { DuplicatesList } from '../types';

const apiUrl = '/api/entityduplicates';

const getDuplicates = async (queryString: string) => {
    const url = `${apiUrl}/${queryString}`;
    console.log('GET', url);
    waitFor(1000);
    return mockDuplicatesTableResponse({
        count: 21,
        has_next: true,
        has_previous: false,
        limit: 20,
    });
};

const formatParams = (params: Record<string, any>) => {
    const copy = cloneDeep(params);
    Object.keys(params).forEach(key => {
        if (copy[key] === undefined) {
            delete copy[key];
        }
    });
    if (params.pageSize) {
        copy.limit = params.pageSize;
        delete copy.pageSize;
    }
    return copy;
};

export type DuplicatesGETParams = {
    params: PaginationParams & {
        search?: string;
        entity?: any;
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
}: DuplicatesGETParams): UseQueryResult<DuplicatesList, any> => {
    const queryString = new URLSearchParams(formatParams(params)).toString();
    return useSnackQuery({
        queryKey: ['entityDuplicates', queryString],
        queryFn: () => getDuplicates(queryString),
    });
};
