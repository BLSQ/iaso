import { Grid, Tab, Tabs } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { BudgetProcessApproval } from './BudgetProcessApproval';
import { BudgetProcessCostPerChild } from './BudgetProcessCostPerChild';
import { BudgetProcessFundsRelease } from './BudgetProcessFundsRelease';

type Props = {
    disableEdition?: boolean;
    currentState?: string;
};
export const BudgetProcessModalTabs: FunctionComponent<Props> = ({
    disableEdition = false,
    currentState,
}) => {
    const { formatMessage } = useSafeIntl();

    const [tab, setTab] = useState<'approval' | 'release' | 'costPerChild'>(
        'approval',
    );

    return (
        <>
            <Grid item xs={12}>
                <Tabs value={tab} onChange={(_, newtab) => setTab(newtab)}>
                    <Tab
                        value="approval"
                        label={formatMessage(MESSAGES.budgetApproval)}
                    />
                    <Tab
                        value="release"
                        label={formatMessage(MESSAGES.fundsRelease)}
                    />
                    <Tab
                        value="costPerChild"
                        label={formatMessage(MESSAGES.costPerChild)}
                    />
                </Tabs>
            </Grid>
            {tab === 'approval' && (
                <BudgetProcessApproval
                    disableEdition={disableEdition}
                    currentState={currentState}
                />
            )}
            {tab === 'release' && <BudgetProcessFundsRelease />}
            {tab === 'costPerChild' && <BudgetProcessCostPerChild />}
        </>
    );
};
