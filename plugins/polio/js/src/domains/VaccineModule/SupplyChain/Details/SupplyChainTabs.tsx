import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { TabWithInfoIcon } from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TabWithInfoIcon';
import MESSAGES from '../messages';
import { PREALERT, VAR, VRF } from '../constants';
import { TabValue } from '../types';

type Props = {
    tab: TabValue;
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    onChangeTab: (_event: any, newTab: TabValue) => void;
};

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
    };
});

export const SupplyChainTabs: FunctionComponent<Props> = ({
    tab,
    onChangeTab,
    disabled,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <Tabs
            value={tab}
            textColor="inherit"
            indicatorColor="secondary"
            classes={{
                root: classes.tabs,
                indicator: classes.indicator,
            }}
            onChange={onChangeTab}
        >
            <Tab key={VRF} value={VRF} label={formatMessage(MESSAGES[VRF])} />
            <TabWithInfoIcon
                key={PREALERT}
                value={PREALERT}
                title={formatMessage(MESSAGES[PREALERT])}
                // disable if no saved VRF to avoid users trying to save prealert before vrf
                disabled={disabled}
                hasTabError={false}
                showIcon={disabled}
                tooltipMessage={formatMessage(MESSAGES.pleaseCreateVrf)}
            />
            <TabWithInfoIcon
                key={VAR}
                value={VAR}
                title={formatMessage(MESSAGES[VAR])}
                // disable if no saved VRF to avoid users trying to save VAR before vrf
                disabled={disabled}
                hasTabError={false}
                showIcon={disabled}
                tooltipMessage={formatMessage(MESSAGES.pleaseCreateVrf)}
            />
        </Tabs>
    );
};
