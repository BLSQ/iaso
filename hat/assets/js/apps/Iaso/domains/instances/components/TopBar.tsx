import React, { FunctionComponent } from 'react';

import { makeStyles, Grid, Tabs, Tab } from '@material-ui/core';
// @ts-ignore
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
    // eslint-disable-next-line no-unused-vars
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
                        value={tab}
                        classes={{
                            root: classes.tabs,
                        }}
                        onChange={(_, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="list"
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
