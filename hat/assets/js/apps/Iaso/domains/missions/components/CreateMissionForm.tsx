import React, { FunctionComponent, useCallback } from 'react';
import { Alert, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import {
    MissionEntityTypeCreateRequest,
    MissionOrgUnitTypeCreateRequest,
    MissionTypeDropdownValueEnum,
} from 'Iaso/api/missions';
import { MissionEntityTypeInput } from 'Iaso/domains/missions/components/forms/MissionEntityTypeInput';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { MissionOrgUnitTypeInput } from 'Iaso/domains/missions/components/forms/MissionOrgUnitTypeInput';
import { MissionTypeDropdownInput } from 'Iaso/domains/missions/components/MissionTypeDropdownInput';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import MESSAGES from '../messages';
import { InfosTitle } from './details/InfosTitle';
import { MissionsTitle } from './details/MissionsTitle';

type CreateMissionFormProps = {
    formik: FormikProps<MissionCreateBody>;
};

export const CreateMissionForm: FunctionComponent<CreateMissionFormProps> = ({
    formik,
}) => {
    const { formatMessage } = useSafeIntl();

    const handleChangeMissionType = useCallback(
        (_keyValue: string, _value: number) => {
            formik.setFieldValue('forms', []);
            formik.setFieldTouched('forms', false);

            ['org_unit_type', 'entity_type', 'max_cardinality'].forEach(f => {
                formik.setFieldValue(f, undefined);
                formik.setFieldTouched(f, false);
            });

            formik.setFieldValue('min_cardinality', 1);
            formik.setFieldTouched('min_cardinality', false);
        },
        [formik],
    );

    return (
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
            <Field
                label={formatMessage(MESSAGES.missionType)}
                name={'mission_type'}
                component={MissionTypeDropdownInput}
                onChange={handleChangeMissionType}
                required
                clearable={false}
                withMarginTop
                sx={{ mx: 0, my: 1 }}
            />
            {!formik.values?.mission_type && (
                <Alert severity={'info'}>
                    {formatMessage(MESSAGES.alertSelectMissionType)}
                </Alert>
            )}
            {formik.values?.mission_type ===
                MissionTypeDropdownValueEnum.enum.FORM_FILLING && (
                <MissionFormsBaseInput formik={formik} />
            )}
            {formik.values?.mission_type ===
                MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM && (
                <MissionOrgUnitTypeInput
                    formik={
                        formik as FormikProps<MissionOrgUnitTypeCreateRequest>
                    }
                />
            )}
            {formik.values?.mission_type ===
                MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM && (
                <MissionEntityTypeInput
                    formik={
                        formik as FormikProps<MissionEntityTypeCreateRequest>
                    }
                />
            )}
        </Box>
    );
};
