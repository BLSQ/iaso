/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
    useEffect,
} from 'react';
import { Field, useField, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab, Grid } from '@material-ui/core';
import sortBy from 'lodash/sortBy';
import isEmpty from 'lodash/isEmpty';

import { ScopeInput } from '../components/Inputs/ScopeInput';
import { BooleanInput } from '../components/Inputs';
import { ScopeSearch } from '../components/Scopes/ScopeSearch';

import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

import { useGetParentOrgUnit } from '../hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../hooks/useGetGeoJson';

import {
    Scope,
    Shape,
    FilteredDistricts,
    Round,
} from '../components/Scopes/types';

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
    scopes: any;
    initial_org_unit: number;
};
const findRegion = (shape: Shape, regionShapes: Shape[]) => {
    return regionShapes.filter(
        regionShape => regionShape.id === shape.parent_id,
    )[0]?.name;
};

const findScopeWithOrgUnit = (scopes: Scope[], orgUnitId: number) => {
    const scope = scopes.find(s => {
        return s.group?.org_units.includes(orgUnitId);
    });
    return scope;
};

export const ScopeForm: FunctionComponent = () => {
    const [fieldValue, setFieldValue] = useState('scopes');
    const { values } = useFormikContext<Values>();

    const [field] = useField(fieldValue);
    const { value: scopes = [] } = field;

    const { formatMessage } = useSafeIntl();
    const [orderBy] = useState('asc');
    const [sortFocus] = useState('DISTRICT');
    const { separate_scopes_per_round: scopePerRound, rounds } = values;

    const classes: Record<string, string> = useStyles();
    const sortedRounds = useMemo(
        () =>
            [...rounds]
                .map((round, roundIndex) => {
                    return { ...round, originalIndex: roundIndex };
                })
                .sort((a, b) => a.number - b.number),
        [rounds],
    );
    const [searchScope, setSearchScope] = useState(true);
    const [currentTab, setCurrentTab] = useState('1');
    const [filteredDistricts, setFilteredDistricts] = useState<
        FilteredDistricts[]
    >([]);
    const [searchLaunched, setSearchLaunched] = useState(false);
    const [searchScopeChecked, setSearchScopeChecked] = useState(false);
    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const { data: country } = useGetParentOrgUnit(values.initial_org_unit);

    const parentCountryId =
        country?.country_parent?.id || country?.root?.id || country?.id;

    const { data: districtShapes } = useGetGeoJson(parentCountryId, 'DISTRICT');

    const { data: regionShapes } = useGetGeoJson(parentCountryId, 'REGION');

    const [search, setSearch] = useState('');

    const [newScopeId, setNewScopeId] = useState({ newScope: {} });

    const searchDistrictByName = useCallback(
        searchScopeValue => {
            let filtreds: FilteredDistricts[] = [];
            filtreds = districtShapes.map(district => {
                return {
                    ...district,
                    region: findRegion(district, regionShapes),
                    vaccineName: findScopeWithOrgUnit(scopes, district.id)
                        ?.vaccine,
                };
            });

            if (!isEmpty(newScopeId.newScope)) {
                filtreds = filtreds.map(d => {
                    if (newScopeId.newScope[d.id] !== undefined) {
                        d.vaccineName = newScopeId.newScope[d.id];
                    }

                    return d;
                });
            }

            if (searchScopeValue) {
                filtreds = filtreds.filter(d => d.vaccineName);
            }

            if (search !== '') {
                filtreds = filtreds.filter(d =>
                    d.name.toLowerCase().includes(search.toLowerCase()),
                );
            }

            if (sortFocus === 'REGION') {
                filtreds = sortBy(filtreds, ['region']);
            } else if (sortFocus === 'VACCINE') {
                filtreds = sortBy(filtreds, ['vaccineName']);
            }
            if (orderBy === 'desc') {
                filtreds = filtreds.reverse();
            }
            setFilteredDistricts(filtreds);
        },
        [
            districtShapes,
            newScopeId,
            orderBy,
            regionShapes,
            scopes,
            search,
            sortFocus,
        ],
    );

    useEffect(() => {
        if (scopePerRound) {
            setFieldValue(`rounds[${currentTab}].scopes`);
        } else {
            setFieldValue(`scopes`);
        }
    }, [currentTab, scopePerRound, sortedRounds]);

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
        searchDistrictByName(!searchScope);
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

            {!scopePerRound ? (
                <>
                    <ScopeSearch
                        search={search}
                        setSearch={setSearch}
                        onSearch={() => [
                            searchDistrictByName(searchScope),
                            setSearchLaunched(true),
                        ]}
                    />
                    <Field
                        name="scopes"
                        component={ScopeInput}
                        filteredDistrictsResult={filteredDistricts}
                        searchLaunched={searchLaunched}
                        searchScopeValue={searchScope}
                        onChangeSearchScopeFunction={onChangeSearchScope}
                        searchScopeChecked={searchScopeChecked}
                        addNewScopeId={(id, vacciName) =>
                            addNewScopeId(id, vacciName)
                        }
                    />
                </>
            ) : (
                <TabContext value={currentTab}>
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
                    {sortedRounds.map(round => (
                        <TabPanel
                            value={`${round.number}`}
                            key={round.number}
                            className={classes.tabPanel}
                        >
                            <ScopeSearch
                                search={search}
                                setSearch={setSearch}
                                onSearch={() => [
                                    searchDistrictByName(searchScope),
                                    setSearchLaunched(true),
                                ]}
                            />
                            <Field
                                name={`rounds[${round.originalIndex}].scopes`}
                                component={ScopeInput}
                                filteredDistrictsResult={filteredDistricts}
                                searchLaunched={searchLaunched}
                                searchScopeValue={searchScope}
                                onChangeSearchScopeFunction={
                                    onChangeSearchScope
                                }
                                searchScopeChecked={searchScopeChecked}
                                addNewScopeId={(id, vacciName) =>
                                    addNewScopeId(id, vacciName)
                                }
                            />
                        </TabPanel>
                    ))}
                </TabContext>
            )}
        </>
    );
};
