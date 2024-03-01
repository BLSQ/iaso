/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { replace } from 'react-router-redux';

import { Grid, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import FiltersIcon from '@mui/icons-material/FilterList';
import { withRouter } from 'react-router';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent.tsx';
import DatesRange from 'Iaso/components/filters/DatesRange';
import { useGetGroupDropdown } from 'Iaso/domains/orgUnits/hooks/requests/useGetGroups.ts';
import MESSAGES from '../../../constants/messages';
import { useGetCountries } from '../../../hooks/useGetCountries';
import { useGetGroupedCampaigns } from '../../GroupedCampaigns/hooks/useGetGroupedCampaigns.ts';

import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing.ts';
import {
    dateApiToDateRangePicker,
    dateRangePickerToDateApi,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/dates.ts';
import { appId } from '../../../constants/app.ts';

const campaignTypeOptions = (formatMessage, showTest = false) => {
    const options = [
        { label: formatMessage(MESSAGES.all), value: 'all' },
        { label: formatMessage(MESSAGES.preventiveShort), value: 'preventive' },
        { label: formatMessage(MESSAGES.regular), value: 'regular' },
    ];
    if (showTest) {
        return [
            ...options,
            { label: formatMessage(MESSAGES.testCampaign), value: 'test' },
        ];
    }
    return options;
};

const Filters = ({
    router,
    disableDates,
    disableOnlyDeleted,
    isCalendar,
    showTest,
}) => {
    const { formatMessage } = useSafeIntl();
    const { params } = router;
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [orgUnitGroups, setOrgUnitGroups] = useState(params.orgUnitGroups);
    const [campaignType, setCampaignType] = useState(params.campaignType);
    const [campaignGroups, setCampaignGroups] = useState(params.campaignGroups);
    const [search, setSearch] = useState(params.search);
    const [showOnlyDeleted, setShowOnlyDeleted] = useState(
        params.showOnlyDeleted === 'true',
    );
    const [roundStartFrom, setRoundStartFrom] = useState(
        dateApiToDateRangePicker(params.roundStartFrom),
    );
    const [roundStartTo, set1StartTo] = useState(
        dateApiToDateRangePicker(params.roundStartTo),
    );

    const filtersFilled = useCallback(() => {
        return (
            countries ||
            search ||
            roundStartFrom ||
            roundStartTo ||
            showOnlyDeleted ||
            campaignType ||
            campaignGroups ||
            orgUnitGroups
        );
    }, [
        campaignGroups,
        campaignType,
        countries,
        orgUnitGroups,
        roundStartFrom,
        roundStartTo,
        search,
        showOnlyDeleted,
    ]);

    const dispatch = useDispatch();
    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                countries,
                search: search && search !== '' ? search : undefined,
                roundStartFrom: dateRangePickerToDateApi(roundStartFrom),
                roundStartTo: dateRangePickerToDateApi(roundStartTo),
                page: null,
                campaignType,
                showOnlyDeleted: showOnlyDeleted || undefined,
                campaignGroups,
                orgUnitGroups,
                filterLaunched: !!filtersFilled(),
            };
            const url = genUrl(router, urlParams);
            dispatch(replace(url));
        }
    }, [
        filtersUpdated,
        countries,
        search,
        roundStartFrom,
        roundStartTo,
        campaignType,
        showOnlyDeleted,
        campaignGroups,
        orgUnitGroups,
        filtersFilled,
        router,
        dispatch,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const { data: groupedCampaigns, isFetching: isFetchingGroupedGroups } =
        useGetGroupedCampaigns();
    // Pass the appId to have it works in the embedded calendar where the user is not connected
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'True', appId });
    const groupedCampaignsOptions = useMemo(
        () =>
            groupedCampaigns?.results.map(result => ({
                label: result.name,
                value: result.id,
            })) ?? [],
        [groupedCampaigns],
    );
    const countriesList = (data && data.orgUnits) || [];

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));
    const [textSearchError, setTextSearchError] = useState(false);

    useEffect(() => {
        setFiltersUpdated(true);
    }, [
        countries,
        search,
        roundStartFrom,
        roundStartTo,
        showOnlyDeleted,
        campaignType,
        campaignGroups,
        orgUnitGroups,
    ]);

    useEffect(() => {
        setFiltersUpdated(false);
    }, []);
    const GroupedCampaignsInput = () => {
        return (
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
        );
    };
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={(key, value) => {
                            setSearch(value);
                        }}
                        value={search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        blockForbiddenChars
                        onErrorChange={setTextSearchError}
                    />
                    <InputComponent
                        loading={isFetchingGroupedOrgUnits}
                        keyValue="orgUnitGroups"
                        multi
                        clearable
                        onChange={(key, value) => {
                            setOrgUnitGroups(value);
                        }}
                        value={orgUnitGroups}
                        type="select"
                        options={groupedOrgUnits}
                        label={MESSAGES.countryBlock}
                    />
                    {!isCalendar && <GroupedCampaignsInput />}
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        loading={isFetchingCountries}
                        keyValue="campaignType"
                        clearable
                        onChange={(_key, value) => {
                            setCampaignType(value);
                        }}
                        value={campaignType}
                        type="select"
                        options={campaignTypeOptions(formatMessage, showTest)}
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
                {isCalendar && (
                    <Grid item xs={12} md={3}>
                        <GroupedCampaignsInput />
                    </Grid>
                )}
                {!disableDates && (
                    <Grid item xs={12} md={3}>
                        <DatesRange
                            xs={12}
                            sm={12}
                            md={12}
                            lg={12}
                            onChangeDate={(key, value) => {
                                if (key === 'dateFrom') {
                                    setRoundStartFrom(value);
                                }
                                if (key === 'dateTo') {
                                    set1StartTo(value);
                                }
                            }}
                            labelFrom={MESSAGES.RoundStartFrom}
                            labelTo={MESSAGES.RoundStartTo}
                            dateFrom={roundStartFrom}
                            dateTo={roundStartTo}
                        />
                    </Grid>
                )}
                <Grid
                    container
                    item
                    xs={12}
                    md={!disableDates || isCalendar ? 3 : 6}
                    justifyContent="flex-end"
                >
                    <Box mt={isLargeLayout ? 2 : 0}>
                        <Button
                            disabled={textSearchError || !filtersUpdated}
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
                </Grid>
            </Grid>
        </>
    );
};

Filters.defaultProps = {
    baseUrl: '',
    disableDates: false,
    disableOnlyDeleted: false,
    isCalendar: false,
    showTest: false,
};

Filters.propTypes = {
    baseUrl: PropTypes.string,
    router: PropTypes.object.isRequired,
    disableDates: PropTypes.bool,
    disableOnlyDeleted: PropTypes.bool,
    isCalendar: PropTypes.bool,
    showTest: PropTypes.bool,
};

const wrappedFilters = withRouter(Filters);
export { wrappedFilters as Filters };
