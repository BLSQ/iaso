import { DataSource } from '../../../types/dataSources';
import { OrgUnit } from '../../../types/orgUnit';
import { OrgunitType } from '../../../types/orgunitTypes';
import EditableGroup from '../EditableGroup';

type OrgUnitEditButtonValues = {
    edit: boolean;
    add: boolean;
    delete: boolean;
};

export type OrgUnitMapState = {
    locationGroup: EditableGroup;
    catchmentGroup: EditableGroup;
    canEditLocation: boolean;
    canEditCatchment: boolean;
    currentOption: 'filters' | 'edit' | 'settings' | 'comments';
    formsSelected: any[];
    orgUnitTypesSelected: OrgunitType[];
    ancestorWithGeoJson?: OrgUnit;
    location: OrgUnitEditButtonValues;
    catchment: OrgUnitEditButtonValues;
};

export type AssociatedOrgUnit = DataSource & {
    orgUnits: OrgUnit[];
};

export type MappedOrgUnit = ((OrgunitType & { color: string }) | DataSource) & {
    orgUnits: { shapes: any[]; locations: any[] };
};
