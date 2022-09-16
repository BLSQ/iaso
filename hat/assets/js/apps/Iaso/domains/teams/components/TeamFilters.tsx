import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
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
    return (
        <>
            <Grid container spacing={0}>
                <Grid container item xs={10} lg={11} spacing={2}>
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
                </Grid>
                <Grid
                    container
                    item
                    xs={2}
                    lg={1}
                    justifyContent="flex-end"
                    spacing={0}
                >
                    <Box mt={2} mr={-2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
