import { UseQueryResult } from 'react-query';
import {
    TREEVIEW_ORG_UNIT_FIELDS,
    useGetOrgUnit,
} from 'Iaso/domains/orgUnits/components/TreeView/requests';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';

// Same fields everywhere in the form so the sections share a single request.
const PLANNING_ROOT_ORG_UNIT_FIELDS = `${TREEVIEW_ORG_UNIT_FIELDS},version_id`;

export const useGetPlanningRootOrgUnit = (
    orgUnitId?: number | null,
): UseQueryResult<OrgUnit, Error> =>
    useGetOrgUnit(orgUnitId?.toString(), PLANNING_ROOT_ORG_UNIT_FIELDS);
