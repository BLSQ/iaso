import { iasoGetRequest } from '../../../../utils/requests';
import { getOrgUnitAncestors } from '../../utils';

// hack to get api query to return parent tree. Should beremoved when API is updated
const LIMIT_HACK = '&limit=100000';

const getChildrenData = async id => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&parent_id=${id}&defaultVersion=true&validation_status=all${LIMIT_HACK}`,
        },
    });
    const useableData = response.orgunits.map(orgUnit => {
        return {
            id: orgUnit.id,
            name: orgUnit.name,
            hasChildren: orgUnit.has_children,
            data: getOrgUnitAncestors(orgUnit),
        };
    });
    return useableData;
};

const getRootData = async () => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&rootsForUser=true&defaultVersion=true&validation_status=all${LIMIT_HACK}`,
        },
    });
    const useableData = response.orgunits.map(orgUnit => {
        return {
            id: orgUnit.id.toString(),
            name: orgUnit.name,
            hasChildren: orgUnit.has_children,
            data: getOrgUnitAncestors(orgUnit),
        };
    });
    return useableData;
};

/**
 * @param {string} searchValue
 * @param {number} resultsCount
 */
const searchOrgUnits = async (searchValue, resultsCount) => {
    const url = `/api/orgunits/?searches=[{"validation_status":"VALID","search":"${searchValue}","defaultVersion":"true"}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`;
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

export { getRootData, getChildrenData, searchOrgUnits, getOrgUnit };
