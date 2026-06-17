import React, { useState, FunctionComponent } from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFormikContext } from 'formik';

import MESSAGES from '../../../constants/messages';
import { PolioCampaignValues } from '../../../constants/types';
import { useStyles } from '../../../styles/theme';

import { PreparednessConfig } from './PreparednessConfig';

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
        <Box
            sx={{
                mt: -4,
                width: '100%'
            }}>
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
                            round={round}
                            campaignName={values.obr_name}
                        />
                    </TabPanel>
                ))}
            </TabContext>
        </Box>
    );
};
