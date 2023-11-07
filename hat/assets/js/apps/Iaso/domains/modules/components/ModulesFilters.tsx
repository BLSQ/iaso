import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent, useState } from 'react';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { ModuleParams } from '../types/modules';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

type Props = {
    params: ModuleParams;
};

const baseUrl = baseUrls.modules;
export const ModulesFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    return (
        <Grid container spacing={8} justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={9}>
                <Box mt={2} mb={2}>
                    <FilterButton
                        disabled={textSearchError || !filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
