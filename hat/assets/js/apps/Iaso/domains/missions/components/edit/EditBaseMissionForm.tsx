import React from 'react';
import { Alert } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionFormRetrieve,
    MissionFormUpdateRequest,
    MissionTypeDropdownValueEnum,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions';
import { EditMissionForm } from 'Iaso/domains/missions/components/EditMissionForm';
import MESSAGES from 'Iaso/domains/missions/messages';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';

type EditBaseMissionFormProps = {
    data: MissionFormRetrieve;
    missionId: number;
    save: ReturnType<typeof useApiMicroplanningMissionsUpdate>['mutateAsync'];
    redirectBackUrl: string;
};
export const EditBaseMissionForm: React.FunctionComponent<
    EditBaseMissionFormProps
> = ({ data, missionId, save, redirectBackUrl }) => {
    const { formatMessage } = useSafeIntl();
    const formik = useFormik<MissionFormUpdateRequest>({
        validationSchema: toFormikValidationSchema(MissionFormUpdateRequest),
        initialValues: {
            name: data.name,
            description: data?.description,
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
                successButtonMessage={formatMessage(MESSAGES.save)}
                missionType={MissionTypeDropdownValueEnum.enum.FORM_FILLING}
            />
        </FormikProvider>
    );
};
