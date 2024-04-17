/* eslint-disable camelcase */
import { TabContext, TabList } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFormikContext } from 'formik';
import React, { FunctionComponent, useState } from 'react';

import MESSAGES from '../../../constants/messages';

import { Campaign, Round } from '../../../constants/types';
import { EvaluationForm } from '../Rounds/EvaluationForm';

export const scopeFormFields = ['separate_scopes_per_round', 'scopes'];

export const evaluationFormFields = (rounds: Round[]): string[] => {
    const roundKeys = [
        ...rounds
            .map((_round, i) => {
                return [
                    `rounds[${i}].awareness_of_campaign_planning`,
                    `rounds[${i}].im_percentage_children_missed_in_plus_out_household`,
                    `rounds[${i}].im_percentage_children_missed_out_household`,
                    `rounds[${i}].im_percentage_children_missed_in_household`,
                    `rounds[${i}].main_awareness_problem`,
                    `rounds[${i}].lqas_district_failing`,
                    `rounds[${i}].lqas_district_passing`,
                    `rounds[${i}].lqas_ended_at`,
                    `rounds[${i}].lqas_started_at`,
                    `rounds[${i}].im_ended_at`,
                    `rounds[${i}].im_started_at`,
                ];
            })
            .flat(),
    ];
    return roundKeys;
};
export const EvaluationsForms: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext<Campaign>();
    const [currentTab, setCurrentTab] = useState<string>(
        rounds[0] ? `${rounds[0].number}` : '1',
    );

    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box width="100%" mt={-4}>
            <TabContext value={currentTab}>
                <TabList onChange={handleChangeTab}>
                    {rounds.map(round => (
                        <Tab
                            sx={theme => ({
                                fontSize: 12,
                                minWidth: 0,
                                padding: '10px 12px',
                                [theme.breakpoints.up('sm')]: {
                                    minWidth: 0,
                                },
                            })}
                            key={round.number}
                            label={`${formatMessage(MESSAGES.round)} ${
                                round.number
                            }`}
                            value={`${round.number}`}
                        />
                    ))}
                </TabList>
                <Box mt={2} width="100%">
                    <EvaluationForm roundNumber={parseInt(currentTab, 10)} />
                </Box>
            </TabContext>
        </Box>
    );
};
