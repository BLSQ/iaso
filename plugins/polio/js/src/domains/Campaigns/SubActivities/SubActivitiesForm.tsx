import React, { FunctionComponent, useMemo } from 'react';
import { useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Tab } from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import { useTabs } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { CampaignFormValues } from '../../../constants/types';
import { SubActivityForm } from './SubActivityForm';
import MESSAGES from './messages';

export const SubActivitiesForm: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext<CampaignFormValues>();
    const { tab, handleChangeTab } = useTabs<string>({
        defaultTab: rounds[0] ? `${rounds[0].number}` : '1',
    });
    const round = useMemo(() => {
        return rounds.find(r => r.number === parseInt(tab, 10));
    }, [rounds, tab]);
    return (
        <Box minWidth="70vw" mt={-4}>
            <TabContext value={tab}>
                <TabList onChange={handleChangeTab}>
                    {rounds.map(rnd => (
                        <Tab
                            sx={theme => ({
                                fontSize: 12,
                                minWidth: 0,
                                padding: '10px 12px',
                                [theme.breakpoints.up('sm')]: {
                                    minWidth: 0,
                                },
                            })}
                            key={rnd.number}
                            label={`${formatMessage(MESSAGES.round)} ${
                                rnd.number
                            }`}
                            value={`${rnd.number}`}
                        />
                    ))}
                </TabList>
                <Box mt={2} minWidth="70vw">
                    <SubActivityForm round={round} />
                </Box>
            </TabContext>
        </Box>
    );
};
