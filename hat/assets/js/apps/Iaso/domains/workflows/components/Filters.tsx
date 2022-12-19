import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';

import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';

import { WorkflowsParams } from '../types/workflows';

import { useFilterState } from '../../../hooks/useFilterState';
import { useGetStatus } from '../hooks/useGetStatus';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

type Props = {
    params: WorkflowsParams;
};

const baseUrl = baseUrls.workflows;

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const status = useGetStatus();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        type="select"
                        keyValue="status"
                        onChange={handleChange}
                        value={filters.status}
                        label={MESSAGES.status}
                        options={status}
                    />
                </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={2}>
                <FilterButton
                    disabled={!filtersUpdated}
                    onFilter={handleSearch}
                />
            </Box>
        </>
    );
};
