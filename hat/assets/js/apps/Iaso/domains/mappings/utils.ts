// EVENT_TRACKER iaso_field: send an instance property instead of the answer.
// The exporter only knows the org unit DHIS2 id (EventTrackerHandler.get_instance_value).
export const ORG_UNIT_IASO_FIELD = 'instance.org_unit.source_ref';

// option meaning no iaso_field: the answer comes from the form
export const VALUE_FROM_FORM = 'form';

const ORG_UNIT_VALUE_TYPE = 'ORGANISATION_UNIT';

/** The org unit id only fits a data element / attribute of org unit type. */
export const isOrgUnitTarget = (item?: Record<string, any>): boolean =>
    (item?.dataElement ?? item?.trackedEntityAttribute)?.valueType ===
    ORG_UNIT_VALUE_TYPE;

/**
 * Question mapping to save for the proposed DHIS2 target: an EVENT_TRACKER
 * mapping is a list, with the instance property when one is chosen.
 */
export const buildQuestionMapping = (
    proposed: Record<string, any>,
    mappingType: string,
    iasoField?: string,
): Record<string, any> | Record<string, any>[] => {
    if (mappingType !== 'EVENT_TRACKER') {
        return proposed;
    }
    const withIasoField =
        isOrgUnitTarget(proposed) && iasoField && iasoField !== VALUE_FROM_FORM;
    return [withIasoField ? { ...proposed, iaso_field: iasoField } : proposed];
};
