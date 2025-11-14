import React, { FunctionComponent, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { SearchButton } from 'Iaso/components/SearchButton';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';
import MESSAGES from '../messages';
import { TeamParams } from '../types/team';

type Props = {
    params: TeamParams;
};

const baseUrl = baseUrls.teams;
export const TeamFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

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
                    <UserAsyncSelect
                        keyValue="managers"
                        handleChange={handleChange}
                        filterUsers={filters.managers}
                        label={MESSAGES.manager}
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
                    <SearchButton
                        disabled={textSearchError || !filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
