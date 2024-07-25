import { Box, Grid } from '@mui/material';
import React, { FunctionComponent, useCallback, useState } from "react";
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { TeamParams } from '../types/team';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { AsyncSelect } from "../../../components/forms/AsyncSelect";
import { getUsersDropDown } from "../../instances/hooks/requests/getUsersDropDown";
import { useGetProfilesDropdown } from "../../instances/hooks/useGetProfilesDropdown";

type Props = {
    params: TeamParams;
};

const baseUrl = baseUrls.teams;
export const TeamFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { data: selectedManagers } = useGetProfilesDropdown(filters.managers);
    const handleChangeManagers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
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
            <Grid item xs={12} md={4} lg={3}>
                <Box mt={2}>
                    <AsyncSelect
                        keyValue="managers"
                        label={MESSAGES.manager}
                        value={selectedManagers ?? ''}
                        onChange={handleChangeManagers}
                        debounceTime={500}
                        multi
                        fetchOptions={input => getUsersDropDown(input)}
                    />
                </Box>
            </Grid>

            <Grid item xs={12} md={4} lg={6}>
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <FilterButton
                        disabled={textSearchError || !filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
