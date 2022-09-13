import omit from 'lodash/omit';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';

const initialFormState = (orgUnit: OrgUnit, value, key): OrgUnit => {
    const orgUnitCopy: Partial<OrgUnit> = {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit?.org_unit_type_id ?? undefined,
        groups: orgUnit.groups.map(g => g) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
    };

    if (key === 'gps') {
        orgUnitCopy.altitude = value.altitude;
        orgUnitCopy.latitude = value.latitude;
        orgUnitCopy.longitude = value.longitude;
    } else {
        orgUnitCopy.reference_instance_id = value;
    }
    return orgUnitCopy as OrgUnit;
};

export const prepareOrgUnitPayload = (
    orgUnit: OrgUnit,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    value: any,
    key: string,
): OrgUnit => {
    const currentOrgUnit: OrgUnit = { ...orgUnit };
    const newOrgUnit: OrgUnit = initialFormState(orgUnit, value, key);
    const orgUnitBasePayload: OrgUnit = omit({
        ...currentOrgUnit,
        ...newOrgUnit,
    });
    return {
        ...orgUnitBasePayload,
        groups:
            orgUnitBasePayload.groups.length > 0 &&
            Number.isSafeInteger(orgUnitBasePayload.groups[0])
                ? orgUnitBasePayload.groups
                : (orgUnitBasePayload.groups as Array<{ id: number }>).map(
                      g => g.id,
                  ),
    };
};
