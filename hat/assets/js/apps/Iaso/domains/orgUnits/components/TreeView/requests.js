import { iasoGetRequest } from '../../../../utils/requests';

const getChildrenData = async id => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&parent_id=${id}&defaultVersion=true&validation_status=all`,
        },
    });
    const useableData = response.orgUnits.map((orgUnit, index) => {
        if (index % 2 > 0) {
            return { id: orgUnit.id, name: orgUnit.name, hasChildren: true };
        }
        return { id: orgUnit.id, name: orgUnit.name, hasChildren: false };
    });
    return useableData;
};

const getRootData = async () => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&rootsForUser=true&defaultVersion=true&validation_status=all`,
        },
    });
    const useableData = response.orgUnits.map(orgUnit => {
        return { id: orgUnit.id, name: orgUnit.name, hasChildren: true };
    });
    return useableData;
};

export { getRootData, getChildrenData };
