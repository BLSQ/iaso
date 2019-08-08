import { getRequest, patchRequest } from '../libs/Api';

import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../components/snackBars';

const fetchOrgUnitsTypes = () => getRequest('/api/orgunittypes')
    .then(res => res.orgUnitTypes)
    .catch((error) => {
        console.error('Error while fetching org unit types list:', error);
        throw error;
    });

const fetchSourceTypes = () => getRequest('/api/sourcetypes')
    .then(soureTypes => soureTypes)
    .catch((error) => {
        console.error('Error while fetching source types list:', error);
        throw error;
    });

const fetchOrgUnitDetail = orgUnitId => getRequest(`/api/orgunits/${orgUnitId}`)
    .then(orgUnit => orgUnit)
    .catch((error) => {
        console.error('Error while org unit detail:', error);
        throw error;
    });

const saveOrgUnit = (orgUnit, dispatch) => patchRequest(`/api/orgunits/${orgUnit.id}/`, orgUnit)
    .then((savedOrgUnit) => {
        dispatch(enqueueSnackbar(succesfullSnackBar()));
        return savedOrgUnit;
    })
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar()));
        console.error('Error while saving org unit detail:', error);
        throw error;
    });

export {
    fetchOrgUnitsTypes,
    fetchSourceTypes,
    fetchOrgUnitDetail,
    saveOrgUnit,
};
