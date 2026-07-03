import React, { FunctionComponent } from 'react';
import { Alert, Box, Button, Grid } from '@mui/material';
import { LinkButton, useSafeIntl } from 'bluesquare-components';
import { Field, FormikProps } from 'formik';
import {
    ApiMicroplanningMissionsCreateBody,
    MissionTypeEnum,
} from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { MissionFormDetail } from 'Iaso/domains/missions/components/MissionFormDetail';
import { MissiongOrgUnitTypeDetail } from 'Iaso/domains/missions/components/MissiongOrgUnitTypeDetail';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import MESSAGES from '../messages';
import { MissionTypeDropdown } from './MissionTypeDropdown';

type CreateEditMissionFormProps = {
    cancelUrl?: string;
    allowConfirm: boolean;
    formik: FormikProps<ApiMicroplanningMissionsCreateBody>;
    successButtonMessage: string;
};
export const CreateEditMissionForm: FunctionComponent<
    CreateEditMissionFormProps
> = ({ cancelUrl, allowConfirm, formik, successButtonMessage }) => {
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
                            // margin={'normal'}
                            sx={{ mx: 0, my: 1 }}
                        />
                        <Field
                            label={formatMessage(MESSAGES.description)}
                            name="description"
                            component={TextInput}
                            // margin={'normal'}
                            sx={{ mx: 0, my: 1 }}
                        />
                        <Field
                            label={MESSAGES.missionType}
                            name={'mission_type'}
                            component={MissionTypeDropdown}
                            required
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
                            MissionTypeEnum.enum.FORM_FILLING && (
                            <MissionFormDetail />
                        )}
                        {formik.values?.mission_type ===
                            MissionTypeEnum.enum.ORG_UNIT_AND_FORM && (
                            <MissiongOrgUnitTypeDetail />
                        )}
                        {formik.values?.mission_type ===
                            MissionTypeEnum.enum.ENTITY_AND_FORM && (
                            <div>ENTITY_AND_FORM</div>
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
