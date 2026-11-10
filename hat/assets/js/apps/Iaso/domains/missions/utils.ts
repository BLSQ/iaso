import { MissionEntityTypeRetrieve } from 'Iaso/api/missions/models/missionEntityTypeRetrieve.zod';
import { MissionFormRetrieve } from 'Iaso/api/missions/models/missionFormRetrieve.zod';
import { MissionOrgUnitTypeRetrieve } from 'Iaso/api/missions/models/missionOrgUnitTypeRetrieve.zod';
import { MissionTypeDa2Enum } from 'Iaso/api/missions/models/missionTypeDa2Enum.zod';

export const LEFT_CELL_WIDTH = '200px';

export const isMissionFormRetrieve = (
    data: any,
): data is MissionFormRetrieve => {
    return data?.mission_type === MissionTypeDa2Enum.enum.FORM_FILLING;
};

export const isMissionEntityTypeRetrieve = (
    data: any,
): data is MissionEntityTypeRetrieve => {
    return data?.mission_type === MissionTypeDa2Enum.enum.ENTITY_AND_FORM;
};

export const isMissionOrgUnitTypeRetrieve = (
    data: any,
): data is MissionOrgUnitTypeRetrieve => {
    return data?.mission_type === MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM;
};
