import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent, useState } from 'react';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { UserRoleParams } from '../types/userRoles';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

type Props = {
    params: UserRoleParams;
};

const baseUrl = baseUrls.userRoles;
export const UserRolesFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    return (
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
    );
};
