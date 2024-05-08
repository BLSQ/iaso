import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { LIST, MAP, paperElevation } from '../../../shared/constants';
import { LqasAfroMap } from './LqasAfroMap';
import MESSAGES from '../../../../../constants/messages';
import { AfroMapParams, Side } from '../types';
import { LqasAfroSelector } from '../LqasAfroSelector';
import { LqasAfroList } from '../ListView/LqasAfroList';
import { LqasAfroOverviewContextProvider } from '../Context/LqasAfroOverviewContext';
import { Sides } from '../../../../../constants/types';
import { useRedirectToReplace } from '../../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { baseUrls } from '../../../../../constants/urls';

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
    selectedRound: string;
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: string, side: Side) => void;
    side: Side;
    params: AfroMapParams;
    // eslint-disable-next-line no-unused-vars
    onDisplayedShapeChange: (value: string, side: Side) => void;
};
const baseUrl = baseUrls.lqasAfro;
export const LqasAfroMapWithSelector: FunctionComponent<Props> = ({
    selectedRound,
    onRoundChange,
    side,
    params,
    onDisplayedShapeChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const paramTab = side === Sides.left ? params.leftTab : params.rightTab;
    const classes: Record<string, string> = useStyles();
    const [tab, setTab] = useState(paramTab ?? MAP);

    // TABS
    const handleChangeTab = useCallback(
        newtab => {
            const tabKey = side === Sides.left ? 'leftTab' : 'rightTab';
            setTab(newtab);
            const newParams = {
                ...params,
                [tabKey]: newtab,
            };
            redirectToReplace(baseUrl, newParams);
        },
        [side, params, redirectToReplace],
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
                <Box px={2} mt={2}>
                    <LqasAfroSelector
                        selectedRound={selectedRound}
                        onRoundChange={onRoundChange}
                        params={params}
                        onDisplayedShapeChange={onDisplayedShapeChange}
                        side={side}
                    />
                </Box>

                <Box
                    m={2}
                    pb={2}
                    className={
                        tab === MAP ? classes.mapContainer : classes.hidden
                    }
                >
                    <LqasAfroMap params={params} side={side} />
                </Box>

                <Box
                    m={2}
                    pb={2}
                    className={
                        tab === LIST ? classes.mapContainer : classes.hidden
                    }
                >
                    <LqasAfroList params={params} side={side} />{' '}
                </Box>
            </Paper>
        </LqasAfroOverviewContextProvider>
    );
};
