import { Box, Grid } from '@mui/material';
import React, { FunctionComponent, useCallback, useState } from 'react';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import MESSAGES from '../messages';
import { baseUrl } from '../config';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import { getUsersDropDown } from '../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../instances/hooks/useGetProfilesDropdown';
import { SearchButton } from '../../../components/SearchButton';

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
    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            handleChange(keyValue, newValue?.value);
        },
        [handleChange],
    );
    const { data: selectedUser } = useGetProfilesDropdown(filters.userId);

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
                    <AsyncSelect
                        clearable
                        keyValue="userId"
                        label={MESSAGES.users}
                        value={selectedUser ?? ''}
                        onChange={handleChangeUsers}
                        debounceTime={500}
                        fetchOptions={input => getUsersDropDown(input)}
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
