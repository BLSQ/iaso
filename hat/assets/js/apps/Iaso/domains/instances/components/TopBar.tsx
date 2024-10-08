import React, { FunctionComponent } from 'react';

import { Grid, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));
type Props = {
    formName: string;
    tab: string;
    handleChangeTab: (newTab: string) => void;
    formIds: string[];
};

export const InstancesTopBar: FunctionComponent<Props> = ({
    formName,
    tab,
    handleChangeTab,
    formIds,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    let title = formatMessage(MESSAGES.titleMulti);
    if (formIds?.length === 1) {
        title = `${formatMessage(MESSAGES.title)}: ${formName}`;
    }
    return (
        <TopBar title={title}>
            <Grid container spacing={0}>
                <Grid xs={10} item>
                    <Tabs
                        textColor="inherit"
                        indicatorColor="secondary"
                        value={tab}
                        classes={{
                            root: classes.tabs,
                        }}
                        onChange={(_, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="list"
                            className={classes.tab}
                            label={formatMessage(MESSAGES.list)}
                        />
                        <Tab value="map" label={formatMessage(MESSAGES.map)} />
                        <Tab
                            value="files"
                            label={formatMessage(MESSAGES.files)}
                        />
                    </Tabs>
                </Grid>
            </Grid>
        </TopBar>
    );
};
