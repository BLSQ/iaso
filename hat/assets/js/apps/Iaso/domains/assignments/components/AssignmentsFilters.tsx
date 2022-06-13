import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { baseUrls } from '../../../constants/urls';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';

import { useFilterState } from '../../../hooks/useFilterState';

import { useGetOrgUnitTypes } from '../hooks/requests/useGetOrgUnitTypes';

import { AssignmentParams } from '../types/assigment';
import { DropdownTeamsOptions } from '../types/team';

import MESSAGES from '../messages';

type Props = {
    params: AssignmentParams;
    teams: Array<DropdownTeamsOptions>;
    isFetchingTeams: boolean;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsFilters: FunctionComponent<Props> = ({
    params,
    teams,
    isFetchingTeams,
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(baseUrl, params, false);
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
                            value={isFetchingTeams ? undefined : filters.team}
                            label={MESSAGES.team}
                            options={teams}
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
