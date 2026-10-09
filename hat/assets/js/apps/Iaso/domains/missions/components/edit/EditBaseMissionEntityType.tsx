import React from 'react';
import { SaveOutlined } from '@mui/icons-material';
import { Alert, Button, useMediaQuery, useTheme } from '@mui/material';
import { LinkButton, useSafeIntl } from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionEntityTypeRetrieve,
    MissionEntityTypeUpdateRequest,
    MissionTypeDa2Enum,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions';
import { DetailsWrapper } from 'Iaso/domains/missions/components/DetailsWrapper';
import { EditMissionForm } from 'Iaso/domains/missions/components/EditMissionForm';
import MESSAGES from 'Iaso/domains/missions/messages';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';

type EditBaseMissionFormProps = {
    data: MissionEntityTypeRetrieve;
    missionId: number;
    save: ReturnType<typeof useApiMicroplanningMissionsUpdate>['mutateAsync'];
    redirectBackUrl: string;
};
export const EditBaseMissionEntityType: React.FunctionComponent<
    EditBaseMissionFormProps
> = ({ data, missionId, save, redirectBackUrl }) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const formik = useFormik<MissionEntityTypeUpdateRequest>({
        validationSchema: toFormikValidationSchema(
            MissionEntityTypeUpdateRequest,
        ),
        initialValues: {
            name: data.name,
            description: data?.description,
            min_cardinality: data.min_cardinality,
            max_cardinality: data?.max_cardinality,
            entity_type: data.entity_type.id,
            forms:
                data?.forms?.map(f => ({
                    form: f.form,
                    min_cardinality: f.min_cardinality,
                    max_cardinality: f?.max_cardinality,
                })) ?? [],
        },
        validateOnBlur: true,
        validateOnMount: true,
        enableReinitialize: true,
        onSubmit: withFormikSubmitAsync(values =>
            save({ id: missionId, data: values }),
        ),
    });

    const allowConfirm = formik.isValid && formik.dirty && !formik.isSubmitting;
    return (
        <DetailsWrapper
            title={data.name}
            actions={
                <>
                    <LinkButton
                        to={redirectBackUrl}
                        size={isMobile ? 'small' : 'medium'}
                        color="primary"
                        variant="outlined"
                    >
                        {formatMessage(MESSAGES.cancel)}
                    </LinkButton>
                    <Button
                        variant="contained"
                        size={isMobile ? 'small' : 'medium'}
                        type="submit"
                        color="primary"
                        disabled={!allowConfirm}
                        sx={{ ml: 2 }}
                        onClick={() => allowConfirm && formik.handleSubmit()}
                    >
                        <SaveOutlined sx={{ mr: 1 }} />
                        {formatMessage(MESSAGES.save)}
                    </Button>
                </>
            }
        >
            <FormikProvider value={formik}>
                {formik.status && (
                    <Alert severity={'error'} sx={{ mb: 2 }}>
                        {formik.status}
                    </Alert>
                )}
                <EditMissionForm
                    formik={formik}
                    missionType={MissionTypeDa2Enum.enum.ENTITY_AND_FORM}
                />
            </FormikProvider>
        </DetailsWrapper>
    );
};
