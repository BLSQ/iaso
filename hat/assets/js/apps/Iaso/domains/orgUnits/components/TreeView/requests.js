import { iasoGetRequest } from '../../../../utils/requests';

const getChildrenData = async id => {
    const response = await iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&parent_id=${id}&defaultVersion=true&validation_status=all`,
        },
    });
    const useableData = response.orgUnits.map(orgUnit => {
        return {
            id: orgUnit.id,
            name: orgUnit.name,
            hasChildren: orgUnit.has_children,
        };
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
        return {
            id: orgUnit.id.toString(),
            name: orgUnit.name,
            hasChildren: orgUnit.has_children,
        };
    });
    return useableData;
};

export { getRootData, getChildrenData };
