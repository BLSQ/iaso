import { MissionEntityTypeUpdateRequest } from 'Iaso/api/missions/models/missionEntityTypeUpdateRequest.zod';
import { MissionFormUpdateRequest } from 'Iaso/api/missions/models/missionFormUpdateRequest.zod';
import { MissionOrgUnitTypeUpdateRequest } from 'Iaso/api/missions/models/missionOrgUnitTypeUpdateRequest.zod';
import { MissionPolymorphicRetrieve } from 'Iaso/api/missions/models/missionPolymorphicRetrieve.zod';
import { MissionTypeDa2Enum } from 'Iaso/api/missions/models/missionTypeDa2Enum.zod';

export type EditMissionFormConfig =
    | {
          missionType: typeof MissionTypeDa2Enum.enum.FORM_FILLING;
          schema: typeof MissionFormUpdateRequest;
          initialValues: MissionFormUpdateRequest;
      }
    | {
          missionType: typeof MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM;
          schema: typeof MissionOrgUnitTypeUpdateRequest;
          initialValues: MissionOrgUnitTypeUpdateRequest;
      }
    | {
          missionType: typeof MissionTypeDa2Enum.enum.ENTITY_AND_FORM;
          schema: typeof MissionEntityTypeUpdateRequest;
          initialValues: MissionEntityTypeUpdateRequest;
      };

export type EditMissionValues = EditMissionFormConfig['initialValues'];

const toBaseValues = (mission: MissionPolymorphicRetrieve) => ({
    name: mission.name,
    description: mission.description,
    forms: mission.forms.map(form => ({
        form: form.form,
        min_cardinality: form.min_cardinality,
        max_cardinality: form.max_cardinality,
    })),
});

export const getEditMissionFormConfig = (
    mission: MissionPolymorphicRetrieve,
): EditMissionFormConfig => {
    switch (mission.mission_type) {
        case MissionTypeDa2Enum.enum.FORM_FILLING:
            return {
                missionType: mission.mission_type,
                schema: MissionFormUpdateRequest,
                initialValues: toBaseValues(mission),
            };
        case MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM:
            return {
                missionType: mission.mission_type,
                schema: MissionOrgUnitTypeUpdateRequest,
                initialValues: {
                    ...toBaseValues(mission),
                    min_cardinality: mission.min_cardinality,
                    max_cardinality: mission.max_cardinality,
                    org_unit_type: mission.org_unit_type.id,
                },
            };
        case MissionTypeDa2Enum.enum.ENTITY_AND_FORM:
            return {
                missionType: mission.mission_type,
                schema: MissionEntityTypeUpdateRequest,
                initialValues: {
                    ...toBaseValues(mission),
                    min_cardinality: mission.min_cardinality,
                    max_cardinality: mission.max_cardinality,
                    entity_type: mission.entity_type.id,
                },
            };
    }
};
