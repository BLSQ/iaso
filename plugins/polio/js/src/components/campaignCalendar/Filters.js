import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { replace } from 'react-router-redux';

import { Grid, Button, Box } from '@material-ui/core';
import FiltersIcon from '@material-ui/icons/FilterList';
import { withRouter } from 'react-router';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import DatesRange from 'Iaso/components/filters/DatesRange';

import MESSAGES from '../../constants/messages';
import { useGetCountries } from '../../hooks/useGetCountries';
import { useGetGroupedCampaigns } from '../../hooks/useGetGroupedCampaigns.ts';

import { genUrl } from '../../utils/routing';

const campaignTypeOptions = (formatMessage, showTest = false) => {
    const options = [
        { label: formatMessage(MESSAGES.all), value: 'all' },
        { label: formatMessage(MESSAGES.preventiveShort), value: 'preventive' },
        { label: formatMessage(MESSAGES.regular), value: 'regular' },
    ];
    if (showTest) {
        return [
            ...options,
            { label: formatMessage(MESSAGES.testCampaigns), value: 'test' },
        ];
    }
    return options;
};

const Filters = ({ router, disableDates, disableOnlyDeleted, showTest }) => {
    const { formatMessage } = useSafeIntl();
    const { params } = router;
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [campaignType, setCampaignType] = useState(params.campaignType);
    const [campaignGroups, setCampaignGroups] = useState(params.campaignGroups);
    const [search, setSearch] = useState(params.search);
    const [showOnlyDeleted, setShowOnlyDeleted] = useState(
        params.showOnlyDeleted === 'true',
    );
    const [r1StartFrom, setR1StartFrom] = useState(params.r1StartFrom);
    const [r1StartTo, set1StartTo] = useState(params.r1StartTo);
    const dispatch = useDispatch();
    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                countries,
                search: search && search !== '' ? search : undefined,
                r1StartFrom,
                r1StartTo,
                page: null,
                campaignType,
                showOnlyDeleted: showOnlyDeleted || undefined,
                campaignGroups,
            };
            const url = genUrl(router, urlParams);
            dispatch(replace(url));
        }
    }, [
        filtersUpdated,
        countries,
        search,
        r1StartFrom,
        r1StartTo,
        campaignType,
        campaignGroups,
        showOnlyDeleted,
        router,
        dispatch,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const { data: groupedCampaigns, isFetching: isFetchingGroupedGroups } =
        useGetGroupedCampaigns();
    const groupedCampaignsOptions = useMemo(
        () =>
            groupedCampaigns?.results.map(result => ({
                label: result.name,
                value: result.id,
            })) ?? [],
        [groupedCampaigns],
    );
    const countriesList = (data && data.orgUnits) || [];
    useEffect(() => {
        setFiltersUpdated(true);
    }, [
        countries,
        search,
        r1StartFrom,
        r1StartTo,
        showOnlyDeleted,
        campaignType,
        campaignGroups,
    ]);

    useEffect(() => {
        setFiltersUpdated(false);
    }, []);

    return (
        <>
            <Box display="inline-flex" width="85%">
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <InputComponent
                            keyValue="search"
                            onChange={(key, value) => {
                                setSearch(value);
                            }}
                            value={search}
                            type="search"
                            label={MESSAGES.search}
                            onEnterPressed={handleSearch}
                        />
                        <InputComponent
                            loading={isFetchingGroupedGroups}
                            keyValue="campaignGroups"
                            clearable
                            multi
                            onChange={(_key, value) => {
                                setCampaignGroups(value);
                            }}
                            value={campaignGroups}
                            type="select"
                            options={groupedCampaignsOptions}
                            label={MESSAGES.groupedCampaigns}
                        />
                        {!disableOnlyDeleted && (
                            <InputComponent
                                keyValue="showOnlyDeleted"
                                onChange={(key, value) => {
                                    setShowOnlyDeleted(value);
                                }}
                                value={showOnlyDeleted}
                                type="checkbox"
                                label={MESSAGES.showOnlyDeleted}
                            />
                        )}
                    </Grid>
                    <Grid item xs={4}>
                        <InputComponent
                            loading={isFetchingCountries}
                            keyValue="campaignType"
                            clearable
                            onChange={(_key, value) => {
                                setCampaignType(value);
                            }}
                            value={campaignType}
                            type="select"
                            options={campaignTypeOptions(
                                formatMessage,
                                showTest,
                            )}
                            label={MESSAGES.campaignType}
                        />
                        <InputComponent
                            loading={isFetchingCountries}
                            keyValue="countries"
                            multi
                            clearable
                            onChange={(key, value) => {
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
                        <Grid item xs={4}>
                            <DatesRange
                                xs={12}
                                sm={12}
                                md={12}
                                lg={12}
                                onChangeDate={(key, value) => {
                                    if (key === 'dateFrom') {
                                        setR1StartFrom(value);
                                    }
                                    if (key === 'dateTo') {
                                        set1StartTo(value);
                                    }
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
    disableOnlyDeleted: false,
    showTest: false,
};

Filters.propTypes = {
    baseUrl: PropTypes.string,
    router: PropTypes.object.isRequired,
    disableDates: PropTypes.bool,
    disableOnlyDeleted: PropTypes.bool,
    showTest: PropTypes.bool,
};

const wrappedFilters = withRouter(Filters);
export { wrappedFilters as Filters };
