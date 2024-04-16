/* eslint-disable react/jsx-props-no-spreading */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';

import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button, Grid, useMediaQuery, useTheme } from '@mui/material';
import { IntlFormatMessage, useSafeIntl } from 'bluesquare-components';
import DatesRange from '../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useGetGroupDropdown } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';
import { useGetCountries } from '../../../hooks/useGetCountries';
import { useGetGroupedCampaigns } from '../../GroupedCampaigns/hooks/useGetGroupedCampaigns';

import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import {
    dateApiToDateRangePicker,
    dateRangePickerToDateApi,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { appId } from '../../../constants/app';
import { useGetCampaignTypes } from '../../Campaigns/hooks/api/useGetCampaignTypes';
import { CalendarParams } from './types';

type Props = {
    router: Router & { params: CalendarParams };
    disableDates?: boolean;
    disableOnlyDeleted?: boolean;
    isCalendar?: boolean;
};

const campaignCategoryOptions = (
    // eslint-disable-next-line no-unused-vars
    formatMessage: IntlFormatMessage,
) => {
    return [
        { label: formatMessage(MESSAGES.all), value: 'all' },
        { label: formatMessage(MESSAGES.preventiveShort), value: 'preventive' },
        { label: formatMessage(MESSAGES.regular), value: 'regular' },
        { label: formatMessage(MESSAGES.testCampaign), value: 'test' },
    ];
};

export const CampaignsFilters: FunctionComponent<Props> = ({
    router,
    disableDates = false,
    disableOnlyDeleted = false,
    isCalendar = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const { params } = router;
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [orgUnitGroups, setOrgUnitGroups] = useState(params.orgUnitGroups);
    const [campaignType, setCampaignType] = useState(params.campaignType);
    const [campaignCategory, setCampaignCategory] = useState(
        params.campaignCategory,
    );
    const [campaignGroups, setCampaignGroups] = useState(params.campaignGroups);
    const [search, setSearch] = useState(params.search);
    const [showOnlyDeleted, setShowOnlyDeleted] = useState(
        params.showOnlyDeleted === 'true',
    );
    const [roundStartFrom, setRoundStartFrom] = useState(
        dateApiToDateRangePicker(params.roundStartFrom),
    );
    const [roundStartTo, setRoundStartTo] = useState(
        dateApiToDateRangePicker(params.roundStartTo),
    );

    const filtersFilled =
        countries ||
        search ||
        roundStartFrom ||
        roundStartTo ||
        showOnlyDeleted ||
        campaignType ||
        campaignCategory ||
        campaignGroups ||
        orgUnitGroups;

    const dispatch = useDispatch();
    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                countries,
                search: search && search !== '' ? search : undefined,
                roundStartFrom: dateRangePickerToDateApi(
                    roundStartFrom ?? undefined,
                ),
                roundStartTo: dateRangePickerToDateApi(
                    roundStartTo ?? undefined,
                ),
                page: null,
                campaignType,
                campaignCategory,
                showOnlyDeleted: showOnlyDeleted ? 'true' : undefined,
                campaignGroups,
                orgUnitGroups,
                filterLaunched: filtersFilled ? 'true' : 'false',
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
        campaignCategory,
        showOnlyDeleted,
        campaignGroups,
        orgUnitGroups,
        filtersFilled,
        router,
        dispatch,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const { data: types, isFetching: isFetchingTypes } = useGetCampaignTypes();
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
        campaignCategory,
        campaignGroups,
        orgUnitGroups,
    ]);

    useEffect(() => {
        setFiltersUpdated(false);
    }, []);

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
                    {!isCalendar && (
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
                    )}
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        loading={isFetchingCountries}
                        keyValue="campaignCategory"
                        clearable
                        onChange={(_key, value) => {
                            setCampaignCategory(value);
                        }}
                        value={campaignCategory}
                        type="select"
                        options={campaignCategoryOptions(formatMessage)}
                        label={MESSAGES.campaignCategory}
                    />
                    <InputComponent
                        loading={isFetchingTypes}
                        keyValue="campaignType"
                        clearable
                        onChange={(_key, value) => {
                            setCampaignType(value);
                        }}
                        multi
                        value={campaignType}
                        type="select"
                        options={types}
                        label={MESSAGES.campaignType}
                    />
                    {!isCalendar && (
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
                    )}
                </Grid>
                <Grid item xs={12} md={3}>
                    {!disableDates && (
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
                                    setRoundStartTo(value);
                                }
                            }}
                            labelFrom={MESSAGES.RoundStartFrom}
                            labelTo={MESSAGES.RoundStartTo}
                            dateFrom={roundStartFrom || undefined}
                            dateTo={roundStartTo || undefined}
                        />
                    )}
                    {isCalendar && (
                        <>
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
                        </>
                    )}
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
