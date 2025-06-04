import { Box, Grid } from '@mui/material';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { TeamParams } from '../types/team';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import { getUsersDropDown } from '../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../instances/hooks/useGetProfilesDropdown';
import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';

type Props = {
    params: TeamParams;
};

const baseUrl = baseUrls.teams;
export const TeamFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { data: selectedManagers } = useGetProfilesDropdown(filters.managers);
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const handleChangeManagers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3} lg={3}>
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
            <Grid item xs={12} md={3} lg={3}>
                <InputComponent
                    type="select"
                    keyValue="types"
                    onChange={handleChange}
                    value={filters.types}
                    label={MESSAGES.type}
                    multi
                    options={[
                        {
                            label: formatMessage(MESSAGES.teamsOfTeams),
                            value: TEAM_OF_TEAMS,
                        },
                        {
                            label: formatMessage(MESSAGES.teamsOfUsers),
                            value: TEAM_OF_USERS,
                        },
                    ]}
                />
                <InputComponent
                    keyValue="projects"
                    onChange={handleChange}
                    value={filters.projects}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.project}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearch}
                    clearable
                    multi
                />
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
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
