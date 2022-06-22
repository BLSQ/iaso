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
import { Profile } from '../../utils/usersUtils';

import { useGetTeams } from './hooks/requests/useGetTeams';
import { useGetProfiles } from './hooks/requests/useGetProfiles';
import { useSaveAssignment } from './hooks/requests/useSaveAssignment';
import { useGetOrgUnitTypes } from './hooks/requests/useGetOrgUnitTypes';

import MESSAGES from './messages';

type Props = {
    params: AssignmentParams;
};

type ProfilesWithColor = Profile & {
    color: string;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.assignments;

export const Assignments: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const { planningId, team: currentTeamId, baseOrgunitType } = params;

    const [tab, setTab] = useState(params.tab ?? 'map');
    const [currentTeam, setCurrentTeam] = useState<Team>();
    const [teams, setTeams] = useState<DropdownTeamsOptions[] | undefined>();
    const [profiles, setProfiles] = useState<ProfilesWithColor[]>([]);

    // TODO: limit users list to planning users or sub team users
    const { data: dataProfiles = [] } = useGetProfiles();
    const {
        data: planning,
        isLoading: isLoadingPlanning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanning(planningId);
    const { data: dataTeams = [], isFetched: isTeamsFetched } = useGetTeams(
        planning?.team,
    );
    const {
        data: assignments = [],
        isLoading: isLoadingAssignments,
    }: {
        data?: AssignmentApi[];
        isLoading: boolean;
    } = useGetAssignments({ planningId }, currentTeam, baseOrgunitType);
    const { data: orgunitTypes, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypes();
    const { mutateAsync: saveAssignment, isLoading: isSaving } =
        useSaveAssignment();

    const isLoading = isLoadingPlanning || isLoadingAssignments || isSaving;

    const setItemColor = (color: string, itemId: number): void => {
        // TODO: improve this
        if (currentTeam?.type === 'TEAM_OF_USERS') {
            const itemIndex = profiles.findIndex(
                profile => profile.user_id === itemId,
            );
            if (itemIndex) {
                const newProfiles = [...profiles];
                newProfiles[itemIndex] = {
                    ...newProfiles[itemIndex],
                    color,
                };
                setProfiles(newProfiles);
            }
        }
        if (currentTeam?.type === 'TEAM_OF_TEAMS') {
            const itemIndex = teams?.findIndex(
                team => team.original.id === itemId,
            );
            if (itemIndex && teams) {
                const newTeams = [...teams];
                newTeams[itemIndex] = {
                    ...newTeams[itemIndex],
                    color,
                };
                setTeams(newTeams);
            }
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
            const newCurrentTeam = teams?.find(
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

    useEffect(() => {
        if (!isEqual(dataProfiles, profiles)) {
            setProfiles(dataProfiles);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataProfiles]);

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
                    teams={teams || []}
                    isFetchingTeams={!isTeamsFetched}
                    orgunitTypes={orgunitTypes || []}
                    isFetchingOrgUnitTypes={isFetchingOrgunitTypes}
                />
                <Box mt={2}>
                    {tab === 'map' && !isLoadingAssignments && (
                        <AssignmentsMapTab
                            assignments={assignments}
                            planning={planning}
                            currentTeam={currentTeam}
                            teams={teams || []}
                            profiles={profiles}
                            setItemColor={setItemColor}
                            saveAssignment={saveAssignment}
                            baseOrgunitType={baseOrgunitType}
                        />
                    )}
                    {tab === 'list' && <Box>LIST</Box>}
                </Box>
            </Box>
        </>
    );
};
