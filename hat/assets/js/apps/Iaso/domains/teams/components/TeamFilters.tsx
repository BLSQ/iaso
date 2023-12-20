import { Box, Grid } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { TeamParams } from '../types/team';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

type Props = {
    params: TeamParams;
};

const baseUrl = baseUrls.teams;
export const TeamFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    return (
        <>
            <Grid container spacing={0}>
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

                <Grid
                    container
                    item
                    xs={12}
                    sm={6}
                    md={9}
                    justifyContent="flex-end"
                    spacing={0}
                >
                    <Box mt={2} mb={2}>
                        <FilterButton
                            disabled={textSearchError || !filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
