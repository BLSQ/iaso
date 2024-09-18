import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFilterState } from '../../../../hooks/useFilterState';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { OrgUnitChangeRequestConfigsParams } from '../types';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import MESSAGES from '../messages';
import { FilterButton } from '../../../../components/FilterButton';

const baseUrl = baseUrls.orgUnitsChangeRequestConfiguration;
type Props = { params: OrgUnitChangeRequestConfigsParams };

export const OrgUnitChangeRequestConfigsFilter: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: orgUnitTypeOptions, isLoading: isLoadingTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    keyValue="project_id"
                    onChange={handleChange}
                    value={filters.projectId}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.project}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearch}
                    clearable
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="org_unit_type_id"
                    value={filters.org_unit_type_id}
                    onChange={handleChange}
                    loading={isLoadingTypes}
                    options={orgUnitTypeOptions}
                    labelString={formatMessage(MESSAGES.orgUnitType)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={1}>
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
