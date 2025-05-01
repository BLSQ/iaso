import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Grid, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import InputComponent from 'Iaso/components/forms/InputComponent.tsx';
import {
    commonStyles,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import { stringToBoolean } from '../../../utils/dataManipulation.ts';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal.tsx';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests.ts';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests.ts';
import { useGetTeamsDropdown } from '../../teams/hooks/requests/useGetTeams.ts';
import { useGetUserRolesDropDown } from '../../userRoles/hooks/requests/useGetUserRoles.ts';
import { useGetPermissionsDropDown } from '../hooks/useGetPermissionsDropdown.ts';
import MESSAGES from '../messages.ts';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Filters = ({ baseUrl, params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [textSearchError, setTextSearchError] = useState(false);
    const classes = useStyles();
    const [ouParent, setOuParent] = useState(stringToBoolean(params.ouParent));
    const [ouChildren, setOuChildren] = useState(
        stringToBoolean(params.ouChildren),
    );
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const [filters, setFilters] = useState({
        search: params.search,
        permissions: params.permissions,
        location: params.location,
        orgUnitTypes: params.orgUnitTypes,
        ouParent: params.ouParent,
        ouChildren: params.ouChildren,
        projectsIds: params.projectsIds,
        userRoles: params.userRoles,
        teamsIds: params.teamsIds,
    });

    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.location);
    const { data: dropdown, isFetching } = useGetPermissionsDropDown();
    const { data: userRoles, isFetching: isFetchingUserRoles } =
        useGetUserRolesDropDown({});
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);
    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropdown();

    const orgUnitTypeDropdown = useMemo(() => {
        if (!orgUnitTypes?.length) return orgUnitTypes;
        const options = [...orgUnitTypes];
        options.push({
            value: 'unassigned',
            label: formatMessage(MESSAGES.noTypeAssigned),
        });
        return options;
    }, [formatMessage, orgUnitTypes]);

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = 1;
            redirectTo(baseUrl, tempParams);
        }
    }, [baseUrl, filters, filtersUpdated, params, redirectTo]);

    const handleChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            if (key === 'location') {
                setInitialOrgUnitId(value);
            }
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );

    const handleSearchPerms = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = 1;
            redirectTo(baseUrl, tempParams);
        }
    }, [baseUrl, filters, filtersUpdated, params, redirectTo]);

    const handleSearchUserRoles = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = 1;
            redirectTo(baseUrl, tempParams);
        }
    }, [baseUrl, filters, filtersUpdated, params, redirectTo]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
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
                <InputComponent
                    keyValue="projectsIds"
                    onChange={handleChange}
                    value={filters.projectsIds}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.projects}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearchPerms}
                    clearable
                    multi
                />
                <InputComponent
                    keyValue="permissions"
                    onChange={handleChange}
                    value={filters.permissions}
                    type="select"
                    multi
                    options={dropdown ?? []}
                    label={MESSAGES.permissions}
                    loading={isFetching}
                    onEnterPressed={handleSearchPerms}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="userRoles"
                    onChange={handleChange}
                    value={filters.userRoles}
                    type="select"
                    multi
                    options={userRoles ?? []}
                    label={MESSAGES.userRoles}
                    loading={isFetchingUserRoles}
                    onEnterPressed={handleSearchUserRoles}
                />

                <InputComponent
                    keyValue="teamsIds"
                    onChange={handleChange}
                    value={filters.teamsIds}
                    type="select"
                    options={teamsDropdown}
                    label={MESSAGES.teams}
                    loading={isFetchingTeams}
                    onEnterPressed={handleSearchPerms}
                    clearable
                    multi
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="orgUnitTypes"
                    onChange={handleChange}
                    value={filters.orgUnitTypes}
                    type="select"
                    options={orgUnitTypeDropdown}
                    label={MESSAGES.orgUnitTypesDropdown}
                    loading={isFetchingOuTypes}
                    onEnterPressed={handleSearchPerms}
                    clearable
                />
                <InputComponent
                    keyValue="ouChildren"
                    type="checkbox"
                    checked={ouChildren}
                    onChange={(key, value) => {
                        handleChange('ouChildren', !ouChildren);
                        setOuChildren(value);
                    }}
                    disabled={!initialOrgUnit}
                    value={ouChildren}
                    label={MESSAGES.ouChildrenCheckbox}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <Box id="ou-tree-input" mb={isLargeLayout ? 0 : -2}>
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.location}
                        onConfirm={orgUnit =>
                            handleChange(
                                'location',
                                orgUnit ? orgUnit.id : undefined,
                            )
                        }
                        initialSelection={initialOrgUnit}
                    />
                </Box>
                <InputComponent
                    keyValue="ouParent"
                    type="checkbox"
                    checked={ouParent}
                    onChange={(key, value) => {
                        handleChange('ouParent', value);
                        setOuParent(value);
                    }}
                    disabled={!initialOrgUnit}
                    value={ouParent}
                    label={MESSAGES.ouParentCheckbox}
                />
            </Grid>
            <Grid container item xs={12} md={12} justifyContent="flex-end">
                <Box mt={2}>
                    <Button
                        data-test="search-button"
                        disabled={textSearchError || !filtersUpdated}
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
    );
};

Filters.defaultProps = {
    baseUrl: '',
};

Filters.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
};

export default Filters;
