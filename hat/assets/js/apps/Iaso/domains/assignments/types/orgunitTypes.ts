/* eslint-disable camelcase */

type OrgunitType = {
    id: number;
    name: string;
};

type OrgunitTypes = OrgunitType[];

export type OrgunitTypesApi = {
    orgUnitTypes: OrgunitTypes;
};
