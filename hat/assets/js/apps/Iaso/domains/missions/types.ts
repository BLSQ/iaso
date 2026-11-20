import { MissionEntityTypeUpdateRequest } from 'Iaso/api/missions/models/missionEntityTypeUpdateRequest.zod';
import { MissionFormUpdateRequest } from 'Iaso/api/missions/models/missionFormUpdateRequest.zod';
import { MissionOrgUnitTypeUpdateRequest } from 'Iaso/api/missions/models/missionOrgUnitTypeUpdateRequest.zod';
import { MissionTypeDa2Enum } from 'Iaso/api/missions/models/missionTypeDa2Enum.zod';

/** All update payloads that include a `forms` array. */
export type MissionUpdateBody =
    | MissionFormUpdateRequest
    | MissionOrgUnitTypeUpdateRequest
    | MissionEntityTypeUpdateRequest;

export type CreatedTypeMissionType =
    | typeof MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM
    | typeof MissionTypeDa2Enum.enum.ENTITY_AND_FORM;
