import { UseQueryResult } from 'react-query';
import { openSnackBar } from '../../../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../../../constants/snackBars';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { OrgUnit, OrgUnitStatus } from '../../types/orgUnit';

const getValidationStatus = (statusSettings: OrgUnitStatus[]): string => {
    return statusSettings
        .map(status => `&validation_status=${status}`)
        .join('');
};

const baseApiUrl = '/api/orgunits/tree/';

export const getChildrenData = async (
    id: string,
    statusSettings: OrgUnitStatus[],
    version?: string | number,
    source?: string | number,
): Promise<OrgUnit[]> => {
    try {
        let url = `${baseApiUrl}?parent_id=${id}&ignoreEmptyNames=true${getValidationStatus(
            statusSettings,
        )}`;
        if (version) {
            url = `${url}&version=${version}`;
        } else if (source) {
            url = `${url}&data_source_id=${source}`;
        }
        const response = await getRequest(url);
        return response.map((orgUnit: any) => ({
            ...orgUnit,
            id: orgUnit.id.toString(),
        }));
    } catch (error: unknown) {
        openSnackBar(errorSnackBar('getChildrenDataError', null, error));
        console.error('Error while fetching Treeview item children:', error);
        throw error;
    }
};

const makeUrl = (
    id?: string | number,
    type?: string,
    statusSettings: OrgUnitStatus[] = ['VALID'],
): string => {
    const validationStatusString = getValidationStatus(statusSettings);
    const defaultUrl = `${baseApiUrl}?ignoreEmptyNames=true${validationStatusString}`;
    if (!id) return defaultUrl;
    switch (type) {
        case 'version':
            return `${defaultUrl}&version=${id}`;
        case 'source':
            return `${defaultUrl}&data_source_id=${id}`;
        default:
            return defaultUrl;
    }
};

export const getRootData = async (
    id?: string | number,
    type = 'source',
    statusSettings: OrgUnitStatus[] = ['VALID'],
): Promise<OrgUnit[]> => {
    try {
        const response = await getRequest(makeUrl(id, type, statusSettings));
        return response.map((orgUnit: any) => ({
            ...orgUnit,
            id: orgUnit.id.toString(),
        }));
    } catch (error: unknown) {
        openSnackBar(errorSnackBar('getRootDataError', null, error));
        console.error('Error while fetching Treeview items:', error);
        throw error;
    }
};

const endpoint = `${baseApiUrl}search`;
const search = (
    input1: string,
    input2?: string | number,
    type?: string,
    statusSettings: OrgUnitStatus[] = ['VALID'],
): string => {
    const validationStatusString = getValidationStatus(statusSettings);
    let typeParam;
    switch (type) {
        case 'version':
            typeParam = `&version=${input2}`;
            break;
        case 'source':
            typeParam = `&data_source_id=${input2}`;
            break;
        default:
            typeParam = '';
            break;
    }
    return `search=${input1}${typeParam}${validationStatusString}`;
};
const sortingAndPaging = (resultsCount: number): string =>
    `order=name&page=1&limit=${resultsCount}&smallSearch=true`;

const makeSearchUrl = ({
    value,
    count,
    source,
    version,
    statusSettings = ['VALID'],
}: {
    value: string;
    count: number;
    source?: string | number;
    version?: string | number;
    statusSettings?: OrgUnitStatus[];
}): string => {
    let searchType = '';
    if (source) {
        searchType = 'source';
    } else if (version) {
        searchType = 'version';
    }
    const searchId = source || version;
    return `${endpoint}?${search(
        value,
        searchId,
        searchType,
        statusSettings,
    )}&${sortingAndPaging(count)}`;
};

export const searchOrgUnits = async ({
    value,
    count,
    source,
    version,
    statusSettings = ['VALID'],
}: {
    value: string;
    count: number;
    source?: string | number;
    version?: string | number;
    statusSettings?: OrgUnitStatus[];
}): Promise<OrgUnit[]> => {
    try {
        const url = makeSearchUrl({
            value,
            count,
            source,
            version,
            statusSettings,
        });
        const result = await getRequest(url);
        return result.results;
    } catch (error: unknown) {
        openSnackBar(errorSnackBar('searchOrgUnitsError', null, error));
        console.error('Error while searching org units:', error);
        return Promise.reject(error);
    }
};

// What the treeview picker needs for an initial selection (label, status icon,
// ancestors to preexpand) plus the type id; leaving out instances_count skips
// the expensive descendants count on the backend.
export const TREEVIEW_ORG_UNIT_FIELDS =
    'id,name,validation_status,org_unit_type_id,org_unit_type_name,parent';

export const useGetOrgUnit = (
    orgUnitId?: string,
    // `fields=` allow-list, ':all' for the full org unit.
    fields: string = TREEVIEW_ORG_UNIT_FIELDS,
): UseQueryResult<OrgUnit, Error> =>
    useSnackQuery(
        ['orgunits', `${orgUnitId}`, fields],
        () => getRequest(`/api/orgunits/${orgUnitId}/?fields=${fields}`),
        undefined,
        {
            enabled: Boolean(orgUnitId),
            staleTime: Infinity,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    );

const getOrgUnits = async (
    orgUnitsIds: string | (number | string)[] | undefined,
    statusSettings = 'all',
): Promise<OrgUnit[]> => {
    const idsString = Array.isArray(orgUnitsIds)
        ? orgUnitsIds.join(',')
        : orgUnitsIds;
    const searchParam = `[{"validation_status":"${statusSettings}","search": "ids:${idsString}" }]`;
    return getRequest(`/api/orgunits/?limit=10&searches=${searchParam}`);
};

export const useGetMultipleOrgUnits = (
    orgUnitsIds: string | (number | string)[] | undefined,
    statusSettings = 'all',
): UseQueryResult<OrgUnit[], Error> => {
    return useSnackQuery({
        queryKey: ['orgunits', orgUnitsIds, statusSettings],
        queryFn: () => getOrgUnits(orgUnitsIds, statusSettings),
        options: {
            enabled: Boolean(orgUnitsIds?.length),
            select: (data: any) => (data ? data.orgunits : {}),
        },
    });
};
