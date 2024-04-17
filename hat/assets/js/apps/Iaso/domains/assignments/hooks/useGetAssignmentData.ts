import { useMemo } from 'react';

import { Planning } from '../types/planning';
import { SubTeam, User, Team, DropdownTeamsOptions } from '../types/team';
import { Locations } from '../types/locations';
import { DropdownOptions } from '../../../types/utils';
import { ChildrenOrgUnits } from '../types/orgUnit';
import { AssignmentApi, SaveAssignmentQuery } from '../types/assigment';

import { useGetTeams } from './requests/useGetTeams';
import { useGetProfiles, ProfileWithColor } from './requests/useGetProfiles';
import {
    useSaveAssignment,
    useBulkSaveAssignments,
} from './requests/useSaveAssignment';
import { useGetOrgUnitTypes } from './requests/useGetOrgUnitTypes';
import { useGetOrgUnitsByParent } from './requests/useGetOrgUnitsByParent';
import { useGetOrgUnits, useGetOrgUnitsList } from './requests/useGetOrgUnits';
import { useGetOrgUnitParentIds } from './useGetOrgUnitParentIds';
import { useGetPlanning } from './requests/useGetPlanning';
import {
    useGetAssignments,
    AssignmentsResult,
} from './requests/useGetAssignments';

import { useBoundState } from '../../../hooks/useBoundState';
import { OrgUnit, ParentOrgUnit } from '../../orgUnits/types/orgUnit';

type Props = {
    planningId: string;
    currentTeam: Team | undefined;
    parentSelected: ParentOrgUnit | undefined;
    baseOrgunitType: string | undefined;
    order?: string;
    search?: string;
    selectedItem: SubTeam | User | undefined;
};

type Result = {
    planning: Planning | undefined;
    assignments: AssignmentApi[];
    allAssignments: AssignmentApi[];
    // eslint-disable-next-line no-unused-vars
    saveAssignment: (params: SaveAssignmentQuery) => void;
    // eslint-disable-next-line no-unused-vars
    saveMultiAssignments: (params: SaveAssignmentQuery) => void;
    teams: DropdownTeamsOptions[] | undefined;
    profiles: ProfileWithColor[];
    orgunitTypes: DropdownOptions<string>[] | undefined;
    childrenOrgunits: ChildrenOrgUnits | undefined;
    orgUnits: Locations | undefined;
    orgUnitsList: OrgUnit[] | undefined;
    sidebarData: SubTeam[] | User[] | undefined;
    isFetchingOrgUnits: boolean;
    isFetchingOrgUnitsList: boolean;
    isLoadingPlanning: boolean;
    isSaving: boolean;
    isFetchingOrgunitTypes: boolean;
    isFetchingChildrenOrgunits: boolean;
    isLoadingAssignments: boolean;
    isTeamsFetched: boolean;
    // eslint-disable-next-line no-unused-vars
    setItemColor: (color: string, itemId: number) => void;
};

export const useGetAssignmentData = ({
    planningId,
    currentTeam,
    parentSelected,
    baseOrgunitType,
    order,
    selectedItem,
    search,
}: Props): Result => {
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
    const [teams, setTeams] = useBoundState<DropdownTeamsOptions[] | undefined>(
        [],
        dataTeams,
    );
    const [profiles, setProfiles] = useBoundState<ProfileWithColor[]>(
        [],
        dataProfiles,
    );
    const {
        data,
        isLoading: isLoadingAssignments,
    }: {
        data?: AssignmentsResult;
        isLoading: boolean;
    } = useGetAssignments({ planning: planningId }, currentTeam);
    const assignments = useMemo(() => (data ? data.assignments : []), [data]);
    const allAssignments = useMemo(
        () => (data ? data.allAssignments : []),
        [data],
    );
    const { data: orgunitTypes, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypes();
    const { data: childrenOrgunits, isFetching: isFetchingChildrenOrgunits } =
        useGetOrgUnitsByParent({
            orgUnitParentId: parentSelected?.id,
            baseOrgunitType,
            allAssignments,
            teams: teams || [],
            profiles: profiles || [],
            currentType: currentTeam?.type,
            selectedItem,
        });
    const { mutateAsync: saveAssignment, isLoading: isSaving } =
        useSaveAssignment();

    const { mutateAsync: saveMultiAssignments, isLoading: isBulkSaving } =
        useBulkSaveAssignments();
    const { data: dataOrgUnits, isFetching: isFetchingOrgUnits } =
        useGetOrgUnits({
            orgUnitParentIds: useGetOrgUnitParentIds({
                currentTeam,
                allAssignments,
                planning,
                isLoadingAssignments,
            }),
            baseOrgunitType,
            assignments,
            allAssignments,
            teams: teams || [],
            profiles: profiles || [],
            currentType: currentTeam?.type,
            order,
            search,
        });
    const { data: orgUnitsList, isFetching: isFetchingOrgUnitsList } =
        useGetOrgUnitsList({
            orgUnitParentIds: useGetOrgUnitParentIds({
                currentTeam,
                allAssignments,
                planning,
                isLoadingAssignments,
            }),
            baseOrgunitType,
            order,
            search,
        });
    const [orgUnits] = useBoundState<Locations | undefined>(
        undefined,
        dataOrgUnits,
    );
    const sidebarData =
        currentTeam?.type === 'TEAM_OF_USERS'
            ? currentTeam.users_details
            : currentTeam?.sub_teams_details;

    return useMemo(() => {
        const setItemColor = (color, itemId) => {
            // TODO: improve this
            if (currentTeam?.type === 'TEAM_OF_USERS') {
                const itemIndex = profiles.findIndex(
                    profile => profile.user_id === itemId,
                );
                if (itemIndex !== undefined) {
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
                if (itemIndex !== undefined && teams) {
                    const newTeams = [...teams];
                    newTeams[itemIndex] = {
                        ...newTeams[itemIndex],
                        color,
                    };
                    setTeams(newTeams);
                }
            }
        };
        return {
            planning,
            assignments,
            allAssignments,
            saveAssignment,
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
            isSaving: isBulkSaving || isSaving,
            isFetchingOrgunitTypes,
            isFetchingChildrenOrgunits,
            isLoadingAssignments,
            isTeamsFetched,
            setItemColor,
            saveMultiAssignments,
        };
    }, [
        allAssignments,
        assignments,
        childrenOrgunits,
        currentTeam?.type,
        isBulkSaving,
        isFetchingChildrenOrgunits,
        isFetchingOrgUnits,
        isFetchingOrgUnitsList,
        isFetchingOrgunitTypes,
        isLoadingAssignments,
        isLoadingPlanning,
        isSaving,
        isTeamsFetched,
        orgUnits,
        orgUnitsList,
        orgunitTypes,
        planning,
        profiles,
        saveAssignment,
        saveMultiAssignments,
        setProfiles,
        setTeams,
        sidebarData,
        teams,
    ]);
};
