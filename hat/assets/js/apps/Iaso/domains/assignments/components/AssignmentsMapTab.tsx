import React, { FunctionComponent } from 'react';

import { AssignmentsMap } from './AssignmentsMap';

import { AssignmentsApi, AssignmentParams } from '../types/assigment';
import { Planning } from '../types/planning';
import { Team, DropdownTeamsOptions } from '../types/team';
import { OrgUnitShape, Locations, OrgUnitMarker } from '../types/locations';
import { Profile } from '../../../utils/usersUtils';

import { useGetOrgUnitParentLocations } from '../hooks/requests/useGetOrgUnitParentLocations';
import { useGetOrgUnitParentIds } from '../hooks/useGetOrgUnitParentIds';
import { ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { DropdownOptions } from '../../../types/utils';

type Props = {
    allAssignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    params: AssignmentParams;
    // eslint-disable-next-line no-unused-vars
    setParentSelected: (orgUnit: ParentOrgUnit | undefined) => void;
    locations: Locations | undefined;
    isFetchingLocations: boolean;
    isLoadingAssignments: boolean;
    handleSaveAssignment: (
        // eslint-disable-next-line no-unused-vars
        selectedOrgUnit: OrgUnitShape | OrgUnitMarker,
    ) => void;
    orgunitTypes: Array<DropdownOptions<string>>;
    isFetchingOrgUnitTypes: boolean;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    allAssignments,
    planning,
    currentTeam,
    teams,
    profiles,
    handleSaveAssignment,
    params,
    setParentSelected,
    locations,
    isFetchingLocations,
    isLoadingAssignments,
    orgunitTypes,
    isFetchingOrgUnitTypes,
}) => {
    const { parentOrgunitType } = params;

    const { data: parentLocations, isFetching: isFetchingParentLocations } =
        useGetOrgUnitParentLocations({
            orgUnitParentIds: useGetOrgUnitParentIds({
                currentTeam,
                allAssignments,
                planning,
                isLoadingAssignments,
            }),
            baseOrgunitType: parentOrgunitType,
        });
    return (
        <AssignmentsMap
            locations={locations}
            isFetchingLocations={isFetchingLocations}
            handleClick={handleSaveAssignment}
            handleParentClick={setParentSelected}
            parentLocations={parentLocations}
            isFetchingParentLocations={isFetchingParentLocations}
            teams={teams}
            profiles={profiles}
            assignments={allAssignments}
            orgunitTypes={orgunitTypes}
            isFetchingOrgUnitTypes={isFetchingOrgUnitTypes}
            params={params}
        />
    );
};
