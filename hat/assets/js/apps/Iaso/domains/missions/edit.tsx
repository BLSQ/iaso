import React, { FunctionComponent } from 'react';
import { Alert } from '@mui/material';
import {
    useSafeIntl,
    useRedirectTo,
    LoadingSpinner,
} from 'bluesquare-components';
import { useFormik, FormikProvider } from 'formik';
import zod from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionEntityTypeUpdateRequest,
    MissionFormUpdateRequest,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDropdownValueEnum,
    useApiMicroplanningMissionsRetrieve,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions';
import Page404 from 'Iaso/components/errors/Page404';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { EditMissionForm } from 'Iaso/domains/missions/components/EditMissionForm';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import MESSAGES from './messages';

export const MissionEdit: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    const params = useParamsObject(baseUrls.missionsEdit);
    const missionId = parseInt(params.id);

    const { data, isLoading } = useApiMicroplanningMissionsRetrieve(missionId);

    const redirectTo = useRedirectTo();
    const redirectBackUrl: string = `/${baseUrls.missionsDetails}/id/${missionId}/`;

    const { mutateAsync: save } = useApiMicroplanningMissionsUpdate({
        mutation: {
            onSuccess: (_variables, _data) => {
                redirectTo(redirectBackUrl);
            },
            meta: {
                ignoreErrorCodes: [400],
            },
        },
    });

    const schema = React.useMemo(() => {
        switch (data?.mission_type?.value) {
            case MissionTypeDropdownValueEnum.enum.FORM_FILLING:
                return MissionFormUpdateRequest;
            case MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM:
                return MissionOrgUnitTypeUpdateRequest;
            case MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM:
                return MissionEntityTypeUpdateRequest;
            default:
                return MissionFormUpdateRequest;
        }
    }, [data]);

    const formik = useFormik<zod.input<typeof schema>>({
        validationSchema: toFormikValidationSchema(schema),
        initialValues: {
            ...data,
            name: data?.name ?? '',
            forms:
                data?.forms?.map(f => ({
                    form: f.form,
                    min_cardinality: f.min_cardinality,
                    max_cardinality: f?.max_cardinality,
                })) ?? [],
        },
        validateOnBlur: true,
        enableReinitialize: true,
        onSubmit: withFormikSubmitAsync(values => save({ data: values })),
    });

    const allowConfirm = formik.isValid && formik.dirty && !formik.isSubmitting;

    if (isLoading) {
        return (
            <>
                <TopBar
                    title={formatMessage(MESSAGES.title)}
                    displayBackButton
                    goBack={() => redirectTo(redirectBackUrl)}
                />
                <LoadingSpinner />
            </>
        );
    }

    if (!data) {
        return <Page404 displayTopBar={true} />;
    }

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
                    <EditMissionForm
                        formik={formik}
                        allowConfirm={allowConfirm}
                        cancelUrl={redirectBackUrl}
                        successButtonMessage={formatMessage(MESSAGES.create)}
                    />
                </FormikProvider>
            </MainWrapper>
        </>
    );
};
