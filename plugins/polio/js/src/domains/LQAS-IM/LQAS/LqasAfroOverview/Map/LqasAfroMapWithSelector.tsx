import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Paper, makeStyles, Tabs, Tab, Divider } from '@material-ui/core';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { paperElevation } from '../../../shared/constants';
import { LqasAfroMap } from './LqasAfroMap';
import { Router } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../../constants/messages';
import { AfroMapParams, Side } from '../types';
import { redirectToReplace } from '../../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { LQAS_AFRO_MAP_URL } from '../../../../../constants/routes';
import { LqasAfroSelector } from '../LqasAfroSelector';
import { LqasAfroList } from '../ListView/LqasAfroList';
import { LqasAfroOverviewContextProvider } from '../Context/LqasAfroOverviewContext';

const LIST = 'list';
const MAP = 'map';

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
}));

type Props = {
    selectedRound: string;
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: string, side: Side) => void;
    router: Router;
    side: Side;
    params: AfroMapParams;
    // eslint-disable-next-line no-unused-vars
    onDisplayedShapeChange: (value: string, side: Side) => void;
};

export const LqasAfroMapWithSelector: FunctionComponent<Props> = ({
    selectedRound,
    onRoundChange,
    router,
    side,
    params,
    onDisplayedShapeChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const [tab, setTab] = useState(MAP);

    // TABS
    const handleChangeTab = useCallback(
        newtab => {
            const tabKey = side === 'left' ? 'leftTab' : 'rightTab';
            setTab(newtab);
            const newParams = {
                ...router.params,
                [tabKey]: newtab,
            };
            dispatch(redirectToReplace(LQAS_AFRO_MAP_URL, newParams));
        },
        [router.params, dispatch, side],
    );
    // TABS
    return (
        <LqasAfroOverviewContextProvider>
            <Paper elevation={paperElevation}>
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                    }}
                    className={classes.marginBottom}
                    indicatorColor="primary"
                    onChange={(event, newtab) => handleChangeTab(newtab)}
                >
                    <Tab value={MAP} label={formatMessage(MESSAGES.map)} />
                    <Tab value={LIST} label={formatMessage(MESSAGES.list)} />
                </Tabs>
                <Divider />
                <Box px={2} mt={2}>
                    <LqasAfroSelector
                        selectedRound={selectedRound}
                        onRoundChange={onRoundChange}
                        params={params}
                        onDisplayedShapeChange={onDisplayedShapeChange}
                        side={side}
                    />
                </Box>
                {tab === MAP && (
                    <Box m={2} pb={2} className={classes.mapContainer}>
                        <LqasAfroMap router={router} side={side} />
                    </Box>
                )}
                {tab === LIST && (
                    <Box m={2} pb={2} className={classes.mapContainer}>
                        <LqasAfroList router={router} side={side} />{' '}
                    </Box>
                )}
            </Paper>
        </LqasAfroOverviewContextProvider>
    );
};
