import { useSnackQuery } from '../../../../libs/apiHooks';
import { getRequest } from '../../../../libs/Api';

const getChildrenData = async id => {
    const response = await getRequest(
        `/api/orgunits/?&parent_id=${id}&validation_status=all&treeSearch=true&ignoreEmptyNames=true`,
    );
    const usableData = response.orgunits.map(orgUnit => {
        return {
            ...orgUnit,
            id: orgUnit.id.toString(),
        };
    });
    return usableData;
};

const makeUrl = (id, type) => {
    if (id) {
        if (type === 'version')
            return `/api/orgunits/?&rootsForUser=true&version=${id}&validation_status=all&treeSearch=true&ignoreEmptyNames=true`;
        if (type === 'source')
            return `/api/orgunits/?&rootsForUser=true&source=${id}&validation_status=all&treeSearch=true&ignoreEmptyNames=true`;
    }
    return `/api/orgunits/?&rootsForUser=true&defaultVersion=true&validation_status=all&treeSearch=true&ignoreEmptyNames=true`;
};

// mapping the request result here i.o in the useRootData hook to keep the hook more generic
const getRootData = async (id, type = 'source') => {
    const response = await getRequest(makeUrl(id, type));
    const usableData = response.orgunits.map(orgUnit => {
        return {
            ...orgUnit,
            id: orgUnit.id.toString(),
        };
    });
    return usableData;
};

/**
 * @param {string} searchValue
 * @param {number} resultsCount
 */

const searchOrgUnits = async (searchValue, resultsCount, source, version) => {
    let url = `/api/orgunits/?searches=[{"validation_status":"all","search":"${searchValue}","defaultVersion":"true"}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`;
    if (source) {
        url = `/api/orgunits/?searches=[{"validation_status":"all","search":"${searchValue}","source":${source}}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`;
    }
    if (version) {
        url = `/api/orgunits/?searches=[{"validation_status":"all","search":"${searchValue}","version":${version}}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`;
    }
    const result = await getRequest(url);
    return result.orgunits;
};

export const useTreeviewSearch = (
    request,
    searchValue,
    resultsCount,
    enabled,
) => {
    return useSnackQuery(
        ['TreeviewSearch', request, searchValue, resultsCount],
        async () => {
            const queryResult = await request(searchValue, resultsCount);
            return queryResult;
        },
        undefined,
        { enabled, initialData: [] },
    );
};

const useGetOrgUnit = OrgUnitId =>
    useSnackQuery(
        ['orgunits', OrgUnitId],
        async () => getRequest(`/api/orgunits/${OrgUnitId}/`),
        undefined,
        {
            enabled: OrgUnitId !== undefined && OrgUnitId !== null,
        },
    );

export const useChildrenData = (request, id, enabled) =>
    useSnackQuery(
        ['getChildrenData', request, id],
        async () => {
            return request(id);
        },
        undefined,
        { enabled },
    );

export const useRootData = request =>
    useSnackQuery(['getRootData', request], async () => request(), undefined, {
        keepPreviousData: false,
    });

export { getRootData, getChildrenData, searchOrgUnits, useGetOrgUnit };
