/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
    useEffect,
} from 'react';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab, Grid, Button, Box } from '@material-ui/core';
import InputComponent from 'Iaso/components/forms/InputComponent';
import FiltersIcon from '@material-ui/icons/FilterList';
import { FormattedMessage } from 'react-intl';
import sortBy from 'lodash/sortBy';
import { ScopeInput } from '../components/Inputs/ScopeInput';
import { BooleanInput } from '../components/Inputs';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';
import { useGetParentOrgUnit } from '../hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../hooks/useGetGeoJson';

type Scope = {
    vaccine: string;
    group: {
        org_units: number[];
        id?: number;
    };
};

type Round = {
    number: number;
};

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
    scopes: any;
    initial_org_unit: number;
};

type Shape = {
    name: string;
    id: number;
    parent_id: number;
    country_parent?: { id: number };
    root?: { id: number };
};

type FilteredDistricts = {
    name: string;
    vaccineName: string;
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
    const { formatMessage } = useSafeIntl();
    const { values } = useFormikContext<Values>();
    const [scopes] = useState(values.scopes);
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
    const [searchUpdated, setSearchUpdated] = useState(false);
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

    useEffect(() => {
        setSearchUpdated(true);
    }, [search]);

    useEffect(() => {
        setSearchUpdated(false);
    }, []);

    useEffect(() => {
        setSearchScope(searchScope);
    }, [searchScope]);

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

            if (searchScopeValue) {
                filtreds = filtreds.filter(d => d.vaccineName);
            }

            if (search !== '') {
                filtreds = filtreds.filter(d =>
                    d.name.includes(search?.toUpperCase()),
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
        [districtShapes, orderBy, regionShapes, scopes, search, sortFocus],
    );

    const onChangeSearchScope = () => {
        setSearchScopeChecked(true);
        setSearchScope(!searchScope);
        searchDistrictByName(!searchScope);
    };

    return (
        <>
            <Grid container spacing={4} justify="space-between">
                <Grid xs={12} md={6} item>
                    <Field
                        name="separate_scopes_per_round"
                        component={BooleanInput}
                        label={formatMessage(MESSAGES.scope_per_round)}
                    />
                </Grid>

                <Grid container spacing={3} xs={12} md={5}>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            variant="contained"
                            keyValue="search"
                            type="search"
                            onEnterPressed={() => [
                                searchDistrictByName(searchScope),
                                setSearchUpdated(false),
                                setSearchLaunched(true),
                            ]}
                            withMarginTop={false}
                            label={MESSAGES.search}
                            onChange={(key, value) => {
                                setSearch(value);
                            }}
                            value={search}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Button
                            style={{ marginLeft: 'auto' }}
                            variant="contained"
                            disabled={!searchUpdated}
                            color="primary"
                            onClick={() => [
                                searchDistrictByName(searchScope),
                                setSearchUpdated(false),
                                setSearchLaunched(true),
                            ]}
                        >
                            <Box mr={1} top={3} position="relative">
                                <FiltersIcon />
                            </Box>
                            <FormattedMessage {...MESSAGES.filter} />
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

            {!scopePerRound ? (
                <Field
                    name="scopes"
                    component={ScopeInput}
                    filteredDistricts={filteredDistricts}
                    searchLaunched={searchLaunched}
                    searchScopeValue={searchScope}
                    onChangeSearchScopeFunction={() => onChangeSearchScope()}
                    searchScopeChecked={searchScopeChecked}
                />
            ) : (
                <TabContext value={currentTab}>
                    <TabList
                        onChange={handleChangeTab}
                        // className={classes.subTabs}
                    >
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
                            <Field
                                name={`rounds[${round.originalIndex}].scopes`}
                                component={ScopeInput}
                            />
                        </TabPanel>
                    ))}
                </TabContext>
            )}
        </>
    );
};
