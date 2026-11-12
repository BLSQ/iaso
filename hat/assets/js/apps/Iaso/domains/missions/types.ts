import {
    MissionEntityTypeUpdateRequest,
    MissionTypeDa2Enum,
    MissionFormUpdateRequest,
    MissionOrgUnitTypeUpdateRequest,
} from 'Iaso/api/missions';

/** All update payloads that include a `forms` array. */
export type MissionUpdateBody =
    | MissionFormUpdateRequest
    | MissionOrgUnitTypeUpdateRequest
    | MissionEntityTypeUpdateRequest;

export type CreatedTypeMissionType =
    | typeof MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM
    | typeof MissionTypeDa2Enum.enum.ENTITY_AND_FORM;
