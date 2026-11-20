import { useState } from 'react';
import { IntlMessage } from 'bluesquare-components';
import { useMutation, useQueryClient } from 'react-query';
import { getRequest, iasoFetch, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { openSnackBar } from '../../components/snackBars/EventDispatcher';
import snackBarMessages from '../../components/snackBars/messages';
import { errorSnackBar } from '../../constants/snackBars';
import { FormState, getValues } from '../../hooks/form';
import { DropdownOptions } from '../../types/utils';
import { useCurrentUser } from '../../utils/usersUtils';
import { DataSource as OrgUnitDataSource } from '../orgUnits/types/dataSources';
import {
    OrgunitType,
    PaginatedOrgUnitTypes,
} from '../orgUnits/types/orgunitTypes';
import MESSAGES from './messages';
import { Version } from './types/dataSources';
import { Dhis2OuImporterRequest } from './types/dhis2OuImporter';

type SourceVersionListItem = Pick<
    Version,
    'id' | 'data_source' | 'data_source_name' | 'is_default' | 'number'
>;

type SourceVersionsList = {
    versions: SourceVersionListItem[];
};

type SourceVersionRow = Omit<SourceVersionListItem, 'id'> & {
    id: string;
};

type DataSourceListItem = Pick<
    OrgUnitDataSource,
    'id' | 'name' | 'credentials'
>;

type DataSourceList = {
    sources: DataSourceListItem[];
};

type QueryParamValue = string | number | boolean | null | undefined;

/** Query string for the DHIS2 diff/export. Extra keys are forwarded as-is. */
type DiffExportData = {
    ref_version_id?: QueryParamValue;
    source_version_id?: QueryParamValue;
    source_status?: QueryParamValue;
    ref_status?: QueryParamValue;
    source_top_org_unit_id?: QueryParamValue;
    ref_top_org_unit_id?: QueryParamValue;
    source_org_unit_group_id?: QueryParamValue;
    ref_org_unit_group_id?: QueryParamValue;
    source_org_unit_type_ids?: Array<string | number>;
    ref_org_unit_type_ids?: Array<string | number>;
    fields_to_export?: string[];
    [key: string]: QueryParamValue | Array<string | number> | undefined;
};

type ImportGpkgRequest = {
    file: Blob;
    data_source?: string | number;
    version_number?: string;
    description?: string;
    default_valid?: boolean;
    project?: string | number | null;
};

type DataSourceSavePayload = {
    id?: number;
    [key: string]: unknown;
};

type Dhis2CredentialCheckForm = {
    id: { value: number };
    credentials: {
        value: {
            dhis_url?: string;
            dhis_login?: string;
            dhis_password?: string;
        };
    };
};

type CopyVersionRequest = {
    dataSourceId: number;
    dataSourceVersionNumber: number;
    destinationSourceId: number | string;
    destinationVersionNumber: number | string;
};

type CreateSourceVersionRequest = {
    dataSourceId: number;
    description: string | null;
};

type UpdateSourceVersionRequest = {
    sourceVersionId: number;
    description: string | null;
    dataSourceId: number;
    sourceVersionNumber: number;
};

type SetFieldErrors = (errorKey: string, errorMessages: unknown) => void;

export const sendDhisOuImporterRequest = (
    requestBody: Dhis2OuImporterRequest,
) => postRequest('/api/dhis2ouimporter/', requestBody);

export const postGeoPkg = async ({ file, ...body }: ImportGpkgRequest) =>
    postRequest('/api/tasks/create/importgpkg/', body, { file });

const getOrgUnitTypes = async () => {
    return getRequest('/api/v2/orgunittypes/');
};

export const useOrgUnitTypes = () => {
    return useSnackQuery(['orgUnitTypes'], getOrgUnitTypes, undefined, {
        select: (data: PaginatedOrgUnitTypes): DropdownOptions<number>[] =>
            data.orgUnitTypes.map((orgUnitType: OrgunitType) => ({
                value: orgUnitType.id,
                label: orgUnitType.name,
            })),
    });
};

const getDataSourceVersions = async () => {
    return getRequest('/api/sourceversions/');
};

// Func to compare version to  order them
// string.localeCompare allow us to have case-insensitive sorting and to take accents into account
const compareVersions = (a: SourceVersionRow, b: SourceVersionRow) => {
    const comparison = a.data_source_name.localeCompare(
        b.data_source_name,
        undefined,
        {
            sensitivity: 'accent',
        },
    );
    if (comparison === 0) {
        if (a.number < b.number) {
            return -1;
        } else if (a.number > b.number) {
            return 1;
        } else {
            return 0;
        }
    }
    return comparison;
};

export const useDataSourceVersions = (enabled = true) => {
    return useSnackQuery({
        queryKey: ['dataSourceVersions'],
        queryFn: getDataSourceVersions,
        options: {
            enabled,
            select: (data: SourceVersionsList): SourceVersionRow[] => {
                return data.versions
                    .map((version: SourceVersionListItem) => {
                        return {
                            id: version.id.toString(),
                            data_source: version.data_source,
                            data_source_name: version.data_source_name,
                            is_default: version.is_default,
                            number: version.number,
                        };
                    })
                    .sort(compareVersions);
            },
        },
    });
};

export const useDataSourcesDropDown = () => {
    return useSnackQuery(
        ['sourcesDropdown'],
        () => getRequest('/api/datasources/dropdown/?order=name'),
        undefined,
        {
            staleTime: 60000,
        },
    );
};

export const useSourceVersionDropDown = () => {
    return useSnackQuery(
        ['sourceVersionsDropdown'],
        () => getRequest('/api/sourceversions/dropdown/'),
        undefined,
        {
            staleTime: 60000,
        },
    );
};
const adaptForApi = (data: DiffExportData): DiffExportData => {
    const adaptedData = { ...data };
    if (data.ref_status === 'all') {
        adaptedData.ref_status = '';
    }
    if (data.source_status === 'all') {
        adaptedData.source_status = '';
    }
    return adaptedData;
};

export const postToDHIS2 = async (data: DiffExportData) => {
    const adaptedData = adaptForApi(data);
    return postRequest('/api/sourceversions/export_dhis2/', adaptedData);
};

export const convertExportDataToURL = (data: DiffExportData) => {
    const up = new URLSearchParams();

    Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            v.forEach(p => up.append(k, String(p)));
        } else if (v !== undefined && v !== null) {
            up.append(k, String(v));
        }
    });

    return `/api/sourceversions/diff.csv/?${up.toString()}`;
};

export const csvPreview = async (data: DiffExportData) => {
    const adaptedData = adaptForApi(data);
    const url = convertExportDataToURL(adaptedData);
    const requestSettings = {
        method: 'GET',
        headers: { 'Sec-fetch-Dest': 'document', 'Content-Type': 'text/csv' },
    };
    // using iasoFetch, so I can convert response to text i.o. json
    return iasoFetch(url, requestSettings)
        .then(result => result.text())
        .catch((error: unknown) => {
            openSnackBar(
                errorSnackBar(
                    'iaso.snackBar.generateCSVError',
                    snackBarMessages.generateCSVError,
                    error,
                ),
            );
            console.error(`Error while fetching CSV:`, error);
        });
};

export const updateDefaultDataSource = ([accountId, defaultVersionId]: [
    number,
    number,
]) =>
    putRequest(`/api/accounts/${accountId}/set-default-version/`, {
        default_version: defaultVersionId,
    });

/**
 * Save DataSource on server
 * If the data source is marked as default this necessitates a separate request to
 * save and then we refetch the user since it's updated
 * Mark errors in form.
 * @param {func} setFieldErrors
 */
export const useSaveDataSource = (setFieldErrors: SetFieldErrors) => {
    const [isSaving, setIsSaving] = useState(false);
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();

    const { mutateAsync: saveMutation } = useSnackMutation<
        unknown,
        unknown,
        DataSourceSavePayload
    >(
        (campaignData: DataSourceSavePayload) =>
            putRequest(`/api/datasources/${campaignData.id}/`, campaignData),
        undefined,
        snackBarMessages.updateDataSourceError,
    );
    const { mutateAsync: createMutation } = useSnackMutation<
        unknown,
        unknown,
        DataSourceSavePayload
    >(
        (campaignData: DataSourceSavePayload) =>
            postRequest('/api/datasources/', campaignData),
        undefined,
        snackBarMessages.createDataSourceError,
    );
    const saveDefaultDataSourceMutation = useSnackMutation<
        unknown,
        unknown,
        [number, number]
    >(
        updateDefaultDataSource,
        // false suppresses the success snack bar; the hook types this argument as a message
        false as unknown as IntlMessage,
        snackBarMessages.updateDefaultSourceError,
    );

    const saveDataSource = async (form: FormState) => {
        setIsSaving(true);

        const { is_default_source, ...campaignData } = getValues(form);
        // UI-only confirmation field, not part of the data source payload
        delete campaignData.confirm_default_version_change;

        try {
            if (campaignData.id) {
                await saveMutation(campaignData);
            } else {
                await createMutation(campaignData);
            }
            queryClient.invalidateQueries('sources');
        } catch (error: unknown) {
            // Update error on forms
            if (
                typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                error.status === 400 &&
                'details' in error &&
                typeof error.details === 'object' &&
                error.details !== null
            ) {
                Object.entries(error.details).forEach(
                    ([errorKey, errorMessages]) => {
                        setFieldErrors(errorKey, errorMessages);
                    },
                );
            }
            setIsSaving(false);
        }

        if (is_default_source && form.default_version_id.value) {
            await saveDefaultDataSourceMutation.mutateAsync([
                currentUser.account!.id,
                form.default_version_id.value,
            ]);
            queryClient.invalidateQueries('currentUser');
        }
        setIsSaving(false);
    };
    return { saveDataSource, isSaving };
};

export const useCheckDhis2Mutation = (setFieldErrors: SetFieldErrors) =>
    useMutation(
        (form: Dhis2CredentialCheckForm) =>
            postRequest(`/api/datasources/check_dhis2/`, {
                data_source: form.id.value,
                dhis2_url: form.credentials.value.dhis_url,
                dhis2_login: form.credentials.value.dhis_login,
                dhis2_password: form.credentials.value.dhis_password,
            }),
        {
            onSuccess: () => {
                // Clean errors
                [
                    'credentials',
                    'credentials_dhis2_url',
                    'credentials_dhis2_login',
                    'credentials_dhis2_password',
                ].forEach(key => setFieldErrors(key, []));
            },
            onError: (error: unknown) => {
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'status' in error &&
                    error.status === 400 &&
                    'details' in error &&
                    typeof error.details === 'object' &&
                    error.details !== null
                ) {
                    Object.entries(error.details).forEach(
                        ([errorKey, errorMessages]) => {
                            setFieldErrors(
                                `credentials_${errorKey}`,
                                errorMessages,
                            );
                        },
                    );
                } else {
                    const detail =
                        typeof error === 'object' &&
                        error !== null &&
                        'details' in error &&
                        typeof error.details === 'object' &&
                        error.details !== null &&
                        'detail' in error.details &&
                        typeof error.details.detail === 'string'
                            ? error.details.detail
                            : 'Test failed';
                    setFieldErrors('credentials', [detail]);
                }
            },
        },
    );

export const useDataSourceForVersion = (
    sourceVersion?: Pick<SourceVersionListItem, 'data_source'> | null,
) =>
    useSnackQuery(
        ['dataSources'],
        () => getRequest('/api/datasources/'),
        snackBarMessages.fetchSourcesError,
        {
            select: (data: DataSourceList) => {
                if (sourceVersion) {
                    const source = data.sources.find(
                        (s: DataSourceListItem) =>
                            s.id === sourceVersion.data_source,
                    );
                    return source;
                }
                return null;
            },
            staleTime: 60000,
        },
    );
export const useDataSourceAsDropDown = () =>
    useSnackQuery(
        ['dataSources'],
        () => getRequest('/api/datasources/'),
        snackBarMessages.fetchSourcesError,
        {
            select: (
                data: DataSourceList | undefined,
            ): DropdownOptions<number>[] =>
                data?.sources.map((datasource: DataSourceListItem) => ({
                    label: datasource.name,
                    value: datasource.id,
                })) ?? [],
            staleTime: 60000,
        },
    );

export const useCopyDataSourceVersion = () => {
    return useSnackMutation<unknown, unknown, CopyVersionRequest>(
        ({
            dataSourceId,
            dataSourceVersionNumber,
            destinationSourceId,
            destinationVersionNumber,
        }: CopyVersionRequest) => {
            return postRequest('/api/copyversion/', {
                source_source_id: dataSourceId,
                source_version_number: dataSourceVersionNumber,
                destination_source_id: destinationSourceId,
                destination_version_number: destinationVersionNumber,
                force: false,
            });
        },
        MESSAGES.copyVersionSuccessMessage,
        MESSAGES.copyVersionSuccessMessage,
        'dataSources',
    );
};
const saveSourceVersion = (newSourceVersion: CreateSourceVersionRequest) => {
    const url = '/api/sourceversions/';
    return postRequest(url, {
        description: newSourceVersion.description,
        data_source_id: newSourceVersion.dataSourceId,
    });
};

export const useCreateSourceVersion = () => {
    return useSnackMutation<unknown, unknown, CreateSourceVersionRequest>({
        mutationFn: saveSourceVersion,
        snackErrorMsg: MESSAGES.newEmptyVersionError,
        snackSuccessMessage: MESSAGES.newEmptyVersionSavedSuccess,
        invalidateQueryKey: ['dataSourceVersions', 'sources'],
    });
};

const updateSourceVersion = async ({
    sourceVersionId,
    description,
    dataSourceId,
    sourceVersionNumber,
}: UpdateSourceVersionRequest) => {
    return putRequest(`/api/sourceversions/${sourceVersionId}/`, {
        id: sourceVersionId,
        description,
        data_source: dataSourceId,
        number: sourceVersionNumber,
    });
};

export const usePutSourceVersion = () => {
    return useSnackMutation<unknown, unknown, UpdateSourceVersionRequest>(
        ({
            sourceVersionId,
            description,
            dataSourceId,
            sourceVersionNumber,
        }: UpdateSourceVersionRequest) =>
            updateSourceVersion({
                sourceVersionId,
                description,
                dataSourceId,
                sourceVersionNumber,
            }),
        undefined,
        undefined,
        [['dataSourceVersions'], ['dataSources'], ['sources']],
    );
};
