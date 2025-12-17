import { useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { UseQueryResult } from 'react-query';
import { FormState } from 'Iaso/domains/entities/components/EntitiesQuerybuilder/utils';
import { getRequest } from '../../../libs/Api';
import { useSnackQueries, useSnackQuery } from '../../../libs/apiHooks';
import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';
import { useGetForm } from '../requests';
import { Form, PossibleField } from '../types/forms';

type Result = {
    possibleFields: PossibleField[];
    isFetchingForm: boolean;
};
export type PossibleFieldsForForm = {
    form_id: string;
    name: string;
    possibleFields: PossibleField[];
};
type AllResults = {
    allPossibleFields: PossibleFieldsForForm[];
    isFetchingForms: boolean;
};

export const usePossibleFields = (
    isFetchingForm: boolean,
    form?: Form,
    possible_fields_key = 'possible_fields',
): Result => {
    return useMemo(() => {
        const possibleFields =
            form?.[possible_fields_key]?.map(field => ({
                ...field,
                fieldKey: field.name.replace('.', ''),
            })) || [];
        return {
            possibleFields,
            isFetchingForm,
        };
    }, [form, isFetchingForm, possible_fields_key]);
};

export const useGetPossibleFields = (
    formId?: number,
    appId?: string,
): Result => {
    const { data: currentForm, isFetching: isFetchingForm } = useGetForm(
        formId,
        Boolean(formId),
        'possible_fields',
        appId,
    );
    return usePossibleFields(isFetchingForm, currentForm);
};

type DynamicPossibleFieldsResult = {
    possibleFieldsMap: Map<number, PossibleField[]>;
    isFetching: boolean;
    isError: boolean;
};

export const useDynamicPossibleFields = (
    formStates: FormState[],
): DynamicPossibleFieldsResult => {
    // Extract unique form IDs that need possible fields
    const formIds = useMemo(() => {
        const uniqueIds = new Set<number>();
        formStates?.forEach(state => {
            if (state.form?.id) {
                uniqueIds.add(state.form.id);
            }
        });
        return Array.from(uniqueIds);
    }, [formStates]);

    // Build dynamic queries array for possible fields
    const queries = useMemo(() => {
        return formIds.map(formId => ({
            queryKey: ['forms', formId, 'possible_fields'],
            queryFn: () =>
                getRequest(`/api/forms/${formId}/?fields=possible_fields`),
            snackErrorMsg: MESSAGES.fetchPossibleFieldsError,
            options: {
                enabled: Boolean(formId),
                select: (data: any) => {
                    // Transform possible fields to match the expected format
                    return (
                        data?.possible_fields?.map((field: any) => ({
                            ...field,
                            fieldKey: field.name.replace('.', ''),
                        })) || []
                    );
                },
                staleTime: 60000,
                cacheTime: 1000 * 60 * 5,
            },
        }));
    }, [formIds]);

    // Use useSnackQueries for batch execution
    const results = useSnackQueries<PossibleField[]>(queries as any);

    // Transform results into a map for easy access
    const possibleFieldsMap = useMemo(() => {
        const map = new Map<number, PossibleField[]>();
        results.forEach((result, index) => {
            if (result.data && formIds[index]) {
                map.set(
                    formIds[index],
                    result.data as unknown as PossibleField[],
                );
            }
        });
        return map;
    }, [results, formIds]);

    const loadingStates = useMemo(
        () => ({
            isFetching: results.some(result => result.isFetching),
            isError: results.some(result => result.isError),
        }),
        [results],
    );

    return {
        possibleFieldsMap,
        ...loadingStates,
    };
};
export const useAllPossibleFields = (
    isFetchingForms: boolean,
    allForms: Form[] = [],
): AllResults => {
    return useMemo(() => {
        const allPossibleFields: PossibleFieldsForForm[] = [];
        allForms.forEach(form => {
            const possibleFields =
                form?.possible_fields?.map(field => ({
                    ...field,
                    fieldKey: field.name.replace('.', ''),
                })) || [];
            allPossibleFields.push({
                form_id: form.form_id,
                name: form.name,
                possibleFields,
            });
        });

        return {
            allPossibleFields,
            isFetchingForms,
        };
    }, [isFetchingForms, allForms]);
};

type PossibleFieldsDropdown = {
    isFetching: boolean;
    dropdown: DropdownOptions<string>[];
};

export const usePossibleFieldsDropdown = (
    isFetchingForm: boolean,
    form?: Form,
): PossibleFieldsDropdown => {
    const { possibleFields } = usePossibleFields(isFetchingForm, form);

    return useMemo(() => {
        return {
            isFetching: isFetchingForm,
            dropdown: possibleFields.map(field => {
                return { label: field.label, value: field.fieldKey };
            }),
        };
    }, [isFetchingForm, possibleFields]);
};

export type FormVersion = {
    version_id: string;
    possible_fields: PossibleField[];
    created_at: number;
};
type FormVersionsApiResult = {
    form_versions: FormVersion[];
};
type FormVersionHookResult = {
    formVersions?: FormVersion[];
    isFetchingForm: boolean;
};

const useGetFormVersion = (
    formId: number | undefined,
    enabled: boolean,
    fields?: string | undefined,
): UseQueryResult<FormVersionsApiResult, Error> => {
    const queryKey: any[] = ['formVersions', formId];
    let url = `/api/formversions/?form_id=${formId}`;
    if (fields) {
        url += `&fields=${fields}`;
    }
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            enabled,
        },
    });
};

const useVersionPossibleFields = (
    isFetchingForm: boolean,
    formVersions?: FormVersionsApiResult,
): FormVersionHookResult => {
    return useMemo(() => {
        const newFormVersions: FormVersion[] | undefined = cloneDeep(
            formVersions?.form_versions,
        );
        formVersions?.form_versions.forEach((version, index) => {
            if (newFormVersions) {
                newFormVersions[index].possible_fields =
                    version.possible_fields?.map(field => ({
                        ...field,
                        fieldKey: field.name.replace('.', ''),
                    })) || [];
            }
        });
        return {
            formVersions: newFormVersions,
            isFetchingForm,
        };
    }, [formVersions, isFetchingForm]);
};

export const useGetPossibleFieldsByFormVersion = (
    formId?: number,
): FormVersionHookResult => {
    const { data: currentFormVersion, isFetching: isFetchingForm } =
        useGetFormVersion(
            formId,
            Boolean(formId),
            'version_id,possible_fields,created_at',
        );
    return useVersionPossibleFields(isFetchingForm, currentFormVersion);
};
