import React from 'react';
import { Grid } from '@mui/material';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SearchButton } from 'Iaso/components/SearchButton';
import { ValidationWorkflowDropdown } from 'Iaso/components/validationWorkflows/ValidationWorkflowDropdown';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useGetValidationWorkflowInstanceStatuses } from 'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceStatuses';
import MESSAGES from 'Iaso/domains/validationWorkflowInstances/messages';
import { useFilterState } from 'Iaso/hooks/useFilterState';

const baseUrl = baseUrls.validationWorkflowInstances;

export const ValidationWorkflowInstanceSearchFilterForm = ({ params }) => {
    const { filters, filtersUpdated, handleChange, handleSearch } =
        useFilterState({ baseUrl, params, withPagination: true });
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();
    const statusOptions = useGetValidationWorkflowInstanceStatuses();

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <ValidationWorkflowDropdown
                        keyValue={'validation_workflows'}
                        label={MESSAGES.validationWorkflows}
                        onChange={handleChange}
                        value={filters.validation_workflows}
                        clearable
                        multi
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        type={'select'}
                        keyValue={'status'}
                        label={MESSAGES.status}
                        options={Object.entries(statusOptions)?.map(
                            ([value, label]) => {
                                return { value, label };
                            },
                        )}
                        onChange={handleChange}
                        value={filters.status}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="forms"
                        onChange={handleChange}
                        value={filters.forms}
                        type="select"
                        options={formsList}
                        label={MESSAGES.forms}
                        loading={isFetchingForms}
                        onEnterPressed={handleSearch}
                        clearable
                        multi
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        type={'checkbox'}
                        checked={
                            filters.requires_user_action === true ||
                            filters.requires_user_action === 'true'
                        }
                        value={
                            filters.requires_user_action === true ||
                            filters.requires_user_action === 'true'
                        }
                        keyValue={'requires_user_action'}
                        label={MESSAGES.requiresUserAction}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid
                    item
                    xs={12}
                    justifyContent={'flex-end'}
                    display={'flex'}
                    spacing={2}
                >
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Grid>
            </Grid>
        </>
    );
};
