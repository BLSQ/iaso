import { useQuery } from 'react-query';
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
            id: orgUnit.id,
            name: orgUnit.name,
            hasChildren: orgUnit.has_children,
            data: orgUnit,
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
            id: orgUnit.id.toString(),
            name: orgUnit.name,
            hasChildren: orgUnit.has_children,
            data: orgUnit,
        };
    });
    return usableData;
};

/**
 * @param {string} searchValue
 * @param {number} resultsCount
 */
const searchOrgUnits = async (searchValue, resultsCount, source) => {
    const url = source
        ? `/api/orgunits/?searches=[{"validation_status":"all","search":"${searchValue}","source":${source}}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`
        : `/api/orgunits/?searches=[{"validation_status":"all","search":"${searchValue}","defaultVersion":"true"}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`;
    return iasoGetRequest({
        requestParams: { url },
        disableSuccessSnackBar: true,
        errorKeyMessage: 'Searching Org Units',
        consoleError: url,
    });
};

const getOrgUnit = orgUnitId =>
    iasoGetRequest({
        requestParams: { url: `/api/orgunits/${orgUnitId}` },
        disableSuccessSnackBar: true,
    });

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

export { getRootData, getChildrenData, searchOrgUnits, getOrgUnit };
