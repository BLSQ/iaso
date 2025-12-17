import React, {
    useCallback,
    useMemo,
    useState,
    FunctionComponent,
} from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Grid, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import InputComponent from 'Iaso/components/forms/InputComponent';
import {
    commonStyles,
    useRedirectTo,
    useSafeIntl,
    InputWithInfos
} from 'bluesquare-components';
import { stringToBoolean } from '../../../utils/dataManipulation';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { useGetTeamsDropdown } from '../../teams/hooks/requests/useGetTeams';
import { useGetUserRolesDropDown } from '../../userRoles/hooks/requests/useGetUserRoles';
import { useGetPermissionsDropDown } from '../hooks/useGetPermissionsDropdown';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    baseUrl?: string;
    params: Record<string, any>;
    canBypassProjectRestrictions?: boolean;
};

const Filters: FunctionComponent<Props> = ({
    baseUrl = '',
    params,
    canBypassProjectRestrictions = false,
}) => {
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
        useGetProjectsDropdownOptions(true, canBypassProjectRestrictions);
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
            const tempParams: any = {
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
            let updatedFilters = {
                ...filters,
                [key]: value,
            };
            if (key === 'location') {
                setInitialOrgUnitId(value);
                // Reset checkboxes when the `location` field is cleared.
                if (!value) {
                    setOuParent(false);
                    setOuChildren(false);
                    updatedFilters.ouParent = false;
                    updatedFilters.ouChildren = false;
                }
            }
            setFilters(updatedFilters);
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
                <InputWithInfos infos={formatMessage(MESSAGES.searchParams)}>
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
                </InputWithInfos>
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
                    disabled={!initialOrgUnitId || !initialOrgUnit}
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
                    disabled={!initialOrgUnitId || !initialOrgUnit}
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

export default Filters;
