import React, { FunctionComponent } from 'react';
import { Alert } from '@mui/material';
import { useSafeIntl, useRedirectTo } from 'bluesquare-components';
import { useFormik, FormikProvider } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    ApiMicroplanningMissionsCreateBody,
    useApiMicroplanningMissionsCreate,
} from 'Iaso/api/missions';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import { CreateEditMissionForm } from './components/CreateEditMissionForm';
import MESSAGES from './messages';

export const MissionCreate: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    // const currentUser = useCurrentUser();

    // const initialData = React.useMemo(() => {
    //     if (!data) return { name: '' }; // just for TS compliance as name is required
    //
    //     const { id: _id, created_at: _createdAt, ...rest } = data;
    //     return {
    //         ...rest,
    //         feature_flags: rest?.feature_flags?.map(({ code }) => code),
    //     };
    // }, [data]);
    const redirectTo = useRedirectTo();

    const redirectBackUrl: string = `${baseUrls.missionsDetails}/id/`;

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

    const formik = useFormik<ApiMicroplanningMissionsCreateBody>({
        validationSchema: toFormikValidationSchema(
            ApiMicroplanningMissionsCreateBody,
        ),
        initialValues: {},
        validateOnBlur: true,
        enableReinitialize: true,
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
            <MainWrapper sx={{ p: 4 }}>
                <FormikProvider value={formik}>
                    {formik.status && (
                        <Alert severity={'error'} sx={{ mb: 2 }}>
                            {formik.status}
                        </Alert>
                    )}
                    <CreateEditMissionForm
                        formik={formik}
                        allowConfirm={allowConfirm}
                        cancelUrl={baseUrls.missions}
                        successButtonMessage={formatMessage(MESSAGES.create)}
                    />
                </FormikProvider>
            </MainWrapper>
        </>
    );
};
