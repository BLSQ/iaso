import { useCallback } from 'react';
import { postRequestHandler, useAPI } from '../../utils/requests';

export const sendDhisOuImporterRequest = async requestBody => {
    if (requestBody) {
        return postRequestHandler({
            // url: '/api/dhis2ouimporter/',
            // body: requestBody,
            requestParams: { url: '/api/dhis2ouimporter/', body: requestBody },
            errorKeyMessage: 'dhisouimporterError',
            consoleError: 'DHIS OU Importer',
        });
    }
    return null;
};

/**
 *
 * @param {Object} requestBody - request's body
 * @param {number} requestBody.source_id
 * @param {number} requestBody.source_version_number
 * @param {string} requestBody.dhis_name
 * @param {string} requestBody.dhis_url
 * @param {string} requestBody.dhis_login
 * @param {string} requestBody.dhis_password
 * @param {boolean} requestBody.force - should be false
 * @param {boolean} requestBody.validate_status
 * @param {boolean} requestBody.continue_on_error
 * @returns {Object} request's response
 */

// export const useDhisOuImporterRequest = requestBody => {
//     const [result, setResult] = useState(null);
//     useEffect(() => {
//         const executeRequest = async () => {
//             const response = await sendDhisOuImporterRequest(requestBody);
//             if (response) {
//                 setResult(response);
//             }
//         };
//         // TODO add error handling
//         executeRequest();
//     }, [requestBody]);
//     return result;
// };

// const request = async requestBody => {
//     if (requestBody) {
//         return postRequestHandler({
//             requestParams: { url: '/api/dhis2ouimporter/', body: requestBody },
//             errorKeyMessage: 'dhisouimporterError',
//             consoleError: 'DHIS OU Importer',
//         });
//     }
//     return null;
// };
export const useDhisOuImporterRequest = requestBody => {
    const callback = useCallback(
        async () => sendDhisOuImporterRequest(requestBody),
        [requestBody, sendDhisOuImporterRequest],
    );
    return useAPI(callback)?.data;
};
