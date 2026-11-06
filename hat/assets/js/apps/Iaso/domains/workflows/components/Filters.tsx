import React, { FunctionComponent, useState } from 'react';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid/Grid';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/system/useMediaQuery/useMediaQuery';

import { SearchButton } from 'Iaso/components/SearchButton';

import { baseUrls } from 'Iaso/constants/urls';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import InputComponent from '../../../components/forms/InputComponent';

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
