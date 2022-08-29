/* eslint-disable camelcase */
import React, { FunctionComponent, useState, useMemo } from 'react';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { Tab } from '@material-ui/core';
import { ScopeInput } from '../components/Inputs/ScopeInput';
import { BooleanInput } from '../components/Inputs';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

type Round = {
    number: number;
};

type Values = {
    separate_scopes_per_round?: boolean;
    rounds: Round[];
};

export const ScopeForm: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const { values } = useFormikContext<Values>();
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
    const [currentTab, setCurrentTab] = useState('1');
    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };
    return (
        <>
            <Field
                name="separate_scopes_per_round"
                component={BooleanInput}
                label={formatMessage(MESSAGES.scope_per_round)}
            />
            {!scopePerRound ? (
                <Field name="scopes" component={ScopeInput} />
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
