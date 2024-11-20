import { useMemo } from 'react';

import { DropdownOptions } from '../../../types/utils';
import { AssignmentApi, SaveAssignmentQuery } from '../types/assigment';
import { Locations } from '../types/locations';
import { ChildrenOrgUnits } from '../types/orgUnit';
import { Planning } from '../types/planning';
import { DropdownTeamsOptions, SubTeam, Team, User } from '../types/team';

import {
    AssignmentsResult,
    useGetAssignments,
} from './requests/useGetAssignments';
import { useGetOrgUnits, useGetOrgUnitsList } from './requests/useGetOrgUnits';
import { useGetOrgUnitsByParent } from './requests/useGetOrgUnitsByParent';
import { useGetPlanning } from './requests/useGetPlanning';
import { ProfileWithColor, useGetProfiles } from './requests/useGetProfiles';
import { useGetTeams } from './requests/useGetTeams';
import {
    useBulkSaveAssignments,
    useSaveAssignment,
} from './requests/useSaveAssignment';
import { useGetOrgUnitParentIds } from './useGetOrgUnitParentIds';

import { useBoundState } from '../../../hooks/useBoundState';
import { OrgUnit, ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';

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
    saveAssignment: (params: SaveAssignmentQuery) => void;
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
        useGetOrgUnitTypesDropdownOptions();
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
