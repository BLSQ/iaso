import { getRequest, postRequest, putRequest } from 'Iaso/libs/Api.ts';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { openSnackBar } from '../components/snackBars/EventDispatcher.ts';
import { errorSnackBar } from '../constants/snackBars';

export const fetchSubOrgUnitsByType = (params, orgUnitType) =>
    getRequest(`/api/orgunits/?${params}`)
        .then(res => ({
            ...orgUnitType,
            orgUnits: res.orgUnits,
        }))
        .catch(error => {
            openSnackBar(errorSnackBar('fetchOrgUnitsError', null, error));
            console.error('Error while fetching org unit list:', error);
        });

export const fetchOrgUnitsTypes = () =>
    getRequest('/api/v2/orgunittypes/')
        .then(res => res.orgUnitTypes)
        .catch(error => {
            openSnackBar(errorSnackBar('fetchOrgUnitTypesError', null, error));
            console.error('Error while fetching org unit types list:', error);
        });

export const fetchAssociatedOrgUnits = (
    source,
    orgUnit,
    fitToBounds = () => null,
) => {
    const url = `/api/orgunits/?linkedTo=${orgUnit.id}&linkValidated=all&linkSource=${source.id}&validation_status=all&withShapes=true`;

    return getRequest(url)
        .then(data => {
            fitToBounds();
            return {
                ...source,
                orgUnits: data.orgUnits,
            };
        })
        .catch(error => {
            openSnackBar(errorSnackBar('fetchOrgUnitsError', null, error));
            console.error('Error while fetching org unit list:', error);
        });
};

export const fetchOrgUnitDetail = orgUnitId =>
    getRequest(`/api/orgunits/${orgUnitId}/`)
        .then(orgUnit => orgUnit)
        .catch(error => {
            openSnackBar(errorSnackBar('fetchOrgUnitError', null, error));
            console.error('Error while fetching org unit detail:', error);
        });

export const fetchInstanceDetail = instanceId =>
    getRequest(`/api/instances/${instanceId}`)
        .then(instance => instance)
        .catch(error => {
            openSnackBar(errorSnackBar('fetchInstanceError', null, error));
            console.error('Error while fetching instance detail:', error);
        });

export const fetchLinkDetail = linkId =>
    getRequest(`/api/links/${linkId}`)
        .then(linkDetail => linkDetail)
        .catch(error => {
            openSnackBar(errorSnackBar('fetchLinkDetailError', null, error));
            console.error('Error while fetching link detail:', error);
        });

export const createForm = formData =>
    postRequest('/api/forms/', formData).catch(error => {
        openSnackBar(errorSnackBar('createFormError', null, error));
    });

export const updateForm = (formId, formData) =>
    putRequest(`/api/forms/${formId}/`, formData).catch(error => {
        openSnackBar(errorSnackBar('updateFormError', null, error));
    });

export const createFormVersion = formVersionData => {
    const { data } = formVersionData;
    const fileData = { xls_file: formVersionData.xls_file };

    return postRequest('/api/formversions/', data, fileData).catch(error => {
        openSnackBar(errorSnackBar('createFormVersionError', null, error));
    });
};

export const updateFormVersion = formVersion =>
    putRequest(`/api/formversions/${formVersion.id}/`, formVersion).catch(
        error => {
            openSnackBar(errorSnackBar('updateFormVersionError', null, error));
        },
    );

export const useGetComments = params => {
    const { orgUnitId, offset, limit } = params;
    const url = offset
        ? `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}&offset=${offset}`
        : `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}`;

    return useSnackQuery(
        ['comments', params],
        async () => getRequest(url),
        undefined,
        { enabled: Boolean(orgUnitId) },
    );
};

export const sendComment = async comment =>
    postRequest('/api/comments/', comment);

export const cleanupParams = params => {
    const copy = { ...params };
    Object.keys(params).forEach(key => {
        if (copy[key] === undefined) {
            delete copy[key];
        }
    });
    return copy;
};

export const formatParams = params => {
    const copy = cleanupParams(params);
    if (params.pageSize) {
        copy.limit = params.pageSize;
        delete copy.pageSize;
    }
    if (params.accountId) {
        delete copy.accountId;
    }
    return copy;
};
