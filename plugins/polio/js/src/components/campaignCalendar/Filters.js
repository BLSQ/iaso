import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { replace } from 'react-router-redux';

import { Grid, Button, Box } from '@material-ui/core';
import FiltersIcon from '@material-ui/icons/FilterList';
import { withRouter } from 'react-router';

import InputComponent from 'Iaso/components/forms/InputComponent';
import DatesRange from 'Iaso/components/filters/DatesRange';

import MESSAGES from '../../constants/messages';
import { useGetCountries } from '../../hooks/useGetCountries';

import { genUrl } from '../../utils/routing';

const Filters = ({ router, disableDates }) => {
    const { params } = router;
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [search, setSearch] = useState(params.search);
    const [r1StartFrom, setR1StartFrom] = useState(params.r1StartFrom);
    const [r1StartTo, set1StartTo] = useState(params.r1StartTo);
    const dispatch = useDispatch();
    const handleSearch = () => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const url = genUrl(router, {
                countries,
                search: search && search !== '' ? search : undefined,
                r1StartFrom,
                r1StartTo,
            });
            dispatch(replace(url));
        }
    };
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const countriesList = (data && data.orgUnits) || [];
    return (
        <>
            <Box display="inline-flex" width="85%">
                <Grid container spacing={4}>
                    <Grid item xs={3}>
                        <InputComponent
                            keyValue="search"
                            onChange={(key, value) => {
                                setFiltersUpdated(true);
                                setSearch(value);
                            }}
                            value={search}
                            type="search"
                            label={MESSAGES.search}
                            onEnterPressed={handleSearch}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <InputComponent
                            loading={isFetchingCountries}
                            keyValue="countries"
                            multi
                            clearable
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
                    {!disableDates && (
                        <Grid item xs={6}>
                            <DatesRange
                                onChangeDate={(key, value) => {
                                    if (key === 'dateFrom') {
                                        setR1StartFrom(value);
                                    }
                                    if (key === 'dateTo') {
                                        set1StartTo(value);
                                    }
                                    setFiltersUpdated(true);
                                }}
                                labelFrom={MESSAGES.R1StartFrom}
                                labelTo={MESSAGES.R1StartTo}
                                dateFrom={r1StartFrom}
                                dateTo={r1StartTo}
                            />
                        </Grid>
                    )}
                </Grid>
            </Box>
            <Box display="inline-flex" width="15%" justifyContent="flex-end">
                <Box position="relative" top={16}>
                    <Button
                        disabled={!filtersUpdated}
                        variant="contained"
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <Box mr={1} top={3} position="relative">
                            <FiltersIcon />
                        </Box>
                        <FormattedMessage {...MESSAGES.filter} />
                    </Button>
                </Box>
            </Box>
        </>
    );
};

Filters.defaultProps = {
    baseUrl: '',
    disableDates: false,
};

Filters.propTypes = {
    baseUrl: PropTypes.string,
    router: PropTypes.object.isRequired,
    disableDates: PropTypes.bool,
};

const wrappedFilters = withRouter(Filters);
export { wrappedFilters as Filters };
