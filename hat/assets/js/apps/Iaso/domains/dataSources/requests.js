import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { postRequestHandler } from '../../utils/requests';

export const sendDhisOuImporterRequest = async (requestBody, dispatch) => {
    if (requestBody)
        return postRequestHandler({
            url: '/api/dhis2ouimporter/',
            body: requestBody,
            errorKeyMessage: 'dhisouimporterError',
            consoleError: 'DHIS OU Importer',
            dispatch,
        });
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

export const useDhisOuImporterRequest = requestBody => {
    const dispatch = useDispatch();
    const [result, setResult] = useState(null);
    useEffect(() => {
        const executeRequest = async () => {
            const response = await sendDhisOuImporterRequest(
                requestBody,
                dispatch,
            );
            if (response) setResult(response);
        };
        // TODO add error handling
        executeRequest();
    }, [requestBody]);
    return result;
};
