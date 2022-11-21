/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab, Grid } from '@material-ui/core';
import isEmpty from 'lodash/isEmpty';

import { ScopeInput } from '../components/Inputs/ScopeInput';
import { BooleanInput } from '../components/Inputs';
import { ScopeSearch } from '../components/Scopes/ScopeSearch';

import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

import { useGetParentOrgUnit } from '../hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../hooks/useGetGeoJson';
import { findScopeWithOrgUnit, findRegion } from '../components/Scopes/utils';

import { FilteredDistricts, Round } from '../components/Scopes/types';

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
    scopes: any;
    initial_org_unit: number;
};

export const ScopeForm: FunctionComponent = () => {
    const { values } = useFormikContext<Values>();
    const { formatMessage } = useSafeIntl();
    const { separate_scopes_per_round: scopePerRound, rounds } = values;
    const classes: Record<string, string> = useStyles();
    const sortedRounds: Round[] = useMemo(
        () =>
            [...rounds]
                .map((round, roundIndex) => {
                    return { ...round, originalIndex: roundIndex };
                })
                .sort((a, b) => a.number - b.number),
        [rounds],
    );
    const [page, setPage] = useState(0);
    const [searchScope, setSearchScope] = useState(true);
    const [currentTab, setCurrentTab] = useState('1');
    const [filteredDistricts, setFilteredDistricts] = useState<
        FilteredDistricts[] | undefined
    >();
    const [searchLaunched, setSearchLaunched] = useState(false);
    const [searchScopeChecked, setSearchScopeChecked] = useState(false);
    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const { data: country } = useGetParentOrgUnit(values.initial_org_unit);

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
    const parentCountryId =
        country?.country_parent?.id || country?.root?.id || country?.id;

    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetGeoJson(parentCountryId, 'DISTRICT');

    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        parentCountryId,
        'REGION',
    );

    const [search, setSearch] = useState('');

    const [newScopeId, setNewScopeId] = useState({ newScope: {} });

    const searchDistrictByName = useCallback(() => {
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
            if (!isEmpty(newScopeId.newScope)) {
                filtreds.forEach((d, index) => {
                    if (newScopeId.newScope[d.id] !== undefined) {
                        filtreds[index].vaccineName = newScopeId.newScope[d.id];
                    }
                });
            }

            if (searchScope) {
                filtreds = filtreds.filter(d =>
                    scopes.some(scope => scope.group.org_units.includes(d.id)),
                );
            }

            if (search !== '') {
                filtreds = filtreds.filter(d =>
                    d.name.toLowerCase().includes(search.toLowerCase()),
                );
            }
            setFilteredDistricts(filtreds);
        }
        setPage(0);
    }, [
        districtShapes,
        newScopeId.newScope,
        regionShapes,
        scopes,
        search,
        searchScope,
    ]);

    useEffect(() => {
        if (districtShapes) {
            searchDistrictByName();
        }
    }, [
        currentTab,
        districtShapes,
        searchScope,
        scopePerRound,
        searchDistrictByName,
    ]);

    const addNewScopeId = useCallback(
        (id: number, vaccineName: string) => {
            const scopeIds = newScopeId;
            newScopeId.newScope[id] = vaccineName;
            setNewScopeId(scopeIds);
        },
        [newScopeId],
    );

    const onChangeSearchScope = () => {
        setSearchScopeChecked(true);
        setSearchScope(!searchScope);
        searchDistrictByName();
    };

    const renderField = (name: string): ReactNode => {
        return (
            <Field
                name={name}
                component={ScopeInput}
                filteredDistrictsResult={filteredDistricts}
                searchLaunched={searchLaunched}
                searchScopeValue={searchScope}
                onChangeSearchScopeFunction={onChangeSearchScope}
                searchScopeChecked={searchScopeChecked}
                addNewScopeId={(id, vacciName) => addNewScopeId(id, vacciName)}
                isFetchingDistricts={isFetchingDistricts || !filteredDistricts}
                isFetchingRegions={isFetchingRegions || !regionShapes}
                districtShapes={filteredDistricts}
                regionShapes={regionShapes}
                searchComponent={
                    <ScopeSearch
                        search={search}
                        setSearch={setSearch}
                        onSearch={() => [
                            searchDistrictByName(),
                            setSearchLaunched(true),
                        ]}
                    />
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
