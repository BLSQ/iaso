import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { baseUrls } from '../../../constants/urls';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';

import { useFilterState } from '../../../hooks/useFilterState';

import { useGetTeams } from '../hooks/requests/useGetTeams';
import { useGetOrgUnitTypes } from '../hooks/requests/useGetOrgUnitTypes';

import { AssignmentParams } from '../types/assigment';
import MESSAGES from '../messages';

type Props = {
    params: AssignmentParams;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(baseUrl, params, false);
    // const { formatMessage } = useSafeIntl();
    // TODO: limit teams list to planning team or sub teams of it
    const { data: teamsDropdown, isFetching: isFetchingTeams } = useGetTeams();
    // TODO: limit ou types list
    const { data: orgunitTypesDropdown, isFetching: isFetchingOrgUnitTypes } =
        useGetOrgUnitTypes();
    return (
        <>
            <Grid container spacing={0}>
                <Grid container item xs={10} lg={11} spacing={2}>
                    <Grid item xs={3}>
                        <InputComponent
                            type="select"
                            keyValue="team"
                            onChange={handleChange}
                            value={filters.team}
                            label={MESSAGES.team}
                            options={teamsDropdown}
                            loading={isFetchingTeams}
                            disabled={isFetchingTeams}
                            clearable={false}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <InputComponent
                            type="select"
                            disabled={isFetchingOrgUnitTypes}
                            keyValue="orgunitType"
                            onChange={handleChange}
                            value={
                                isFetchingOrgUnitTypes
                                    ? undefined
                                    : filters.orgunitType
                            }
                            label={MESSAGES.baseOrgUnitsType}
                            options={orgunitTypesDropdown}
                            loading={isFetchingOrgUnitTypes}
                            clearable={false}
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={2} lg={1} justifyContent="flex-end">
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
