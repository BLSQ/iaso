import React, { FunctionComponent, useState } from 'react';
import { Box, Grid, useTheme, useMediaQuery } from '@mui/material';

import { SearchButton } from 'Iaso/components/SearchButton';
import InputComponent from '../../../components/forms/InputComponent';

import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';

import { useGetReasons } from '../hooks/useGetReasons';
import { useGetStatus } from '../hooks/useGetStatus';
import { useGetTypes } from '../hooks/useGetTypes';

import MESSAGES from '../messages';
import { StorageParams } from '../types/storages';

type Props = {
    params: StorageParams;
};

const baseUrl = baseUrls.storages;
export const Filters: FunctionComponent<Props> = ({ params }) => {
    const types = useGetTypes();
    const status = useGetStatus();
    const reasons = useGetReasons();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
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
                    multi
                    keyValue="type"
                    onChange={handleChange}
                    value={filters.type}
                    label={MESSAGES.type}
                    options={types}
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
                {filters.status === 'BLACKLISTED' && (
                    <InputComponent
                        type="select"
                        keyValue="reason"
                        onChange={handleChange}
                        value={filters.reason}
                        label={MESSAGES.reason}
                        options={reasons}
                    />
                )}
            </Grid>

            <Grid container item xs={12} md={3} justifyContent="flex-end">
                <Box mt={isLargeLayout ? 2 : 0}>
                    <SearchButton
                        disabled={textSearchError || !filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
