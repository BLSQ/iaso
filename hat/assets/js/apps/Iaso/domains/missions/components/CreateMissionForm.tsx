import React, { FunctionComponent } from 'react';
import { Alert, Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import {
    MissionEntityTypeCreateRequest,
    MissionOrgUnitTypeCreateRequest,
    MissionTypeDropdownValueEnum,
} from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { MissionEntityTypeInput } from 'Iaso/domains/missions/components/forms/MissionEntityTypeInput';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { MissionOrgUnitTypeInput } from 'Iaso/domains/missions/components/forms/MissionOrgUnitTypeInput';
import { MissionTypeDropdownInput } from 'Iaso/domains/missions/components/MissionTypeDropdownInput';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import MESSAGES from '../messages';

type CreateMissionFormProps = {
    formik: FormikProps<MissionCreateBody>;
};

export const CreateMissionForm: FunctionComponent<CreateMissionFormProps> = ({
    formik,
}) => {
    const { formatMessage } = useSafeIntl();

    const handleChangeMissionType = (_keyValue: string, _value: number) => {
        formik.setFieldValue('forms', []);
        formik.setFieldTouched('forms', false);

        ['org_unit_type', 'entity_type', 'max_cardinality'].forEach(f => {
            formik.setFieldValue(f, undefined);
            formik.setFieldTouched(f, false);
        });

        formik.setFieldValue('min_cardinality', 1);
        formik.setFieldTouched('min_cardinality', false);
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <WidgetPaper
                    title={formatMessage(MESSAGES.generalInfoTitle)}
                    sx={{ mb: 2 }}
                >
                    <Box m={2}>
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
                    </Box>
                </WidgetPaper>
            </Grid>
            <Grid item xs={12} md={9}>
                <WidgetPaper
                    title={formatMessage(MESSAGES.detailMissionLabel)}
                    sx={{ mb: 2 }}
                >
                    <Box sx={{ m: 2 }}>
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
                            MissionTypeDropdownValueEnum.enum
                                .ORG_UNIT_AND_FORM && (
                            <MissionOrgUnitTypeInput
                                formik={
                                    formik as FormikProps<MissionOrgUnitTypeCreateRequest>
                                }
                            />
                        )}
                        {formik.values?.mission_type ===
                            MissionTypeDropdownValueEnum.enum
                                .ENTITY_AND_FORM && (
                            <MissionEntityTypeInput
                                formik={
                                    formik as FormikProps<MissionEntityTypeCreateRequest>
                                }
                            />
                        )}
                    </Box>
                </WidgetPaper>
            </Grid>
        </Grid>
    );
};
