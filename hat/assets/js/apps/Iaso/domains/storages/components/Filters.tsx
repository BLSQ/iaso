import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';

import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';

import { StorageParams } from '../types/storages';

import { useFilterState } from '../../../hooks/useFilterState';
import { useGetTypes } from '../hooks/useGetTypes';
import { useGetStatus } from '../hooks/useGetStatus';
import { useGetReasons } from '../hooks/useGetReasons';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

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
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={4}>
                    <InputComponent
                        type="select"
                        keyValue="type"
                        onChange={handleChange}
                        value={filters.type}
                        label={MESSAGES.type}
                        options={types}
                    />
                </Grid>
                <Grid item xs={4}>
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
