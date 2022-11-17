import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { Grid, Button, makeStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from 'Iaso/components/forms/InputComponent';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';
import { useGetPermissionsDropDown } from '../hooks/useGetPermissionsDropdown.ts';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Filters = ({ baseUrl, params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        search: params.search,
    });
    const { data: dropdown, isFetching } = useGetPermissionsDropDown();

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
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );

    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="permissions"
                        onChange={handleChange}
                        value={filters.permissions}
                        type="select"
                        multi
                        options={dropdown ?? []}
                        label={MESSAGES.permissions}
                        loading={isFetching}
                    />
                </Grid>
            </Grid>
            <Grid
                container
                spacing={4}
                justifyContent="flex-end"
                alignItems="center"
            >
                <Grid
                    item
                    xs={2}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Button
                        data-test="search-button"
                        disabled={!filtersUpdated}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.search)}
                    </Button>
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
