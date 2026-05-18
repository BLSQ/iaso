import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import MESSAGES from '../messages';

type Props = { params: Record<string, string> };
const baseUrl = baseUrls.validationWorkflowsConfiguration;
export const Filters: FunctionComponent<Props> = ({ params }) => {
    const { filters, filtersUpdated, handleChange, handleSearch } =
        useFilterState({ baseUrl, params, withPagination: true });
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={3} md={3}>
                <InputComponent
                    keyValue="name"
                    onChange={handleChange}
                    value={filters.name}
                    type="search"
                    label={MESSAGES.search}
                    onEnterPressed={handleSearch}
                    clearable
                />
            </Grid>
            <Grid item xs={12} sm={3} md={3}>
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

            <Grid
                item
                xs={12}
                sm={6}
                md={6}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                <SearchButton
                    disabled={!filtersUpdated}
                    onSearch={handleSearch}
                />
            </Grid>
        </Grid>
    );
};
