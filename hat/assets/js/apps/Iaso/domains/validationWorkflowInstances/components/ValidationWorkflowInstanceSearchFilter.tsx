import React, { useCallback, useMemo } from 'react';
import { FiltersPanel, useRedirectTo } from 'bluesquare-components';
import type {
    FilterFieldDescriptor,
    FilterFieldRenderContext,
    FilterValues,
} from 'bluesquare-components';
import { useApiValidationWorkflowsDropdownList } from 'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetMultipleOrgUnits } from 'Iaso/domains/orgUnits/components/TreeView/requests';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { useGetProjectsDropdownOptions } from 'Iaso/domains/projects/hooks/requests';
import { UseGetValidationWorkflowInstanceSearchProps } from 'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceSearch';
import { useGetValidationWorkflowInstanceStatuses } from 'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceStatuses';
import MESSAGES from 'Iaso/domains/validationWorkflowInstances/messages';

const baseUrl = baseUrls.validationWorkflowInstances;

const toUrlParam = (
    value?: string | (string | number)[],
): string | undefined => {
    if (Array.isArray(value)) {
        return value.length ? value.join(',') : undefined;
    }
    return value || undefined;
};

export const ValidationWorkflowInstanceSearchFilter = ({
    params,
}: {
    params: UseGetValidationWorkflowInstanceSearchProps['params'];
}) => {
    const redirectTo = useRedirectTo();
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const { data: workflows, isFetching: isFetchingWorkflows } =
        useApiValidationWorkflowsDropdownList();
    const statusOptions = useGetValidationWorkflowInstanceStatuses();
    // the org units are stored as ids in the url, the chips need their names
    const { data: selectedOrgUnits } = useGetMultipleOrgUnits(params.org_unit);

    const values: FilterValues = useMemo(
        () => ({
            validation_workflows: params.validation_workflows,
            status: params.status,
            forms: params.forms,
            projects: params.projects,
            org_unit: params.org_unit ? selectedOrgUnits : undefined,
        }),
        [params, selectedOrgUnits],
    );

    const handleApply = useCallback(
        (next: FilterValues) => {
            redirectTo(baseUrl, {
                ...params,
                page: '1',
                validation_workflows: toUrlParam(next.validation_workflows),
                status: next.status || undefined,
                forms: toUrlParam(next.forms),
                projects: toUrlParam(next.projects),
                org_unit: toUrlParam(
                    (next.org_unit as OrgUnit[] | undefined)?.map(
                        orgUnit => orgUnit.id,
                    ),
                ),
            });
        },
        [params, redirectTo],
    );

    const fields: FilterFieldDescriptor[] = useMemo(
        () => [
            {
                key: 'validation_workflows',
                label: MESSAGES.validationWorkflows,
                type: 'select',
                multi: true,
                clearable: true,
                options: workflows ?? [],
                loading: isFetchingWorkflows,
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
            {
                key: 'org_unit',
                label: MESSAGES.orgUnits,
                type: 'custom',
                isActive: (value?: OrgUnit[]) => Boolean(value?.length),
                formatValue: (value?: OrgUnit[]) =>
                    value?.map(orgUnit => orgUnit.name),
                renderCustom: ({
                    value,
                    onChange,
                }: FilterFieldRenderContext) => (
                    <OrgUnitTreeviewModal
                        titleMessage={MESSAGES.orgUnits}
                        onConfirm={(orgUnits?: OrgUnit[]) =>
                            onChange(orgUnits?.length ? orgUnits : undefined)
                        }
                        initialSelection={value}
                        multiselect
                    />
                ),
            },
            {
                key: 'status',
                label: MESSAGES.status,
                type: 'select',
                clearable: true,
                options: statusOptions,
            },
            {
                key: 'projects',
                label: MESSAGES.projects,
                type: 'select',
                multi: true,
                clearable: true,
                options: allProjects ?? [],
                loading: isFetchingProjects,
            },
        ],
        [
            workflows,
            isFetchingWorkflows,
            formsList,
            isFetchingForms,
            statusOptions,
            allProjects,
            isFetchingProjects,
        ],
    );

    return (
        <FiltersPanel fields={fields} values={values} onApply={handleApply} />
    );
};
