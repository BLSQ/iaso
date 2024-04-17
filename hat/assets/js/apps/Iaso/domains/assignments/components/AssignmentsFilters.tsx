import { Grid, Button, Box } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';
import FiltersIcon from '@mui/icons-material/FilterList';
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { AssignmentParams } from '../types/assigment';
import { DropdownTeamsOptions } from '../types/team';
import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';

type Props = {
    params: AssignmentParams;
    teams: Array<DropdownTeamsOptions>;
    isFetchingTeams: boolean;
    orgunitTypes: Array<DropdownOptions<string>>;
    isFetchingOrgUnitTypes: boolean;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsFilters: FunctionComponent<Props> = ({
    params,
    teams,
    isFetchingTeams,
    orgunitTypes,
    isFetchingOrgUnitTypes,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl,
            params,
            withPagination: false,
            saveSearchInHistory: false,
        });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    return (
        <Grid container spacing={{ xs: 0, lg: 2 }}>
            <Grid item xs={12} lg={3}>
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
            <Grid item xs={12} lg={3}>
                <InputComponent
                    type="select"
                    disabled={isFetchingOrgUnitTypes}
                    keyValue="baseOrgunitType"
                    onChange={handleChange}
                    value={
                        isFetchingOrgUnitTypes
                            ? undefined
                            : filters.baseOrgunitType
                    }
                    label={MESSAGES.baseOrgUnitsType}
                    options={orgunitTypes}
                    loading={isFetchingOrgUnitTypes}
                    clearable={false}
                />
            </Grid>
            <Grid item xs={12} lg={3}>
                <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.searchOrgUnit}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                />
            </Grid>
            <Grid
                item
                xs={12}
                lg={3}
                justifyContent={{ xs: 'flex-end', lg: 'flex-start' }}
                container
                alignItems="center"
                mt={{ xs: 2, lg: 0 }}
            >
                <Button
                    disabled={textSearchError || !filtersUpdated}
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                >
                    <Box mr={1} top={3} position="relative">
                        <FiltersIcon />
                    </Box>
                    {formatMessage(MESSAGES.apply)}
                </Button>
            </Grid>
        </Grid>
    );
};
