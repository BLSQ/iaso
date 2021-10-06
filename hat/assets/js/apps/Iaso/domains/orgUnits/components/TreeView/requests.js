import { iasoGetRequest } from '../../../../utils/requests';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { getRequest } from '../../../../libs/Api';

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

const getRootData = async source => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: source
                ? `/api/orgunits/?&rootsForUser=true&source=${source}&validation_status=all&treeSearch=true&ignoreEmptyNames=true`
                : `/api/orgunits/?&rootsForUser=true&defaultVersion=true&validation_status=all&treeSearch=true&ignoreEmptyNames=true`,
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

const useGetOrgUnit = OrgUnitId =>
    useSnackQuery(
        ['orgunits', OrgUnitId],
        () => getRequest(`/api/orgunits/${OrgUnitId}/`),
        undefined,
        {
            enabled: OrgUnitId !== undefined && OrgUnitId !== null,
        },
    );

export { getRootData, getChildrenData, searchOrgUnits, useGetOrgUnit };
