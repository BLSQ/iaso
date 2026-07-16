import React, { FunctionComponent } from 'react';
import { Alert } from '@mui/material';
import { useSafeIntl, useRedirectTo } from 'bluesquare-components';
import { useFormik, FormikProvider } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionTypeDropdownValueEnum,
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
            mission_type: MissionTypeDropdownValueEnum.enum.FORM_FILLING,
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
                allowConfirm={allowConfirm}
                cancelUrl={`/${baseUrls.missions}/`}
                handleSubmit={() => formik.handleSubmit()}
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
