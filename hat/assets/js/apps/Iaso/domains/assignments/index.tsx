import React, { FunctionComponent, useState, useEffect } from 'react';
import { Box, makeStyles, Tabs, Tab } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import isEqual from 'lodash/isEqual';

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
import { Team, DropdownTeamsOptions } from './types/team';

import { useGetTeams } from './hooks/requests/useGetTeams';

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
    const { planningId, team: currentTeamId } = params;

    // TODO: limit teams list to planning team or sub teams of it
    const { data: dataTeams = [], isFetching: isFetchingTeams } = useGetTeams();
    const [tab, setTab] = useState(params.tab ?? 'map');
    const [currentTeam, setCurrentTeam] = useState<Team>();
    const [teams, setTeams] = useState<DropdownTeamsOptions[]>([]);
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

    const setTeamColor = (color: string, teamId: number): void => {
        const teamIndex = teams.findIndex(team => team.original.id === teamId);
        if (teamIndex) {
            const newTeams = [...teams];
            newTeams[teamIndex] = {
                ...newTeams[teamIndex],
                color,
            };
            setTeams(newTeams);
        }
    };

    useSkipEffectOnMount(() => {
        const newParams = {
            ...params,
            tab,
        };
        if (params.tab !== tab) {
            dispatch(redirectTo(baseUrl, newParams));
        }
    }, [dispatch, params, tab]);

    useEffect(() => {
        if (currentTeamId) {
            const newCurrentTeam = teams.find(
                team => team.original?.id === parseInt(currentTeamId, 10),
            );
            if (newCurrentTeam && newCurrentTeam.original) {
                setCurrentTeam(newCurrentTeam.original);
            }
        }
    }, [currentTeamId, teams]);

    useEffect(() => {
        if (!isEqual(dataTeams, teams)) {
            setTeams(dataTeams);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataTeams]);

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
                    onChange={(_, newtab) => setTab(newtab)}
                >
                    <Tab value="map" label={formatMessage(MESSAGES.map)} />
                    <Tab value="list" label={formatMessage(MESSAGES.list)} />
                </Tabs>
            </TopBar>
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isLoading && <LoadingSpinner />}
                <AssignmentsFilters
                    params={params}
                    teams={teams}
                    isFetchingTeams={isFetchingTeams}
                />
                <Box mt={2}>
                    {tab === 'map' && !isLoading && (
                        <AssignmentsMapTab
                            assignments={assignments}
                            planning={planning}
                            currentTeam={currentTeam}
                            teams={teams}
                            setTeamColor={setTeamColor}
                        />
                    )}
                    {tab === 'list' && <Box>LIST</Box>}
                </Box>
            </Box>
        </>
    );
};
