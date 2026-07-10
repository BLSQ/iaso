import {
    MissionFormCreateRequest,
    MissionFormUpdateRequest,
} from 'Iaso/api/missions';

export type BaseUpdateCreateRequest =
    | MissionFormUpdateRequest
    | MissionFormCreateRequest;
