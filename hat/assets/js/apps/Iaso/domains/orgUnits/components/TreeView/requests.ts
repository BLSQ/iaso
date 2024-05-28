import { UseQueryResult } from 'react-query';
import { errorSnackBar } from '../../../../constants/snackBars';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { dispatch } from '../../../../redux/store';
import { OrgUnit } from '../../types/orgUnit';

export const getChildrenData = (
    id: string,
    validationStatus = 'all',
): Promise<OrgUnit> => {
    return getRequest(
        `/api/orgunits/tree/?&parent_id=${id}&validation_status=${validationStatus}&ignoreEmptyNames=true`,
    )
        .then(response => {
            return response.map((orgUnit: any) => {
                return {
                    ...orgUnit,
                    id: orgUnit.id.toString(),
                };
            });
        })
        .catch((error: Error) => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('getChildrenDataError', null, error),
                ),
            );
            console.error(
                'Error while fetching Treeview item children:',
                error,
            );
        });
};

const makeUrl = (
    id?: string | number,
    type?: string,
    validationStatus = 'all',
) => {
    if (id) {
        if (type === 'version')
            return `/api/orgunits/tree/?&version=${id}&validation_status=${validationStatus}&ignoreEmptyNames=true`;
        if (type === 'source')
            return `/api/orgunits/tree/?&source=${id}&validation_status=${validationStatus}&ignoreEmptyNames=true`;
    }
    return `/api/orgunits/tree/?&defaultVersion=true&validation_status=${validationStatus}&ignoreEmptyNames=true`;
};

export const getRootData = (
    id?: string | number,
    type = 'source',
    validationStatus = 'all',
): Promise<OrgUnit[]> => {
    return getRequest(makeUrl(id, type, validationStatus))
        .then(response => {
            return response.map((orgUnit: any) => {
                return {
                    ...orgUnit,
                    id: orgUnit.id.toString(),
                };
            });
        })
        .catch((error: Error) => {
            dispatch(
                enqueueSnackbar(errorSnackBar('getRootDataError', null, error)),
            );
            console.error('Error while fetching Treeview items:', error);
        });
};

const endpoint = '/api/orgunits/tree/search';
const search = (
    input1: string,
    validationStatus = 'all',
    input2?: string | number,
    type?: string,
) => {
    switch (type) {
        case 'source':
            return `search=${input1}&validation_status=${validationStatus}&source=${input2}`;
        case 'version':
            return `search=${input1}&validation_status=${validationStatus}&version=${input2}`;
        default:
            return `search=${input1}&validation_status=${validationStatus}&defaultVersion=true`;
    }
};
const sortingAndPaging = (resultsCount: number) =>
    `order=name&page=1&limit=${resultsCount}&smallSearch=true`;

const makeSearchUrl = ({
    value,
    count,
    source,
    version,
    validationStatus = 'all',
}: {
    value: string;
    count: number;
    source?: string | number;
    version?: string | number;
    validationStatus?: string;
}) => {
    if (source) {
        return `${endpoint}?${search(
            value,
            validationStatus,
            source,
            'source',
        )}&${sortingAndPaging(count)}`;
    }
    if (version) {
        return `${endpoint}?${search(
            value,
            validationStatus,
            version,
            'version',
        )}&${sortingAndPaging(count)}`;
    }
    return `${endpoint}/?${search(value, validationStatus)}&${sortingAndPaging(
        count,
    )}`;
};

export const searchOrgUnits = ({
    value,
    count,
    source,
    version,
    validationStatus = 'all',
}: {
    value: string;
    count: number;
    source?: string | number;
    version?: string | number;
    validationStatus?: string;
}): Promise<OrgUnit[]> => {
    const url = makeSearchUrl({
        value,
        count,
        source,
        version,
        validationStatus,
    });
    return getRequest(url)
        .then((result: any) => result.results)
        .catch((error: Error) => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('searchOrgUnitsError', null, error),
                ),
            );
            console.error('Error while searching org units:', error);
        });
};

export const useGetOrgUnit = (
    OrgUnitId: string | undefined,
): UseQueryResult<OrgUnit, Error> =>
    useSnackQuery(
        ['orgunits', OrgUnitId],
        async () => getRequest(`/api/orgunits/${OrgUnitId}/`),
        undefined,
        {
            enabled: OrgUnitId !== undefined && OrgUnitId !== null,
        },
    );

const getOrgUnits = (
    orgUnitsIds: string[] | string,
    validationStatus = 'all',
) => {
    const idsString = Array.isArray(orgUnitsIds)
        ? orgUnitsIds?.join(',')
        : orgUnitsIds;
    const searchParam = `[{"validation_status":"${validationStatus}","search": "ids:${idsString}" }]`;
    return getRequest(`/api/orgunits/?limit=10&searches=${searchParam}`);
};

export const useGetMultipleOrgUnits = (
    orgUnitsIds: string[] | string,
    validationStatus = 'all',
): UseQueryResult<OrgUnit[], Error> => {
    return useSnackQuery({
        queryKey: ['orgunits', orgUnitsIds, validationStatus],
        queryFn: () => getOrgUnits(orgUnitsIds, validationStatus),
        options: {
            enabled: Boolean(orgUnitsIds?.length),
            select: (data: any) => {
                if (!data) return {};
                return data.orgunits;
            },
        },
    });
};
