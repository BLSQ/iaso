import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitType } from '../../orgUnits/types/orgunitTypes';

export type OrgunitTypeRegistry = OrgunitType & {
    orgUnits: OrgUnit[];
};
