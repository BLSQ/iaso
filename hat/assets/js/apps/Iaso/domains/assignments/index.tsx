import React, {
    FunctionComponent,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { Box, Tabs, Tab, Grid, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    useSafeIntl,
    LoadingSpinner,
    useSkipEffectOnMount,
} from 'bluesquare-components';

import { baseUrls } from '../../constants/urls';

import TopBar from '../../components/nav/TopBarComponent';

import { AssignmentsFilters } from './components/AssignmentsFilters';
import { AssignmentsMapTab } from './components/AssignmentsMapTab';
import { AssignmentsListTab } from './components/AssignmentsListTab';
import { Sidebar } from './components/AssignmentsSidebar';
import { ParentDialog } from './components/ParentDialog';

import { AssignmentParams, AssignmentApi } from './types/assigment';
import { Team, SubTeam, User } from './types/team';
import { AssignmentUnit } from './types/locations';
import { ParentOrgUnit } from '../orgUnits/types/orgUnit';
import { useGetAssignmentData } from './hooks/useGetAssignmentData';

import { getSaveParams } from './utils';

import MESSAGES from './messages';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useRedirectTo, useRedirectToReplace } from '../../routing/routing';

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

export const Assignments: FunctionComponent = () => {
    const params: AssignmentParams = useParamsObject(
        baseUrls.assignments,
    ) as AssignmentParams;
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const redirectToReplace = useRedirectToReplace();
    const classes: Record<string, string> = useStyles();
    const [tab, setTab] = useState(params.tab ?? 'map');
    const [currentTeam, setCurrentTeam] = useState<Team>();
    const [parentSelected, setParentSelected] = useState<
        ParentOrgUnit | undefined
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
        redirectTo(baseUrl, newParams);
    };

    const { planningId, team: currentTeamId, baseOrgunitType } = params;

    const {
        planning,
        assignments,
        allAssignments,
        saveAssignment,
        saveMultiAssignments,
        teams,
        profiles,
        orgunitTypes,
        childrenOrgunits,
        orgUnits,
        orgUnitsList,
        sidebarData,
        isFetchingOrgUnits,
        isFetchingOrgUnitsList,
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
        search: params.search,
        selectedItem,
    });
    const isLoading = isLoadingPlanning || isSaving;

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
            redirectTo(baseUrl, newParams as Record<string, any>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignments, redirectTo]);

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

                        redirectTo(baseUrl, newParams as Record<string, any>);
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeamId, teams, redirectTo]);

    useEffect(() => {
        if (params.order) {
            const redirect = (to: string): void => {
                const tempParams = {
                    ...params,
                    order: `${params.order?.startsWith('-') ? '-' : ''}${to}`,
                };
                redirectToReplace(baseUrl, tempParams);
            };
            if (
                params.order?.includes('assignment__team__name') &&
                currentTeam?.type === 'TEAM_OF_USERS'
            ) {
                redirect('assignment__user__username');
            }
            if (
                params.order?.includes('assignment__user__username') &&
                currentTeam?.type === 'TEAM_OF_TEAMS'
            ) {
                redirect('assignment__team__name');
            }
        }
    }, [params, currentTeam?.type, redirectToReplace]);

    useSkipEffectOnMount(() => {
        // Change order if baseOrgunitType or team changed and current order is on a parent column that will probably disappear
        if (params.order?.includes('parent__name')) {
            redirectToReplace(baseUrl, {
                ...params,
                order: 'name',
            });
        }
    }, [params.baseOrgunitType, params.team, redirectToReplace]);

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
            />
            <ParentDialog
                childrenOrgunits={childrenOrgunits}
                parentSelected={parentSelected}
                setParentSelected={setParentSelected}
                selectedItem={selectedItem}
                currentTeam={currentTeam}
                teams={teams || []}
                profiles={profiles}
                planning={planning}
                saveMultiAssignments={saveMultiAssignments}
                isFetchingChildrenOrgunits={isFetchingChildrenOrgunits}
            />
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
                            <Grid item xs={12} lg={5}>
                                <Sidebar
                                    data={sidebarData || []}
                                    assignments={assignments}
                                    selectedItem={selectedItem}
                                    orgUnits={orgUnitsList || []}
                                    setSelectedItem={setSelectedItem}
                                    currentTeam={currentTeam}
                                    setItemColor={setItemColor}
                                    teams={teams || []}
                                    profiles={profiles}
                                    isLoadingAssignments={
                                        isLoadingAssignments ||
                                        isFetchingOrgUnitsList
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} lg={7}>
                                <Paper>
                                    <Box ml={-4}>
                                        <Tabs
                                            textColor="inherit"
                                            indicatorColor="secondary"
                                            value={tab}
                                            classes={{
                                                root: classes.tabs,
                                                indicator: classes.indicator,
                                            }}
                                            onChange={(_, newtab) =>
                                                handleChangeTab(newtab)
                                            }
                                        >
                                            <Tab
                                                value="map"
                                                label={formatMessage(
                                                    MESSAGES.map,
                                                )}
                                            />
                                            <Tab
                                                value="list"
                                                label={formatMessage(
                                                    MESSAGES.list,
                                                )}
                                            />
                                        </Tabs>
                                    </Box>
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
                                                    orgunitTypes={
                                                        orgunitTypes || []
                                                    }
                                                    isFetchingOrgUnitTypes={
                                                        isFetchingOrgunitTypes
                                                    }
                                                    planning={planning}
                                                    currentTeam={currentTeam}
                                                    teams={teams || []}
                                                    profiles={profiles}
                                                    params={params}
                                                    allAssignments={
                                                        allAssignments
                                                    }
                                                    setParentSelected={
                                                        setParentSelected
                                                    }
                                                    locations={orgUnits}
                                                    isFetchingLocations={
                                                        isFetchingOrgUnits
                                                    }
                                                    handleSaveAssignment={
                                                        handleSaveAssignment
                                                    }
                                                    isLoadingAssignments={
                                                        isLoadingAssignments
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
                                                currentTeam={currentTeam}
                                                orgUnits={orgUnitsList}
                                                handleSaveAssignment={
                                                    handleSaveAssignment
                                                }
                                                isFetchingOrgUnits={
                                                    isLoadingAssignments ||
                                                    isFetchingOrgUnitsList
                                                }
                                                selectedItem={selectedItem}
                                                setParentSelected={
                                                    setParentSelected
                                                }
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </>
                </Box>
            </Box>
        </>
    );
};
