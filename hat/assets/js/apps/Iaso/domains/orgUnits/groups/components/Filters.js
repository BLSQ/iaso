import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { Grid, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../../components/forms/InputComponent';
import { redirectTo } from '../../../../routing/actions';

import { baseUrl } from '../config';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Filters = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [textSearchError, setTextSearchError] = useState(false);
    const classes = useStyles();

    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        search: params.search,
    });

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [filtersUpdated, dispatch, filters, params]);

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
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        blockForbiddenChars
                        onErrorChange={setTextSearchError}
                    />
                </Grid>

                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={9}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
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
                </Grid>
            </Grid>
        </>
    );
};

Filters.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Filters;
