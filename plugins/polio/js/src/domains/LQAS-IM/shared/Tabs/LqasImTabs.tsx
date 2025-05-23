import React, { FunctionComponent } from 'react';
import { Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { LIST, MAP } from '../constants';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    mapContainer: {
        '& .tile-switch-control': {
            top: 'auto',
            bottom: theme.spacing(1),
            left: theme.spacing(1),
            right: 'auto',
        },
    },
    // We need to render the map to have bounds. Otherwise the API call for districts will get a 500
    hidden: { visibility: 'hidden', height: 0 },
}));

type Props = {
    tab: 'map' | 'list';
    handleChangeTab: (newTab: 'map' | 'list') => void;
};

export const LqasImTabs: FunctionComponent<Props> = ({
    tab,
    handleChangeTab,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Tabs
            value={tab}
            classes={{
                root: classes.tabs,
            }}
            className={classes.marginBottom}
            indicatorColor="primary"
            onChange={(_event, newtab) => handleChangeTab(newtab)}
        >
            <Tab value={MAP} label={formatMessage(MESSAGES.map)} />
            <Tab value={LIST} label={formatMessage(MESSAGES.list)} />
        </Tabs>
    );
};
