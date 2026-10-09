import { z as zod } from 'zod';
import {
    MissionFormCreateRequest,
    MissionOrgUnitTypeCreateRequest,
    MissionEntityTypeCreateRequest,
} from 'Iaso/api/missions';

export const MissionCreateBody = zod.discriminatedUnion('mission_type', [
    MissionFormCreateRequest,
    MissionOrgUnitTypeCreateRequest,
    MissionEntityTypeCreateRequest,
]);

export type MissionCreateBody = zod.input<typeof MissionCreateBody>;
