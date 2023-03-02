import { useMemo } from 'react';
import { DropdownOptions } from '../../../types/utils';
import { useGetForm } from '../../entities/entityTypes/hooks/requests/forms';

import { Form, PossibleField } from '../types/forms';

type Result = {
    possibleFields: PossibleField[];
    isFetchingForm: boolean;
};

const usePossibleFields = (isFetchingForm: boolean, form?: Form): Result => {
    return useMemo(() => {
        const possibleFields =
            form?.possible_fields?.map(field => ({
                ...field,
                fieldKey: field.name.replace('.', ''),
            })) || [];
        return {
            possibleFields,
            isFetchingForm,
        };
    }, [form?.possible_fields, isFetchingForm]);
};

export const useGetPossibleFields = (formId?: number): Result => {
    const { data: currentForm, isFetching: isFetchingForm } = useGetForm(
        formId,
        Boolean(formId),
        'possible_fields',
    );
    return usePossibleFields(isFetchingForm, currentForm);
};
export const useGetPossibleFieldsForEntityTypes = ({
    formId,
    enabled = true,
}: {
    formId?: number;
    enabled?: boolean;
}): Result => {
    const { data: currentForm, isFetching: isFetchingForm } = useGetForm(
        formId,
        enabled && Boolean(formId),
        'possible_fields',
    );
    return usePossibleFields(isFetchingForm, currentForm);
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
