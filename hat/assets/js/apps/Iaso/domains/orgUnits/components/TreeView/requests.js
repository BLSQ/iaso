import { useQuery } from 'react-query';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { iasoGetRequest } from '../../../../utils/requests';

const getChildrenData = async id => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&parent_id=${id}&validation_status=all&treeSearch=true&ignoreEmptyNames=true`,
        },
    });
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
const getRootData = async (id, type = 'source') => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: makeUrl(id, type),
        },
    });
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
    return iasoGetRequest({
        requestParams: { url },
        disableSuccessSnackBar: true,
        errorKeyMessage: 'Searching Org Units',
        consoleError: url,
    });
};

const useGetOrgUnit = OrgUnitId =>
    useSnackQuery(
        ['orgunits', OrgUnitId],
        () => getRequest(`/api/orgunits/${OrgUnitId}/`),
        undefined,
        {
            enabled: OrgUnitId !== undefined && OrgUnitId !== null,
        },
    );

export const useChildrenData = (request, id, enabled) =>
    useQuery(
        ['getChildrenData', request, id],
        async () => {
            return request(id);
        },
        { enabled },
    );

export const useRootData = request =>
    useQuery(['getRootData', request], async () => request(), {
        keepPreviousData: false,
    });

export { getRootData, getChildrenData, searchOrgUnits, useGetOrgUnit };
