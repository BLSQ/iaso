import React, { FunctionComponent } from 'react';
import { Alert } from '@mui/material';
import { useSafeIntl, useRedirectTo } from 'bluesquare-components';
import { useFormik, FormikProvider } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionTypeDropdownValueEnum,
    useApiMicroplanningMissionsCreate,
} from 'Iaso/api/missions';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import { CreateMissionForm } from './components/CreateMissionForm';
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
            <MainWrapper sx={{ p: 4 }}>
                <FormikProvider value={formik}>
                    {formik.status && (
                        <Alert severity={'error'} sx={{ mb: 2 }}>
                            {formik.status}
                        </Alert>
                    )}
                    <CreateMissionForm
                        formik={formik}
                        allowConfirm={allowConfirm}
                        cancelUrl={`/${baseUrls.missions}/`}
                        successButtonMessage={formatMessage(MESSAGES.create)}
                    />
                </FormikProvider>
            </MainWrapper>
        </>
    );
};
