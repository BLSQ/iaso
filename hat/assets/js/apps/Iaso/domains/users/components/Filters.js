import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import {
    Grid,
    Button,
    makeStyles,
    Box,
    useTheme,
    useMediaQuery,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from 'Iaso/components/forms/InputComponent';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';
import { useGetPermissionsDropDown } from '../hooks/useGetPermissionsDropdown.ts';
import { useGetOrgUnitTypes } from '../../orgUnits/hooks/requests/useGetOrgUnitTypes.ts';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { stringToBoolean } from '../../../utils/dataManipulation.ts';

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
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        search: params.search,
        permissions: params.permissions,
        location: params.location,
        orgUnitTypes: params.orgUnitTypes,
        ouParent: params.ouParent,
        ouChildren: params.ouParent,
    });
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.location);
    const { data: dropdown, isFetching } = useGetPermissionsDropDown();
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);
    const { data: orgUnitTypeDropdown, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypes();

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
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [baseUrl, dispatch, filters, filtersUpdated, params]);

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
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [baseUrl, dispatch, filters, filtersUpdated, params]);

    return (
        <>
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
                    <Box id="ou-tree-input" mb={isLargeLayout ? 0 : -2}>
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.location}
                            onConfirm={orgUnit =>
                                handleChange(
                                    'location',
                                    orgUnit ? [orgUnit.id] : undefined,
                                )
                            }
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={3}>
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
                <Grid container item xs={12} md={3} justifyContent="flex-end">
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
        </>
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
