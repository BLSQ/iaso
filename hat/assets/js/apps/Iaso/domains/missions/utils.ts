import {
    MissionEntityTypeRetrieve,
    MissionFormRetrieve,
    MissionOrgUnitTypeRetrieve,
    MissionTypeValueEnum,
} from 'Iaso/api/missions';

export function isMissionFormRetrieve(data: any): data is MissionFormRetrieve {
    return data?.mission_type?.value === MissionTypeValueEnum.enum.FORM_FILLING;
}

export function isMissionEntityTypeRetrieve(
    data: any,
): data is MissionEntityTypeRetrieve {
    return (
        data?.mission_type?.value === MissionTypeValueEnum.enum.ENTITY_AND_FORM
    );
}

export function isMissionOrgUnitTypeRetrieve(
    data: any,
): data is MissionOrgUnitTypeRetrieve {
    return (
        data?.mission_type?.value ===
        MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM
    );
}
