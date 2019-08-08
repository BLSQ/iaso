import { getRequest, patchRequest } from '../libs/Api';

const fetchOrgUnitsTypes = () => getRequest('/api/orgunittypes')
    .then(res => res.orgUnitTypes)
    .catch((error) => {
        console.error('Error while fetching org unit types list:', error);
        return error;
    });

const fetchSourceTypes = () => getRequest('/api/sourcetypes')
    .then(soureTypes => soureTypes)
    .catch((error) => {
        console.error('Error while fetching source types list:', error);
        return error;
    });

const fetchOrgUnitDetail = orgUnitId => getRequest(`/api/orgunits/${orgUnitId}`)
    .then(orgUnit => orgUnit)
    .catch((error) => {
        console.error('Error while org unit detail:', error);
        return error;
    });

const saveOrgUnit = orgUnit => patchRequest(`/api/orgunits/${orgUnit.id}/`, orgUnit)
    .then(savedOrgUnit => savedOrgUnit)
    .catch((error) => {
        console.error('Error while saving org unit detail:', error);
        return error;
    });

export {
    fetchOrgUnitsTypes,
    fetchSourceTypes,
    fetchOrgUnitDetail,
    saveOrgUnit,
};
