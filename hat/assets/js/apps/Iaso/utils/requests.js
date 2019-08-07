import { getRequest } from '../libs/Api';

const fetchOrgUnitsTypes = () => getRequest('/api/orgunittypes')
    .then(res => res.orgUnitTypes)
    .catch((error) => {
        console.error('Error while fetching org unit types list:', error);
        return error;
    });

const fetchUsers = () => getRequest('/api/profiles')
    .then(users => users)
    .catch((error) => {
        console.error('Error while fetching profiles list:', error);
        return error;
    });

export {
    fetchOrgUnitsTypes,
    fetchUsers,
};
