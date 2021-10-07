import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { Grid, Button } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { redirectTo } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';

import MESSAGES from '../../constants/messages';
import { useStyles } from './Styles';
import { useGetCountries } from '../../hooks/useGetCountries';

const Filters = ({ params, baseUrl }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.country__id__in);
    const classes = useStyles();
    const dispatch = useDispatch();
    const handleSearch = () => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const newParams = {
                ...params,
                country__id__in: countries,
            };
            dispatch(redirectTo(baseUrl, newParams));
        }
    };
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const countriesList = (data && data.orgUnits) || [];
    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        loading={isFetchingCountries}
                        multi
                        clearable
                        keyValue="country__id__in"
                        onChange={(key, value) => {
                            setFiltersUpdated(true);
                            setCountries(value);
                        }}
                        value={countries}
                        type="select"
                        options={countriesList.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                        label={MESSAGES.country}
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
                        disabled={!filtersUpdated}
                        variant="contained"
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.search} />
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

export { Filters };
