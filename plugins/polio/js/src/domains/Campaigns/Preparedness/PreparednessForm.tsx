import { Tab, Box } from '@mui/material';
import { useFormikContext } from 'formik';
import React, { useState, FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import { useStyles } from '../../../styles/theme';
import MESSAGES from '../../../constants/messages';

import { PreparednessConfig } from './PreparednessConfig';
import { PolioCampaignValues } from '../../../constants/types';

export const PreparednessForm: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values } = useFormikContext<PolioCampaignValues>();
    const { rounds = [] } = values;
    const sortedRounds = [...rounds].sort((a, b) => a.number - b.number);

    const defaultRoundNumber = Number.isInteger(sortedRounds[0]?.number)
        ? `${sortedRounds[0]?.number}`
        : '1';

    const [currentTab, setCurrentTab] = useState<string>(defaultRoundNumber);

    const handleChangeTab = (_: any, newValue: string) => {
        setCurrentTab(newValue);
    };

    return (
        <Box mt={-4}>
            <TabContext value={currentTab}>
                <TabList onChange={handleChangeTab} className={classes.subTabs}>
                    {sortedRounds.map(round => (
                        <Tab
                            className={classes.subTab}
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
                        <PreparednessConfig
                            roundNumber={round.number}
                            campaignName={values.obr_name}
                        />
                    </TabPanel>
                ))}
            </TabContext>
        </Box>
    );
};
