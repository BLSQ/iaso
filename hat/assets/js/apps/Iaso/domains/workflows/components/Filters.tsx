import React, { FunctionComponent, useState } from 'react';
import { Box, Grid, useTheme, useMediaQuery } from '@mui/material';

import { SearchButton } from 'Iaso/components/SearchButton';
import InputComponent from '../../../components/forms/InputComponent';

import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';

import { useGetStatus } from '../hooks/useGetStatus';

import MESSAGES from '../messages';
import { WorkflowsParams } from '../types';

type Props = {
    params: WorkflowsParams;
};

const baseUrl = baseUrls.workflows;

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const status = useGetStatus();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, saveSearchInHistory: false });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.search}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    type="select"
                    keyValue="status"
                    onChange={handleChange}
                    value={filters.status}
                    label={MESSAGES.status}
                    options={status}
                />
            </Grid>
            <Grid container item xs={12} md={6} justifyContent="flex-end">
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="start"
                    mt={isLargeLayout ? 2 : 0}
                >
                    <SearchButton
                        disabled={textSearchError || !filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
