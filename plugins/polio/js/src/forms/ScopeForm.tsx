/* eslint-disable camelcase */
import React, { FunctionComponent, useState, useMemo, ReactNode } from 'react';
import { Field, useFormikContext } from 'formik';
import { useDebounce } from 'use-debounce';
// @ts-ignore
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab, Grid } from '@material-ui/core';

import { ScopeInput } from '../components/Inputs/ScopeInput';
import { BooleanInput } from '../components/Inputs';
import { ScopeSearch } from '../components/Scopes/ScopeSearch';

import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

import { useGetParentOrgUnit } from '../hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../hooks/useGetGeoJson';
import { findScopeWithOrgUnit, findRegion } from '../components/Scopes/utils';

import { FilteredDistricts, Round, Scope } from '../components/Scopes/types';

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
    scopes: Scope[];
    initial_org_unit: number;
};

export const ScopeForm: FunctionComponent = () => {
    const { values } = useFormikContext<Values>();
    const { formatMessage } = useSafeIntl();
    const { separate_scopes_per_round: scopePerRound, rounds } = values;
    const classes: Record<string, string> = useStyles();
    const [page, setPage] = useState(0);
    const [searchScope, setSearchScope] = useState(true);
    const [currentTab, setCurrentTab] = useState('1');
    const [search, setSearch] = useState('');

    const [debouncedSearch] = useDebounce(search, 500);

    const sortedRounds: Round[] = useMemo(
        () =>
            [...rounds]
                .map((round, roundIndex) => {
                    return { ...round, originalIndex: roundIndex };
                })
                .sort((a, b) => a.number - b.number),
        [rounds],
    );

    const { data: country } = useGetParentOrgUnit(values.initial_org_unit);
    const parentCountryId =
        country?.country_parent?.id || country?.root?.id || country?.id;
    const { data: districtShapes, isFetching: isFetchingDistricts } =
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
            const currentRound = sortedRounds[parseInt(currentTab, 10) - 1];
            if (currentRound) {
                return currentRound.scopes;
            }
        }
        return [];
    }, [currentTab, rounds, scopePerRound, sortedRounds, values.scopes]);

    const filteredDistricts = useMemo(() => {
        if (districtShapes) {
            let filtreds: FilteredDistricts[] = [...districtShapes].map(
                district => {
                    return {
                        ...district,
                        region: findRegion(district, regionShapes),
                        vaccineName: findScopeWithOrgUnit(scopes, district.id)
                            ?.vaccine,
                    };
                },
            );
            if (scopes) {
                filtreds.forEach((d, index) => {
                    scopes.forEach(scope => {
                        scope.group.org_units.forEach(ouId => {
                            if (d.id === ouId) {
                                filtreds[index].vaccineName = scope.vaccine;
                            }
                        });
                    });
                });
            }

            if (searchScope) {
                filtreds = filtreds.filter(d =>
                    scopes.some(scope => scope.group.org_units.includes(d.id)),
                );
            }

            if (debouncedSearch !== '') {
                filtreds = filtreds.filter(d =>
                    d.name
                        .toLowerCase()
                        .includes(debouncedSearch.toLowerCase()),
                );
            }
            return filtreds;
        }
        return undefined;
    }, [districtShapes, regionShapes, scopes, debouncedSearch, searchScope]);

    useSkipEffectOnMount(() => {
        setPage(0);
    }, [filteredDistricts]);

    const renderField = (name: string): ReactNode => {
        return (
            <Field
                name={name}
                component={ScopeInput}
                filteredDistricts={filteredDistricts}
                searchScope={searchScope}
                onChangeSearchScope={() => setSearchScope(!searchScope)}
                isFetchingDistricts={isFetchingDistricts || !filteredDistricts}
                isFetchingRegions={isFetchingRegions || !regionShapes}
                districtShapes={districtShapes}
                regionShapes={regionShapes}
                searchComponent={
                    <ScopeSearch search={search} setSearch={setSearch} />
                }
                page={page}
                setPage={setPage}
            />
        );
    };

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
                {!scopePerRound && renderField('scopes')}
                {scopePerRound &&
                    sortedRounds.map(round => (
                        <TabPanel
                            value={`${round.number}`}
                            key={round.number}
                            className={classes.tabPanel}
                        >
                            {renderField(
                                `rounds[${round.originalIndex}].scopes`,
                            )}
                        </TabPanel>
                    ))}
            </TabContext>
        </>
    );
};
