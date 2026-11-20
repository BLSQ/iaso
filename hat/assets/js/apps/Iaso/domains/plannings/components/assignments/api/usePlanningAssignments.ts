import { UseQueryResult } from 'react-query';
import {
    getApiMicroplanningPlanningsAssignmentsOrgUnitsListQueryKey,
    useApiMicroplanningPlanningsAssignmentsOrgUnitsList,
} from 'Iaso/api/assignments/endpoints/assignments/assignments';
import { AssignmentOrgUnitOutput } from 'Iaso/api/assignments/models/assignmentOrgUnit.zod';
import { PaginatedAssignmentOrgUnitListOutput } from 'Iaso/api/assignments/models/paginatedAssignmentOrgUnitList.zod';
import { Assignment } from '../mainPanel/types';

// The page colours every org unit of the planning, so it loads all assignments at once.
const ALL_ASSIGNMENTS_PARAMS = { limit: 100_000 };

export const getPlanningAssignmentsQueryKey = (planningId: number) =>
    getApiMicroplanningPlanningsAssignmentsOrgUnitsListQueryKey(
        `${planningId}`,
        ALL_ASSIGNMENTS_PARAMS,
    );

const hasOrgUnit = (
    assignment: AssignmentOrgUnitOutput,
): assignment is Assignment => assignment.org_unit !== null;

export const getAssignments = (
    data?: PaginatedAssignmentOrgUnitListOutput,
): Assignment[] => data?.results?.filter(hasOrgUnit) ?? [];

export const usePlanningAssignments = (
    planningId: number,
): UseQueryResult<Assignment[]> =>
    useApiMicroplanningPlanningsAssignmentsOrgUnitsList<Assignment[]>(
        `${planningId}`,
        ALL_ASSIGNMENTS_PARAMS,
        { query: { select: getAssignments } },
    );
