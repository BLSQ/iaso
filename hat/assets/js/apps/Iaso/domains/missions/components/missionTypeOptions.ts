import AssignmentIndIcon from '@mui/icons-material/AssignmentIndOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import MESSAGES from '../messages';

export const MISSION_TYPE_OPTIONS = [
    {
        value: MissionTypeDa2Enum.enum.FORM_FILLING,
        Icon: DescriptionIcon,
        labelMessage: MESSAGES.form,
        descriptionMessage: MESSAGES.formFillingDescription,
    },
    {
        value: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        Icon: LocationOnIcon,
        labelMessage: MESSAGES.orgUnitAndFormChip,
        descriptionMessage: MESSAGES.orgUnitAndFormDescription,
    },
    {
        value: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
        Icon: AssignmentIndIcon,
        labelMessage: MESSAGES.entityAndFormChip,
        descriptionMessage: MESSAGES.entityAndFormDescription,
    },
] as const;

export const getMissionTypeOption = (missionType: MissionTypeDa2Enum) =>
    MISSION_TYPE_OPTIONS.find(option => option.value === missionType);

export const FORMS_SECTION_MESSAGES = {
    [MissionTypeDa2Enum.enum.FORM_FILLING]: {
        title: MESSAGES.forms,
        description: MESSAGES.formsOnAssignedOrgUnitInfo,
        minColumn: MESSAGES.minPerOrgUnit,
        maxColumn: MESSAGES.maxPerOrgUnit,
    },
    [MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM]: {
        title: MESSAGES.formsOnCreatedOrgUnit,
        description: MESSAGES.formsOnCreatedOrgUnitInfo,
        minColumn: MESSAGES.minPerOrgUnit,
        maxColumn: MESSAGES.maxPerOrgUnit,
    },
    [MissionTypeDa2Enum.enum.ENTITY_AND_FORM]: {
        title: MESSAGES.formsOnCreatedEntity,
        description: MESSAGES.formsOnCreatedEntityInfo,
        minColumn: MESSAGES.minPerEntity,
        maxColumn: MESSAGES.maxPerEntity,
    },
};

export type CreatedTypeMissionType =
    | typeof MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM
    | typeof MissionTypeDa2Enum.enum.ENTITY_AND_FORM;

export const CREATED_TYPE_CONFIG = {
    [MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM]: {
        fieldName: 'org_unit_type',
        getFormsParams: (typeId: number) => ({
            params: { orgUnitTypeIds: typeId },
        }),
        typeMessage: MESSAGES.orgUnitType,
        pleaseSelectMessage: MESSAGES.pleaseSelectOrgUnitType,
        title: MESSAGES.orgUnitsAgentCreates,
        description: MESSAGES.orgUnitsAgentCreatesInfo,
        typeLabel: MESSAGES.orgUnitTypeToCreate,
        minLabel: MESSAGES.minNewOrgUnits,
        maxLabel: MESSAGES.maxNewOrgUnits,
    },
    [MissionTypeDa2Enum.enum.ENTITY_AND_FORM]: {
        fieldName: 'entity_type',
        getFormsParams: (typeId: number) => ({
            params: { entity_type_ids: typeId },
        }),
        typeMessage: MESSAGES.entityType,
        pleaseSelectMessage: MESSAGES.pleaseSelectEntityType,
        title: MESSAGES.entitiesAgentCreates,
        description: MESSAGES.entitiesAgentCreatesInfo,
        typeLabel: MESSAGES.entityTypeToCreate,
        minLabel: MESSAGES.minEntities,
        maxLabel: MESSAGES.maxEntities,
    },
} as const;
