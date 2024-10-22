import { Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { TabWithInfoIcon } from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TabWithInfoIcon';
import { PREALERT, VAR, VRF } from '../constants';
import MESSAGES from '../messages';
import { TabValue } from '../types';

type Props = {
    tab: TabValue;
    isNew: boolean;
    isNormal: boolean;
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
    isNew,
    isNormal,
}) => {
    const { formatMessage } = useSafeIntl();
    const disabled = isNew || !isNormal;

    const tooltipText = (() => {
        if (isNew) {
            return formatMessage(MESSAGES.pleaseCreateVrf);
        }
        if (!isNormal) {
            return formatMessage(MESSAGES.notAvailableNotNormal);
        }
        return '';
    })();

    const classes: Record<string, string> = useStyles();
    return (
        <Tabs
            value={tab}
            textColor="inherit"
            indicatorColor="secondary"
            classes={{
                root: classes.tabs,
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
                handleChange={onChangeTab}
                showIcon={disabled}
                tooltipMessage={tooltipText}
            />
            <TabWithInfoIcon
                key={VAR}
                value={VAR}
                title={formatMessage(MESSAGES[VAR])}
                // disable if no saved VRF to avoid users trying to save VAR before vrf
                disabled={disabled}
                hasTabError={false}
                handleChange={onChangeTab}
                showIcon={disabled}
                tooltipMessage={tooltipText}
            />
        </Tabs>
    );
};
