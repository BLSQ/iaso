import React, { FunctionComponent } from 'react';
import { Alert, Box, Button, Grid } from '@mui/material';
import { LinkButton, useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import { MissionTypeDropdownValueEnum } from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { MissionEntityTypeInput } from 'Iaso/domains/missions/components/forms/MissionEntityTypeInput';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { MissionOrgUnitTypeInput } from 'Iaso/domains/missions/components/forms/MissionOrgUnitTypeInput';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import MESSAGES from '../messages';

type EditMissionFormProps = {
    cancelUrl?: string;
    allowConfirm: boolean;
    formik: FormikProps<MissionCreateBody>;
    successButtonMessage: string;
};

export const EditMissionForm: FunctionComponent<EditMissionFormProps> = ({
    cancelUrl,
    allowConfirm,
    formik,
    successButtonMessage,
}) => {
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
                        {!formik.values?.mission_type && (
                            <Alert severity={'info'}>
                                {formatMessage(MESSAGES.alertSelectMissionType)}
                            </Alert>
                        )}
                        {formik.values?.mission_type ===
                            MissionTypeDropdownValueEnum.enum.FORM_FILLING && (
                            <MissionFormsBaseInput />
                        )}
                        {formik.values?.mission_type ===
                            MissionTypeDropdownValueEnum.enum
                                .ORG_UNIT_AND_FORM && (
                            <MissionOrgUnitTypeInput />
                        )}
                        {formik.values?.mission_type ===
                            MissionTypeDropdownValueEnum.enum
                                .ENTITY_AND_FORM && <MissionEntityTypeInput />}
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
