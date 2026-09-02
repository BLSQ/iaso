import React, {
    FunctionComponent,
    useMemo,
    useRef,
    useState,
    useCallback,
} from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab } from '@mui/material';
import {
    useSafeIntl,
    useSkipEffectOnMount,
    useDebounce,
} from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';

import { BooleanInput } from '../../../components/Inputs';

import MESSAGES from '../../../constants/messages';

import { CampaignFormValues } from '../../../constants/types';
import { useStyles } from '../../../styles/theme';
import { useIsPolioCampaign } from '../hooks/useIsPolioCampaignCheck';
import { useGetGeoJson } from './hooks/useGetGeoJson';
import { useGetParentOrgUnit } from './hooks/useGetParentOrgUnit';
import { ScopeChangeDialog, ScopeChangeResult } from './ScopeChangeDialog';
import {
    applyScopeChange,
    countDistricts,
    countMergedDistricts,
} from './scopeChangeUtils';
import { ScopeField } from './ScopeField';
import { FilteredDistricts, Round } from './Scopes/types';
import { useFilteredDistricts } from './Scopes/utils';

export const scopeFormFields = ['separate_scopes_per_round', 'scopes'];

export const ScopeForm: FunctionComponent = () => {
    const { values, setValues } = useFormikContext<CampaignFormValues>();
    const isPolio = useIsPolioCampaign(values);
    const { formatMessage } = useSafeIntl();
    const { separate_scopes_per_round: scopePerRound, rounds } = values;
    const classes: Record<string, string> = useStyles();
    const [page, setPage] = useState<number>(0);
    const [searchScope, setSearchScope] = useState<boolean>(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);
    const [displayScopeChangeDialog, setDisplayScopeChangeDialog] =
        useState(false);
    const ignoreNextToggle = useRef(false);
    const campaignDistrictCount = useMemo(
        () => countDistricts(values.scopes),
        [values.scopes],
    );
    const roundDistrictCount = useMemo(
        () =>
            countMergedDistricts(
                (rounds ?? []).map(round => round.scopes ?? []),
            ),
        [rounds],
    );

    const handleCancelScopeChangeDialog = () => {
        ignoreNextToggle.current = true;
        setDisplayScopeChangeDialog(false);
        setValues({
            ...values,
            separate_scopes_per_round: !scopePerRound,
        });
    };
    const handleConfirmScopeChangeDialog = useCallback(
        ({ selectedRoundNumbers }: ScopeChangeResult) => {
            setValues({
                ...values,
                ...applyScopeChange({
                    direction: scopePerRound ? 'toRounds' : 'toCampaign',
                    rounds,
                    campaignScopes: values.scopes ?? [],
                    selectedRoundNumbers,
                }),
            });
            setDisplayScopeChangeDialog(false);
        },
        [scopePerRound, values, rounds, setValues],
    );
    useSkipEffectOnMount(() => {
        if (ignoreNextToggle.current) {
            ignoreNextToggle.current = false;
            return;
        }
        const hasSourceDistricts = scopePerRound
            ? campaignDistrictCount > 0
            : roundDistrictCount > 0;
        if (hasSourceDistricts) {
            setDisplayScopeChangeDialog(true);
        }
    }, [scopePerRound]);
    const [currentTab, setCurrentTab] = useState<string>(
        rounds?.[0] ? `${rounds[0].number}` : '1',
    );
    const handleChangeTab = (_event: any, newValue: string) => {
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
        useGetGeoJson({
            topParentId: parentCountryId,
            orgUnitCategory: 'DISTRICT',
        });
    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        { topParentId: parentCountryId, orgUnitCategory: 'REGION' },
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
        <>
            <ScopeChangeDialog
                open={displayScopeChangeDialog}
                direction={scopePerRound ? 'toRounds' : 'toCampaign'}
                rounds={rounds ?? []}
                districtCount={campaignDistrictCount}
                onClose={handleCancelScopeChangeDialog}
                onConfirm={handleConfirmScopeChangeDialog}
            />
            <Box width="100%">
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
        </>
    );
};
