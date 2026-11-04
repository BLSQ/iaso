import React, { FunctionComponent, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { TeamTypeDropdown } from 'Iaso/domains/teams/components/TeamTypeDropdown';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import InputComponent from '../../../components/forms/InputComponent';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import MESSAGES from '../messages';
import { TeamUrlParams } from '../types/team';

type Props = {
    params: TeamUrlParams;
};

const baseUrl = baseUrls.teams;
export const TeamFilters: FunctionComponent<Props> = ({ params }) => {
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
                <TeamTypeDropdown
                    keyValue={'types'}
                    handleChange={handleChange}
                    value={filters.types}
                    multi
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
