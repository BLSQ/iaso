import React from 'react';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import { Box } from '@mui/material';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import {
    MissionEntityTypeUpdateRequest,
    MissionFormUpdateRequest,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDropdownValueEnum,
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

type Base<T> = {
    formik: FormikProps<T>;
};

type EditMissionFormProps =
    | (Base<MissionOrgUnitTypeUpdateRequest> & {
          missionType: typeof MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM;
      })
    | (Base<MissionFormUpdateRequest> & {
          missionType: typeof MissionTypeDropdownValueEnum.enum.FORM_FILLING;
      })
    | (Base<MissionEntityTypeUpdateRequest> & {
          missionType: typeof MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM;
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

                <Typography
                    variant="body1"
                    sx={{
                        textTransform: 'uppercase',
                        mb: 2,
                        fontSize: '15px',
                        mt: 4,
                    }}
                >
                    <CrisisAlertIcon
                        color="primary"
                        sx={{
                            mr: 1,
                            fontSize: '15px',
                            position: 'relative',
                            top: '2px',
                        }}
                    />
                    {formatMessage(MESSAGES.missionType)}
                </Typography>
                {missionType ===
                    MissionTypeDropdownValueEnum.enum.FORM_FILLING && (
                    <FormsChip />
                )}
                {missionType ===
                    MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM && (
                    <OrgUnitAndFormChip />
                )}
                {missionType ===
                    MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM && (
                    <EntityAndFormChip />
                )}

                {missionType ===
                    MissionTypeDropdownValueEnum.enum.FORM_FILLING && (
                    <MissionFormsBaseInput formik={formik} />
                )}
                {missionType ===
                    MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM && (
                    <MissionOrgUnitTypeInput
                        formik={
                            formik as FormikProps<MissionOrgUnitTypeUpdateRequest>
                        }
                    />
                )}
                {missionType ===
                    MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM && (
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
