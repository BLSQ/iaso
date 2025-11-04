import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button, Grid, useMediaQuery, useTheme } from '@mui/material';
import { useRedirectToReplace } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import DatesRange from '../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useGetGroupDropdown } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import {
    dateApiToDateRangePicker,
    dateRangePickerToDateApi,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/dates';

import { appId } from '../../../constants/app';
import MESSAGES from '../../../constants/messages';
import { baseUrls } from '../../../constants/urls';
import { useGetCountries } from '../../../hooks/useGetCountries';
import { useGetCampaignTypes } from '../../Campaigns/hooks/api/useGetCampaignTypes';
import { useCampaignCategoryOptions } from '../../Campaigns/hooks/useCampaignCategoryOptions';
import { useGetGroupedCampaigns } from '../../GroupedCampaigns/hooks/useGetGroupedCampaigns';
import { CalendarParams } from './types';

type Props = {
    params: CalendarParams;
    disableDates?: boolean;
    disableOnlyDeleted?: boolean;
    isCalendar?: boolean;
    isEmbedded?: boolean;
    setCampaignType: React.Dispatch<React.SetStateAction<string>>;
    campaignType?: string;
};

export const getRedirectUrl = (
    isCalendar: boolean,
    isEmbedded: boolean,
): string => {
    if (isCalendar && isEmbedded) {
        return baseUrls.embeddedCalendar;
    }
    if (isCalendar) {
        return baseUrls.calendar;
    }
    return baseUrls.campaigns;
};

export const CampaignsFilters: FunctionComponent<Props> = ({
    params,
    disableDates = false,
    disableOnlyDeleted = false,
    isCalendar = false,
    isEmbedded = false,
    setCampaignType,
    campaignType,
}) => {
    const redirectUrl = getRedirectUrl(isCalendar, isEmbedded);
    const redirectToReplace = useRedirectToReplace();

    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [countries, setCountries] = useState(params.countries);
    const [orgUnitGroups, setOrgUnitGroups] = useState(params.orgUnitGroups);
    const [campaignCategory, setCampaignCategory] = useState(
        isEmbedded
            ? (params.campaignCategory ?? 'all')
            : params.campaignCategory,
    );
    const [campaignGroups, setCampaignGroups] = useState(params.campaignGroups);
    const [search, setSearch] = useState(params.search);
    const [showOnlyDeleted, setShowOnlyDeleted] = useState(
        params.showOnlyDeleted === 'true',
    );
    const [hideTest, setHideTest] = useState(params.show_test === 'false');

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
        hideTest ||
        campaignType ||
        campaignCategory ||
        campaignGroups ||
        orgUnitGroups;

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const urlParams = {
                ...params,
                countries,
                search: search && search !== '' ? search : undefined,
                roundStartFrom:
                    dateRangePickerToDateApi(roundStartFrom ?? undefined) ??
                    undefined,
                roundStartTo:
                    dateRangePickerToDateApi(roundStartTo ?? undefined) ??
                    undefined,
                page: undefined,
                campaignType,
                campaignCategory,
                showOnlyDeleted: showOnlyDeleted ? 'true' : undefined,
                show_test: hideTest ? 'false' : 'true',
                campaignGroups,
                orgUnitGroups,
                filterLaunched: filtersFilled ? 'true' : 'false',
                periodType: params?.periodType,
            };
            redirectToReplace(redirectUrl, urlParams);
        }
    }, [
        filtersUpdated,
        params,
        countries,
        search,
        roundStartFrom,
        roundStartTo,
        campaignType,
        campaignCategory,
        showOnlyDeleted,
        hideTest,
        campaignGroups,
        orgUnitGroups,
        filtersFilled,
        redirectToReplace,
        redirectUrl,
    ]);
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const { data: types, isFetching: isFetchingTypes } = useGetCampaignTypes();
    const { data: groupedCampaigns, isFetching: isFetchingGroupedGroups } =
        useGetGroupedCampaigns();
    // Pass the appId to have it works in the embedded calendar where the user is not connected
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'true', appId });
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
    const campaignCategoryOptions = useCampaignCategoryOptions(isEmbedded);

    useEffect(() => {
        setFiltersUpdated(true);
    }, [
        countries,
        search,
        roundStartFrom,
        roundStartTo,
        showOnlyDeleted,
        hideTest,
        campaignType,
        campaignCategory,
        campaignGroups,
        orgUnitGroups,
    ]);

    useEffect(() => {
        setFiltersUpdated(false);
    }, []);

    return (
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
                    options={campaignCategoryOptions}
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
                    <Box mt={1}>
                        <InputComponent
                            keyValue="showOnlyDeleted"
                            onChange={(key, value) => {
                                setShowOnlyDeleted(value);
                            }}
                            value={showOnlyDeleted}
                            type="checkbox"
                            label={MESSAGES.showOnlyDeleted}
                            withMarginTop={false}
                        />
                    </Box>
                )}
                {!isCalendar && (
                    <Box mt={disableOnlyDeleted ? 1 : undefined}>
                        <InputComponent
                            keyValue="show_test"
                            onChange={(key, value) => {
                                setHideTest(value);
                            }}
                            value={hideTest}
                            type="checkbox"
                            label={MESSAGES.hideTestCampaigns}
                            withMarginTop={false}
                            disabled={campaignCategory === 'on_hold'}
                        />
                    </Box>
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
    );
};
