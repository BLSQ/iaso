import { iasoGetRequest } from '../../../../utils/requests';
// import { getOrgUnitAncestorsNames } from '../../utils';

// Basic type check. Will check missing keys and key types, but not nested objects
// const modelCheck = (response, model) => {
//     const modelKeys = Object.keys(model);
//     const missingKeys = [];
//     modelKeys.forEach(modelKey => {
//         if (response[modelKey] === undefined) {
//             console.error(
//                 'pushing to missingKeys',
//                 modelKey,
//                 response[modelKey],
//             );
//             missingKeys.push(modelKey);
//         } else if (
//             typeof response[modelKey] === 'object' &&
//             model[modelKey] === 'array'
//         ) {
//             if (!Array.isArray(response[modelKey])) {
//                 console.error(
//                     `Wrong property type for ${modelKey}. Should be ${
//                         model[modelKey]
//                     }, was: ${typeof response[modelKey]}`,
//                 );
//                 return false;
//             }
//             // the model object will contain strings that can be compared to typeof
//             // eslint-disable-next-line valid-typeof
//         } else if (typeof response[modelKey] !== model[modelKey]) {
//             console.error(
//                 `Wrong property type for ${modelKey}. Should be ${
//                     model[modelKey]
//                 }, was: ${typeof response[modelKey]}`,
//             );
//             return false;
//         }
//     });
//     if (missingKeys.length > 0) {
//         console.error(
//             `Missing properties in response: ${missingKeys} in `,
//             response,
//         );
//         return false;
//     }
//     return true;
// };

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
            // genealogy: getOrgUnitAncestorsNames(orgUnit),
        };
    });
    return useableData;
};

// const getRootData = model => async () => {
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
            // hasChildren: true,
            hasChildren: orgUnit.has_children,
            // data: getOrgUnitAncestorsNames(orgUnit),
        };
    });
    // if (modelCheck(useableData[0], model)) return useableData;
    // console.error(`Received Wrong data type, expected`, model);
    // return null;
    return useableData;
};

export { getRootData, getChildrenData };
