import {
    MissionEntityTypeUpdateRequest,
    MissionFormUpdateRequest,
    MissionOrgUnitTypeUpdateRequest,
} from 'Iaso/api/missions';

/** All update payloads that include a `forms` array. */
export type MissionUpdateBody =
    | MissionFormUpdateRequest
    | MissionOrgUnitTypeUpdateRequest
    | MissionEntityTypeUpdateRequest;
