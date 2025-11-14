import React, { FunctionComponent, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import InputComponent from '../../../components/forms/InputComponent';
import { SearchButton } from '../../../components/SearchButton';
import { useFilterState } from '../../../hooks/useFilterState';
import { baseUrl } from '../config';
import MESSAGES from '../messages';

type Params = {
    order: string;
    page: string;
    pageSize: string;
    search?: string;
};

type Props = { params: Params };

const Filters: FunctionComponent<Props> = ({ params }) => {
    const [, setTextSearchError] = useState(false);
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl,
            params,
        });

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.search}
                    onEnterPressed={handleSearch}
                    blockForbiddenChars
                    onErrorChange={setTextSearchError}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="needs_authentication"
                    label={MESSAGES.needsAuthentication}
                    type="select"
                    value={filters.needs_authentication}
                    onChange={handleChange}
                    options={[
                        { label: MESSAGES.yes, value: 'true' },
                        { label: MESSAGES.no, value: 'false' },
                    ]}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Box mt={2}>
                    <UserAsyncSelect
                        keyValue="userId"
                        label={MESSAGES.users}
                        filterUsers={filters.userId}
                        multi={false}
                        handleChange={handleChange}
                    />
                </Box>
            </Grid>
            <Grid container item xs={12} md={3} justifyContent="flex-end">
                <Box mt={2}>
                    <SearchButton
                        onSearch={handleSearch}
                        disabled={!filtersUpdated}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export default Filters;
