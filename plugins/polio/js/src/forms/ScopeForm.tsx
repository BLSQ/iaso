/* eslint-disable camelcase */
import React, { FunctionComponent, useState, useMemo, useRef, useEffect } from 'react';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab, Grid, Paper, Button, Box, makeStyles } from '@material-ui/core';
import { ScopeInput } from '../components/Inputs/ScopeInput';
import { BooleanInput } from '../components/Inputs';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { styled } from '@material-ui/styles';
import FiltersIcon from '@material-ui/icons/FilterList';
import { FormattedMessage } from 'react-intl';
type Round = {
    number: number;
};

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
};
const styles = makeStyles({ inputComponent: { marginTop: '10000px' } });
export const ScopeForm: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const { values } = useFormikContext<Values>();
    const { separate_scopes_per_round: scopePerRound, rounds } = values;
    const classes: Record<string, string> = useStyles();
    const styleClasses = styles()
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
    const [scopeSearch, setScopeSearch] = useState(true);
    const [currentTab, setCurrentTab] = useState('1');
    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const [search, setSearch] = useState(null);

    useEffect(() => {
        setSearchUpdated(true);
    }, [
        search
    ]);

    useEffect(() => {
        setSearchUpdated(false);
    }, []);


    const searchDistricts = useRef(null)
    const defineSearchScope = () => {
        let scopeType = true;
        if (scopeSearch) {
            scopeType = false;
        }
        setScopeSearch(scopeType);
    }

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12} md={3} item>
                    <Field
                        name="separate_scopes_per_round"
                        component={BooleanInput}
                        label={formatMessage(MESSAGES.scope_per_round)}
                    />
                </Grid>
                <Grid xs={12} md={3} item>
                    <InputComponent
                        type="checkbox"
                        withMarginTop={false}
                        onChange={() => defineSearchScope()}
                        value={scopeSearch}
                        label={MESSAGES.searchInScopeOrAllDistricts}
                    />
                </Grid>
                <Grid xs={12} md={3} item>
                    <InputComponent
                        className={styleClasses.inputComponent}
                        variant="contained"
                        keyValue="search"
                        type="search"
                        onEnterPressed={() => [searchDistricts.current(search, scopeSearch), setSearchUpdated(false)]}
                        withMarginTop={false}
                        label={MESSAGES.search}
                        onChange={(key, value) => {
                            setSearch(value);
                        }}
                        value={search}
                    />
                </Grid>
                <Grid xs={6} md={3} item>
                    <Button
                        variant="contained"
                        disabled={!searchUpdated}
                        color="primary"
                        onClick={() => [searchDistricts.current(search, scopeSearch), setSearchUpdated(false)]}
                    >
                        <Box mr={1} top={3} position="relative">
                            <FiltersIcon />
                        </Box>
                        <FormattedMessage {...MESSAGES.filter} />
                    </Button>
                </Grid>
            </Grid>



            {!scopePerRound ? (
                <Field name="scopes" component={ScopeInput} searchDistricts={searchDistricts} scopeSearch={scopeSearch} />
            ) : (
                <TabContext value={currentTab}>
                    <TabList
                        onChange={handleChangeTab}
                    // className={classes.subTabs}
                    >
                        {sortedRounds.map(round => (
                            <Tab
                                key={round.number}
                                label={`${formatMessage(MESSAGES.round)} ${round.number
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
                                searchDistricts={searchDistricts}
                            />
                        </TabPanel>
                    ))}
                </TabContext>
            )}
        </>
    );
};
