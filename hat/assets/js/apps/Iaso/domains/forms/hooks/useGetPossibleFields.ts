import { cloneDeep } from 'lodash';
import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { DropdownOptions } from '../../../types/utils';
import {
    useGetForm,
    useGetForms,
} from '../../entities/entityTypes/hooks/requests/forms';

import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

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

export const useGetAllPossibleFields = (): AllResults => {
    const { data: allForms, isFetching: isFetchingForms } = useGetForms(true, [
        'form_id',
        'possible_fields',
    ]);
    return useAllPossibleFields(isFetchingForms, allForms);
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
