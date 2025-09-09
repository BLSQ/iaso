import React, { FunctionComponent, useMemo, useState } from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab } from '@mui/material';
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import { useDebounce } from 'use-debounce';

import { BooleanInput } from '../../../components/Inputs';

import MESSAGES from '../../../constants/messages';

import { CampaignFormValues } from '../../../constants/types';
import { useStyles } from '../../../styles/theme';
import { useIsPolioCampaign } from '../hooks/useIsPolioCampaignCheck';
import { useGetGeoJson } from './hooks/useGetGeoJson';
import { useGetParentOrgUnit } from './hooks/useGetParentOrgUnit';
import { ScopeField } from './ScopeField';
import { FilteredDistricts, Round } from './Scopes/types';
import { useFilteredDistricts } from './Scopes/utils';

export const scopeFormFields = ['separate_scopes_per_round', 'scopes'];

export const ScopeForm: FunctionComponent = () => {
    const { values } = useFormikContext<CampaignFormValues>();
    const isPolio = useIsPolioCampaign(values);
    const { formatMessage } = useSafeIntl();
    const { separate_scopes_per_round: scopePerRound, rounds } = values;
    const classes: Record<string, string> = useStyles();
    const [page, setPage] = useState<number>(0);
    const [searchScope, setSearchScope] = useState<boolean>(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);

    const [currentTab, setCurrentTab] = useState<string>(
        rounds?.[0] ? `${rounds[0].number}` : '1',
    );
    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };
    const sortedRounds: Round[] = useMemo(
        () =>
            rounds
                .map((round, roundIndex) => {
                    return { ...round, originalIndex: roundIndex };
                })
                .sort((a, b) => a.number - b.number), // useless as already done in back-end
        [rounds],
    );

    const { data: country } = useGetParentOrgUnit(values.initial_org_unit);
    const parentCountryId =
        country?.country_parent?.id || country?.root?.id || country?.id;
    const { data: districtShapes, isFetching: isFetchingDistrictsShapes } =
        useGetGeoJson(parentCountryId, 'DISTRICT');
    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        parentCountryId,
        'REGION',
    );

    const scopes = useMemo(() => {
        if (!scopePerRound) {
            return values.scopes;
        }
        if (rounds) {
            const currentRound = sortedRounds.find(
                round => `${round.number}` === currentTab,
            );
            if (currentRound?.scopes) {
                return currentRound.scopes;
            }
        }
        return [];
    }, [currentTab, rounds, scopePerRound, sortedRounds, values.scopes]);

    const filteredDistricts: FilteredDistricts[] | undefined =
        useFilteredDistricts({
            isPolio,
            scopes,
            districtShapes,
            regionShapes,
            search: debouncedSearch,
            searchScope,
        });

    useSkipEffectOnMount(() => {
        setPage(0);
    }, [filteredDistricts]);

    return (
        <Box minWidth="70vw">
            <Grid container spacing={4} justifyContent="space-between">
                <Grid xs={12} md={6} item>
                    <Field
                        name="separate_scopes_per_round"
                        component={BooleanInput}
                        label={formatMessage(MESSAGES.scope_per_round)}
                    />
                </Grid>
            </Grid>
            <TabContext value={currentTab}>
                {scopePerRound && (
                    <TabList onChange={handleChangeTab}>
                        {sortedRounds.map(round => (
                            <Tab
                                key={round.number}
                                label={`${formatMessage(MESSAGES.round)} ${
                                    round.number
                                }`}
                                value={`${round.number}`}
                            />
                        ))}
                    </TabList>
                )}
                {!scopePerRound && (
                    <ScopeField
                        name="scopes"
                        search={search}
                        filteredDistricts={filteredDistricts}
                        searchScope={searchScope}
                        setSearchScope={setSearchScope}
                        isFetchingDistricts={
                            isFetchingDistrictsShapes || !filteredDistricts
                        }
                        isFetchingRegions={isFetchingRegions || !regionShapes}
                        districtShapes={districtShapes}
                        regionShapes={regionShapes}
                        setSearch={setSearch}
                        page={page}
                        setPage={setPage}
                        campaign={values}
                    />
                )}
                {scopePerRound &&
                    sortedRounds.map(round => (
                        <TabPanel
                            value={`${round.number}`}
                            key={round.number}
                            sx={{ p: 0 }}
                            className={classes.tabPanel}
                        >
                            <ScopeField
                                name={`rounds[${round.originalIndex}].scopes`}
                                search={search}
                                filteredDistricts={filteredDistricts}
                                searchScope={searchScope}
                                setSearchScope={setSearchScope}
                                isFetchingDistricts={
                                    isFetchingDistrictsShapes ||
                                    !filteredDistricts
                                }
                                isFetchingRegions={
                                    isFetchingRegions || !regionShapes
                                }
                                districtShapes={districtShapes}
                                regionShapes={regionShapes}
                                setSearch={setSearch}
                                page={page}
                                setPage={setPage}
                                campaign={values}
                            />
                        </TabPanel>
                    ))}
            </TabContext>
        </Box>
    );
};
