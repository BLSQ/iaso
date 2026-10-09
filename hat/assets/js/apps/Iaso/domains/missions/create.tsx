import React, { FunctionComponent } from 'react';
import { SaveOutlined } from '@mui/icons-material';
import { Alert, Button, useMediaQuery, useTheme } from '@mui/material';
import { useSafeIntl, useRedirectTo, LinkButton } from 'bluesquare-components';
import { useFormik, FormikProvider } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionTypeDa2Enum,
    useApiMicroplanningMissionsCreate,
} from 'Iaso/api/missions';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import { CreateMissionForm } from './components/CreateMissionForm';
import { DetailsWrapper } from './components/DetailsWrapper';
import MESSAGES from './messages';

export const MissionCreate: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const redirectTo = useRedirectTo();

    const redirectBackUrl: string = `${baseUrls.missions}`;

    const { mutateAsync: create } = useApiMicroplanningMissionsCreate({
        mutation: {
            onSuccess: (variables, _data) => {
                redirectTo(`${baseUrls.missionsDetails}/id/${variables?.id}`);
            },
            meta: {
                ignoreErrorCodes: [400],
            },
        },
    });

    const formik = useFormik<MissionCreateBody>({
        validationSchema: toFormikValidationSchema(MissionCreateBody),
        initialValues: {
            name: '',
            mission_type: MissionTypeDa2Enum.enum.FORM_FILLING,
            forms: [],
        },
        validateOnBlur: true,
        enableReinitialize: true,
        validateOnMount: true,
        onSubmit: withFormikSubmitAsync(values => create({ data: values })),
    });

    const allowConfirm = formik.isValid && formik.dirty && !formik.isSubmitting;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.createMission)}
                goBack={() => redirectTo(redirectBackUrl)}
                displayBackButton
            />
            <DetailsWrapper
                title={formatMessage(MESSAGES.newMission)}
                actions={
                    <>
                        <LinkButton
                            to={`/${baseUrls.missions}/`}
                            color="primary"
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </LinkButton>
                        <Button
                            variant="contained"
                            type="submit"
                            color="primary"
                            disabled={!allowConfirm}
                            sx={{ ml: 2 }}
                            onClick={() =>
                                allowConfirm && formik.handleSubmit()
                            }
                            size={isMobile ? 'small' : 'medium'}
                        >
                            <SaveOutlined sx={{ mr: 1 }} />
                            {formatMessage(MESSAGES.create)}
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
                    <CreateMissionForm formik={formik} />
                </FormikProvider>
            </DetailsWrapper>
        </>
    );
};
