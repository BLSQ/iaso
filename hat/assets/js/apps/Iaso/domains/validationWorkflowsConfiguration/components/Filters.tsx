import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { FiltersPanel, useRedirectTo } from 'bluesquare-components';
import type {
    FilterFieldDescriptor,
    FilterValues,
} from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import MESSAGES from '../messages';

type Props = { params: Record<string, string> };

const baseUrl = baseUrls.validationWorkflowsConfiguration;

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const redirectTo = useRedirectTo();
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();

    const values: FilterValues = useMemo(
        () => ({
            name: params.name,
            forms: params.forms,
        }),
        [params],
    );

    const handleApply = useCallback(
        (next: FilterValues) => {
            redirectTo(baseUrl, {
                ...params,
                page: '1',
                name: next.name || undefined,
                forms: next.forms || undefined,
            });
        },
        [params, redirectTo],
    );

    const fields: FilterFieldDescriptor[] = useMemo(
        () => [
            {
                key: 'name',
                label: MESSAGES.search,
                type: 'search',
            },
            {
                key: 'forms',
                label: MESSAGES.forms,
                type: 'select',
                multi: true,
                clearable: true,
                options: formsList ?? [],
                loading: isFetchingForms,
            },
        ],
        [formsList, isFetchingForms],
    );

    return (
        <FiltersPanel fields={fields} values={values} onApply={handleApply} />
    );
};
