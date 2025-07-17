import React, { useState, FunctionComponent, useCallback } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import { Grid, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';

import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetPlanningsOptions } from '../../plannings/hooks/requests/useGetPlannings';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { baseUrl } from '../config';
import { Params } from '../index';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, withPagination: false });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const [showDeleted, setShowDeleted] = useState<boolean>(
        filters.showDeleted === 'true',
    );
    const [showInstancesCount, setShowInstancesCount] = useState<boolean>(
        filters.showInstancesCount === 'true',
    );
    const handleShowDeleted = useCallback(
        (key, value) => {
            // converting false to undefined to be able to compute `filtersUpdated` correctly
            const valueForParam = value || undefined;
            handleChange(key, valueForParam);
            setShowDeleted(value);
        },
        [handleChange],
    );
    const handleShowInstancesCount = useCallback(
        (key, value) => {
            const valueForParam = value || undefined;
            handleChange(key, valueForParam);
            setShowInstancesCount(value);
        },
        [handleChange],
    );
    const { data: planningsDropdownOptions } = useGetPlanningsOptions();
    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <Grid container>
            <Grid container item xs={12} spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        blockForbiddenChars
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="projectsIds"
                        onChange={handleChange}
                        value={filters.projectsIds}
                        type="select"
                        options={allProjects}
                        label={MESSAGES.projects}
                        loading={isFetchingProjects}
                        onEnterPressed={handleSearch}
                        clearable
                        multi
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        onChange={handleChange}
                        keyValue="orgUnitTypeIds"
                        multi
                        label={MESSAGES.orgUnitsTypes}
                        value={filters.orgUnitTypeIds}
                        loading={isFetchingOuTypes}
                        options={orgUnitTypes ?? []}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        keyValue="planning"
                        onChange={handleChange}
                        value={filters.planning}
                        label={MESSAGES.planning}
                        options={planningsDropdownOptions}
                    />
                </Grid>
            </Grid>
            <Grid container item xs={12} spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={handleShowDeleted}
                        value={showDeleted}
                        type="checkbox"
                        label={MESSAGES.showDeleted}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="showInstancesCount"
                        onChange={handleShowInstancesCount}
                        value={showInstancesCount}
                        type="checkbox"
                        label={MESSAGES.showInstancesCount}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box
                        mt={isLargeLayout ? 3 : 0}
                        display="flex"
                        justifyContent="flex-end"
                    >
                        <Button
                            data-test="search-button"
                            disabled={
                                (!showDeleted && !filtersUpdated) ||
                                textSearchError
                            }
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => handleSearch()}
                        >
                            <SearchIcon className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.search)}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { Filters };
