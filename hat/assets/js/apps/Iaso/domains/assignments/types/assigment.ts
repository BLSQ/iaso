/* eslint-disable camelcase */
import { Shape } from '../../orgUnits/types/shapes';

export type AssignmentParams = {
    planningId: string;
    team?: string;
    baseOrgunitType?: string;
    parentOrgunitType?: string;
    parentPicking?: string;
    tab?: string;
    order?: string;
    search?: string;
};

type OrgUnitDetails = {
    id: number;
    name: string;
    org_unit_type?: number;
    geo_json: Shape | null;
    latitude: number | null;
    longitude: number | null;
};

export type AssignmentApi = {
    id: number;
    planning: number;
    user: number;
    team: number;
    org_unit: number;
    org_unit_details: OrgUnitDetails;
};

export type SaveAssignmentQuery =
    | {
          id?: number;
          planning: number;
          org_unit: number;
          team?: number | null;
          user?: number | null;
      }
    | {
          id?: number;
          planning: number;
          org_units: number[];
          team?: number | null;
          user?: number | null;
      };

export type AssignmentsApi = AssignmentApi[];
