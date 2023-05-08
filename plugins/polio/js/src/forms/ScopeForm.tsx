/* eslint-disable camelcase */
import React, { FunctionComponent, useState, useMemo } from 'react';
import { Field, useFormikContext } from 'formik';
import { useDebounce } from 'use-debounce';
import cloneDeep from 'lodash/cloneDeep';
// @ts-ignore
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab, Grid } from '@material-ui/core';

import { BooleanInput } from '../components/Inputs';

import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

import { useGetParentOrgUnit } from '../hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../hooks/useGetGeoJson';
import { findScopeWithOrgUnit, findRegion } from '../components/Scopes/utils';
import { ScopeField } from '../components/Inputs/ScopeField';

import { FilteredDistricts, Round, Scope } from '../components/Scopes/types';

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
    scopes: Scope[];
    initial_org_unit: number;
};

export const scopeFormFields = ['separate_scopes_per_round', 'scopes'];

export const ScopeForm: FunctionComponent = () => {
    const { values } = useFormikContext<Values>();
    const { formatMessage } = useSafeIntl();
    const { separate_scopes_per_round: scopePerRound, rounds } = values;
    const classes: Record<string, string> = useStyles();
    const [page, setPage] = useState<number>(0);
    const [searchScope, setSearchScope] = useState<boolean>(true);
    const [currentTab, setCurrentTab] = useState<string>(
        rounds[0] ? `${rounds[0].number}` : '1',
    );
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);

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

    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

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

    const filteredDistricts: FilteredDistricts[] | undefined = useMemo(() => {
        if (districtShapes && regionShapes) {
            let filtered: FilteredDistricts[] = districtShapes.map(district => {
                return {
                    ...cloneDeep(district),
                    region: findRegion(district, regionShapes),
                    vaccineName: findScopeWithOrgUnit(scopes, district.id)
                        ?.vaccine,
                };
            });
            if (scopes) {
                filtered.forEach((d, index) => {
                    scopes.forEach(scope => {
                        scope.group.org_units.forEach(ouId => {
                            if (d.id === ouId) {
                                filtered[index].vaccineName = scope.vaccine;
                            }
                        });
                    });
                });
            }

            if (searchScope) {
                filtered = filtered.filter(d =>
                    scopes.some(scope => scope.group.org_units.includes(d.id)),
                );
            }

            if (debouncedSearch !== '') {
                filtered = filtered.filter(d =>
                    d.name
                        .toLowerCase()
                        .includes(debouncedSearch.toLowerCase()),
                );
            }
            return filtered;
        }
        return undefined;
    }, [districtShapes, regionShapes, scopes, debouncedSearch, searchScope]);

    useSkipEffectOnMount(() => {
        setPage(0);
    }, [filteredDistricts]);

    return (
        <>
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
                    />
                )}
                {scopePerRound &&
                    sortedRounds.map(round => (
                        <TabPanel
                            value={`${round.number}`}
                            key={round.number}
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
                            />
                        </TabPanel>
                    ))}
            </TabContext>
        </>
    );
};
