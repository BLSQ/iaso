import { Dispatch, SetStateAction, useMemo, useState } from 'react';

import {
    OrgUnitTypeHierarchyDropdownValues,
    useGetOrgUnitTypesHierarchy,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { flattenHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { useBoundState } from '../../../hooks/useBoundState';
import { OrgUnit, ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { useGetTeamsDropdown } from '../../teams/hooks/requests/useGetTeams';
import {
    DropdownTeamsOptions,
    SubTeam,
    User,
    Team,
} from '../../teams/types/team';
import { AssignmentApi, SaveAssignmentQuery } from '../types/assigment';
import { Locations } from '../types/locations';
import { ChildrenOrgUnits } from '../types/orgUnit';
import { Planning } from '../types/planning';

import {
    AssignmentsResult,
    useGetAssignments,
} from './requests/useGetAssignments';
import { useGetOrgUnits, useGetOrgUnitsList } from './requests/useGetOrgUnits';
import { useGetOrgUnitsByParent } from './requests/useGetOrgUnitsByParent';
import { useGetPlanning } from './requests/useGetPlanning';
import { ProfileWithColor, useGetProfiles } from './requests/useGetProfiles';

import {
    useBulkSaveAssignments,
    useSaveAssignment,
} from './requests/useSaveAssignment';
import { useGetOrgUnitParentIds } from './useGetOrgUnitParentIds';

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
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
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
    setProfiles: (profiles: ProfileWithColor[]) => void;
    setExtraFilters: Dispatch<SetStateAction<Record<string, any>>>;
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
    const [extraFilters, setExtraFilters] = useState<Record<string, any>>({});
    const { data: dataProfiles = [] } = useGetProfiles();
    const {
        data: planning,
        isLoading: isLoadingPlanning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanning(planningId);
    const { data: teams = [], isFetched: isTeamsFetched } = useGetTeamsDropdown(
        { ancestor: `${planning?.team}` },
        undefined,
        planning?.team ? true : false,
        true,
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
    const { data: orgUnitTypeHierarchy, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypesHierarchy(
            planning?.org_unit_details.org_unit_type || 0,
        );
    const orgunitTypes = useMemo(
        () => flattenHierarchy(orgUnitTypeHierarchy?.sub_unit_types || []),
        [orgUnitTypeHierarchy],
    );
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
            extraFilters,
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
        isFetchingOrgunitTypes: !orgUnitTypeHierarchy || isFetchingOrgunitTypes,
        isFetchingChildrenOrgunits,
        isLoadingAssignments,
        isTeamsFetched,
        saveMultiAssignments,
        setProfiles,
        setExtraFilters,
    };
};
