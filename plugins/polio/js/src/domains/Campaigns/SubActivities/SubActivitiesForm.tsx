import React, { FunctionComponent, useMemo } from 'react';
import { TabContext, TabList } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFormikContext } from 'formik';
import { useTabs } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { CampaignFormValues } from '../../../constants/types';
import MESSAGES from './messages';
import { SubActivityForm } from './SubActivityForm';

export const SubActivitiesForm: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext<CampaignFormValues>();

    const excludedTestAndOnHoldRounds = useMemo(
        () => rounds.filter(r => !r.is_test),
        [rounds],
    );

    const { tab, handleChangeTab } = useTabs<string>({
        defaultTab: excludedTestAndOnHoldRounds[0]
            ? `${excludedTestAndOnHoldRounds[0].number}`
            : '1',
    });

    const round = useMemo(() => {
        return excludedTestAndOnHoldRounds.find(
            r => r.number === parseInt(tab, 10),
        );
    }, [excludedTestAndOnHoldRounds, tab]);
    return (
        <Box minWidth="70vw" mt={-4}>
            <TabContext value={tab}>
                <TabList onChange={handleChangeTab}>
                    {excludedTestAndOnHoldRounds.map(rnd => (
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
