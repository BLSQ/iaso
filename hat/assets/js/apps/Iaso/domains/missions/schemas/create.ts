import { z as zod } from 'zod';
import { MissionEntityTypeCreateRequest } from 'Iaso/api/missions/models/missionEntityTypeCreateRequest.zod';
import { MissionFormCreateRequest } from 'Iaso/api/missions/models/missionFormCreateRequest.zod';
import { MissionOrgUnitTypeCreateRequest } from 'Iaso/api/missions/models/missionOrgUnitTypeCreateRequest.zod';

export const MissionCreateBody = zod.discriminatedUnion('mission_type', [
    MissionFormCreateRequest,
    MissionOrgUnitTypeCreateRequest,
    MissionEntityTypeCreateRequest,
]);

export type MissionCreateBody = zod.input<typeof MissionCreateBody>;
