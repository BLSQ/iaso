import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import { LinkButton, useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import {
    MissionEntityTypeUpdateRequest,
    MissionFormUpdateRequest,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDropdownValueEnum,
} from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { MissionEntityTypeInput } from 'Iaso/domains/missions/components/forms/MissionEntityTypeInput';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { MissionOrgUnitTypeInput } from 'Iaso/domains/missions/components/forms/MissionOrgUnitTypeInput';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import MESSAGES from '../messages';

type Base<T> = {
    formik: FormikProps<T>;
    cancelUrl?: string;
    allowConfirm: boolean;
    successButtonMessage: string;
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
    cancelUrl,
    allowConfirm,
    formik,
    successButtonMessage,
    missionType,
}: EditMissionFormProps) => {
    const { formatMessage } = useSafeIntl();

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
                    </Box>
                </WidgetPaper>
            </Grid>
            <Grid item xs={12} md={9}>
                <WidgetPaper
                    title={formatMessage(MESSAGES.detailMissionLabel)}
                    sx={{ mb: 2 }}
                >
                    <Box sx={{ m: 2 }}>
                        {missionType ===
                            MissionTypeDropdownValueEnum.enum.FORM_FILLING && (
                            <MissionFormsBaseInput formik={formik} />
                        )}
                        {missionType ===
                            MissionTypeDropdownValueEnum.enum
                                .ORG_UNIT_AND_FORM && (
                            <MissionOrgUnitTypeInput
                                formik={
                                    formik as FormikProps<MissionOrgUnitTypeUpdateRequest>
                                }
                            />
                        )}
                        {missionType ===
                            MissionTypeDropdownValueEnum.enum
                                .ENTITY_AND_FORM && (
                            <MissionEntityTypeInput
                                formik={
                                    formik as FormikProps<MissionEntityTypeUpdateRequest>
                                }
                            />
                        )}
                    </Box>
                </WidgetPaper>
                <Box
                    sx={{
                        justifyContent: 'flex-end',
                        display: 'flex',
                    }}
                >
                    {cancelUrl && (
                        <LinkButton to={cancelUrl} color={'error'}>
                            {formatMessage(MESSAGES.cancel)}
                        </LinkButton>
                    )}
                    <Button
                        variant="contained"
                        type={'submit'}
                        color={'success'}
                        disabled={!allowConfirm}
                        sx={{ ml: 2 }}
                        onClick={() => allowConfirm && formik.handleSubmit()}
                    >
                        {successButtonMessage}
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
};
