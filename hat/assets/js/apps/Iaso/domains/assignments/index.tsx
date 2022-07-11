import React, {
    FunctionComponent,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { Box, makeStyles, Tabs, Tab, Grid } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';

import { redirectTo } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import TopBar from '../../components/nav/TopBarComponent';

import { AssignmentsFilters } from './components/AssignmentsFilters';
import { AssignmentsMapTab } from './components/AssignmentsMapTab';
import { AssignmentsListTab } from './components/AssignmentsListTab';
import { Sidebar } from './components/AssignmentsSidebar';

import { AssignmentParams, AssignmentApi } from './types/assigment';
import { Team, SubTeam, User } from './types/team';
import { OrgUnitShape, AssignmentUnit } from './types/locations';

import { useGetAssignmentData } from './hooks/useGetAssignmentData';

import { getSaveParams } from './utils';

import MESSAGES from './messages';

type Props = {
    params: AssignmentParams;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

const baseUrl = baseUrls.assignments;

export const Assignments: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const [tab, setTab] = useState(params.tab ?? 'map');
    const [currentTeam, setCurrentTeam] = useState<Team>();
    const [parentSelected, setParentSelected] = useState<
        OrgUnitShape | undefined
    >();
    const [selectedItem, setSelectedItem] = useState<
        SubTeam | User | undefined
    >();

    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        dispatch(redirectTo(baseUrl, newParams));
    };

    const { planningId, team: currentTeamId, baseOrgunitType } = params;

    const {
        planning,
        assignments,
        allAssignments,
        saveAssignment,
        teams,
        profiles,
        orgunitTypes,
        childrenOrgunits,
        orgUnits,
        sidebarData,
        isFetchingOrgUnits,
        isLoadingPlanning,
        isSaving,
        isFetchingOrgunitTypes,
        isFetchingChildrenOrgunits,
        isLoadingAssignments,
        isTeamsFetched,
        setItemColor,
    } = useGetAssignmentData({
        planningId,
        currentTeam,
        parentSelected,
        baseOrgunitType,
        order: params.order || 'name',
    });

    const isLoading =
        isLoadingPlanning || isSaving || isFetchingChildrenOrgunits;

    const handleSaveAssignment = useCallback(
        (selectedOrgUnit: AssignmentUnit) => {
            if (planning && selectedItem) {
                const saveParams = getSaveParams({
                    allAssignments,
                    selectedOrgUnit,
                    teams: teams || [],
                    profiles,
                    currentType: currentTeam?.type,
                    selectedItem,
                    planning,
                });
                saveAssignment(saveParams);
            }
        },
        [
            planning,
            selectedItem,
            allAssignments,
            teams,
            profiles,
            currentTeam?.type,
            saveAssignment,
        ],
    );

    useEffect(() => {
        if (!baseOrgunitType && assignments.length > 0) {
            const newBaseOrgUnitType =
                assignments[0].org_unit_details.org_unit_type;
            const newParams = {
                ...params,
                baseOrgunitType: newBaseOrgUnitType,
            };
            dispatch(redirectTo(baseUrl, newParams));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignments]);

    useEffect(() => {
        let newCurrentTeam;
        if (currentTeamId) {
            newCurrentTeam = teams?.find(
                team => team.original?.id === parseInt(currentTeamId, 10),
            );
            if (newCurrentTeam && newCurrentTeam.original) {
                setCurrentTeam(newCurrentTeam.original);
                if (allAssignments.length > 0) {
                    let firstAssignment: AssignmentApi | undefined;
                    if (newCurrentTeam.original.type === 'TEAM_OF_USERS') {
                        firstAssignment = allAssignments.find(assignment =>
                            newCurrentTeam.original.users.some(
                                user => user === assignment.user,
                            ),
                        );
                    }
                    if (newCurrentTeam.original.type === 'TEAM_OF_TEAMS') {
                        firstAssignment = allAssignments.find(assignment =>
                            newCurrentTeam.original.sub_teams.some(
                                team => team === assignment.team,
                            ),
                        );
                    }
                    const newBaseOrgUnitType =
                        firstAssignment?.org_unit_details?.org_unit_type;
                    if (newBaseOrgUnitType) {
                        const newParams = {
                            ...params,
                            baseOrgunitType: newBaseOrgUnitType,
                        };
                        dispatch(redirectTo(baseUrl, newParams));
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeamId, teams]);

    useEffect(() => {
        if (planning && currentTeam) {
            if (currentTeam.type === 'TEAM_OF_USERS') {
                setSelectedItem(currentTeam.users_details[0]);
            }
            if (currentTeam.type === 'TEAM_OF_TEAMS') {
                setSelectedItem(currentTeam.sub_teams_details[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planning?.id, currentTeam?.id]);
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
                    onChange={(_, newtab) => handleChangeTab(newtab)}
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
                    <>
                        <Grid container spacing={2}>
                            <Grid item xs={5}>
                                <Sidebar
                                    params={params}
                                    data={sidebarData || []}
                                    assignments={assignments}
                                    selectedItem={selectedItem}
                                    setSelectedItem={setSelectedItem}
                                    currentTeam={currentTeam}
                                    setItemColor={setItemColor}
                                    teams={teams || []}
                                    profiles={profiles}
                                    orgunitTypes={orgunitTypes || []}
                                    isFetchingOrgUnitTypes={
                                        isFetchingOrgunitTypes
                                    }
                                    showMapSelector={tab === 'map'}
                                />
                            </Grid>
                            <Grid item xs={7}>
                                <Box position="relative" width="100%">
                                    <Box
                                        width="100%"
                                        className={
                                            tab === 'map'
                                                ? ''
                                                : classes.hiddenOpacity
                                        }
                                    >
                                        {!isLoadingAssignments && (
                                            <AssignmentsMapTab
                                                planning={planning}
                                                currentTeam={currentTeam}
                                                teams={teams || []}
                                                profiles={profiles}
                                                params={params}
                                                allAssignments={allAssignments}
                                                setParentSelected={
                                                    setParentSelected
                                                }
                                                childrenOrgunits={
                                                    childrenOrgunits || []
                                                }
                                                parentSelected={parentSelected}
                                                saveMultiAssignments={
                                                    saveAssignment
                                                }
                                                selectedItem={selectedItem}
                                                locations={orgUnits}
                                                isFetchingLocations={
                                                    isFetchingOrgUnits
                                                }
                                                handleSaveAssignment={
                                                    handleSaveAssignment
                                                }
                                            />
                                        )}
                                    </Box>
                                    {tab === 'list' && (
                                        <AssignmentsListTab
                                            assignments={allAssignments}
                                            params={params}
                                            teams={teams || []}
                                            profiles={profiles}
                                            orgUnits={orgUnits?.all || []}
                                            handleSaveAssignment={
                                                handleSaveAssignment
                                            }
                                            isFetchingOrgUnits={
                                                isLoadingAssignments ||
                                                isFetchingOrgUnits ||
                                                !orgUnits
                                            }
                                            selectedItem={selectedItem}
                                        />
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </>
                </Box>
            </Box>
        </>
    );
};
