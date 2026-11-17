import {
    MissionEntityTypeRetrieve,
    MissionFormRetrieve,
    MissionOrgUnitTypeRetrieve,
    MissionTypeDa2Enum,
} from 'Iaso/api/missions';
import { INFINITY_SYMBOL, MISSION_TYPE_OPTIONS } from './constants';

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

export const formatMaxCardinality = (value?: number | null): string =>
    value?.toLocaleString() ?? INFINITY_SYMBOL;

export const getMissionTypeOption = (missionType: MissionTypeDa2Enum) =>
    MISSION_TYPE_OPTIONS.find(option => option.value === missionType);
