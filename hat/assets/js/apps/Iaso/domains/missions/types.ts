import { MissionEntityTypeUpdateRequest } from 'Iaso/api/missions/models/missionEntityTypeUpdateRequest.zod';
import { MissionFormUpdateRequest } from 'Iaso/api/missions/models/missionFormUpdateRequest.zod';
import { MissionOrgUnitTypeUpdateRequest } from 'Iaso/api/missions/models/missionOrgUnitTypeUpdateRequest.zod';

/** All update payloads that include a `forms` array. */
export type MissionUpdateBody =
    | MissionFormUpdateRequest
    | MissionOrgUnitTypeUpdateRequest
    | MissionEntityTypeUpdateRequest;
