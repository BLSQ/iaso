import React, { FunctionComponent, useState } from 'react';
import { Box, makeStyles, Tabs, Tab } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSkipEffectOnMount,
} from 'bluesquare-components';

import { redirectTo } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetPlanning } from './hooks/requests/useGetPlanning';
import { useGetAssignments } from './hooks/requests/useGetAssignments';

import TopBar from '../../components/nav/TopBarComponent';

import { AssignmentsFilters } from './components/AssignmentsFilters';
import { AssignmentsMapTab } from './components/AssignmentsMapTab';

import { AssignmentParams, AssignmentApi } from './types/assigment';
import { Planning } from './types/planning';

import MESSAGES from './messages';

type Props = {
    params: AssignmentParams;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.assignments;

export const Assignments: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const { planningId } = params;
    const [tab, setTab] = useState(params.tab ?? 'map');
    const classes: Record<string, string> = useStyles();

    const {
        data: planning,
        isLoading: isLoadingPlanning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanning(planningId);
    const {
        data: assignments = [],
        isLoading: isLoadingAssignments,
    }: {
        data?: AssignmentApi[];
        isLoading: boolean;
    } = useGetAssignments({ planningId });

    const isLoading = isLoadingPlanning || isLoadingAssignments;
    useSkipEffectOnMount(() => {
        const newParams = {
            ...params,
            tab,
        };
        if (params.tab !== tab) {
            dispatch(redirectTo(baseUrl, newParams));
        }
    }, [dispatch, params, tab]);
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}: ${
                    planning?.name ?? ''
                }`}
                displayBackButton={false}
            >
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={(event, newtab) => setTab(newtab)}
                >
                    <Tab value="map" label={formatMessage(MESSAGES.map)} />
                    <Tab value="list" label={formatMessage(MESSAGES.list)} />
                </Tabs>
            </TopBar>
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isLoading && <LoadingSpinner />}
                <AssignmentsFilters params={params} />
                <Box mt={2}>
                    {tab === 'map' && (
                        <AssignmentsMapTab assignments={assignments} />
                    )}
                    {tab === 'list' && <Box>LIST</Box>}
                </Box>
            </Box>
        </>
    );
};
