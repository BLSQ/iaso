import React from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import {
    MissionEntityTypeUpdateRequest,
    MissionFormUpdateRequest,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDa2Enum,
} from 'Iaso/api/missions';
import { MissionEntityTypeInput } from 'Iaso/domains/missions/components/forms/MissionEntityTypeInput';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { MissionOrgUnitTypeInput } from 'Iaso/domains/missions/components/forms/MissionOrgUnitTypeInput';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import MESSAGES from '../messages';
import { EntityAndFormChip } from './chips/EntityAndFormChip';
import { FormsChip } from './chips/FormsChip';
import { OrgUnitAndFormChip } from './chips/OrgUnitAndFormChip';
import { InfosTitle } from './details/InfosTitle';
import { MissionsTitle } from './details/MissionsTitle';

type Base<T> = {
    formik: FormikProps<T>;
};

type EditMissionFormProps =
    | (Base<MissionOrgUnitTypeUpdateRequest> & {
          missionType: typeof MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM;
      })
    | (Base<MissionFormUpdateRequest> & {
          missionType: typeof MissionTypeDa2Enum.enum.FORM_FILLING;
      })
    | (Base<MissionEntityTypeUpdateRequest> & {
          missionType: typeof MissionTypeDa2Enum.enum.ENTITY_AND_FORM;
      });

export const EditMissionForm = ({
    formik,
    missionType,
}: EditMissionFormProps) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Box sx={{ p: 2 }}>
                <InfosTitle />
                <Field
                    label={formatMessage(MESSAGES.name)}
                    name="name"
                    component={TextInput}
                    required
                    sx={{ mx: 0, my: 1 }}
                />
                <Field
                    label={formatMessage(MESSAGES.description)}
                    name="description"
                    component={TextInput}
                    sx={{ mx: 0, my: 1 }}
                />

                <MissionsTitle />
                {missionType === MissionTypeDa2Enum.enum.FORM_FILLING && (
                    <FormsChip />
                )}
                {missionType === MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM && (
                    <OrgUnitAndFormChip />
                )}
                {missionType === MissionTypeDa2Enum.enum.ENTITY_AND_FORM && (
                    <EntityAndFormChip />
                )}

                {missionType === MissionTypeDa2Enum.enum.FORM_FILLING && (
                    <MissionFormsBaseInput formik={formik} />
                )}
                {missionType === MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM && (
                    <MissionOrgUnitTypeInput
                        formik={
                            formik as FormikProps<MissionOrgUnitTypeUpdateRequest>
                        }
                    />
                )}
                {missionType === MissionTypeDa2Enum.enum.ENTITY_AND_FORM && (
                    <MissionEntityTypeInput
                        formik={
                            formik as FormikProps<MissionEntityTypeUpdateRequest>
                        }
                    />
                )}
            </Box>
        </>
    );
};
