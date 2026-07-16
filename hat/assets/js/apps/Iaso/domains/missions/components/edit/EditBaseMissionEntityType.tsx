import React from 'react';
import { Alert } from '@mui/material';
import { FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionEntityTypeRetrieve,
    MissionEntityTypeUpdateRequest,
    MissionTypeDropdownValueEnum,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions';
import { DetailsWrapper } from 'Iaso/domains/missions/components/DetailsWrapper';
import { EditMissionForm } from 'Iaso/domains/missions/components/EditMissionForm';
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
            cancelUrl={redirectBackUrl}
            allowConfirm={allowConfirm}
            title={data.name}
            handleSubmit={() => formik.handleSubmit()}
        >
            <FormikProvider value={formik}>
                {formik.status && (
                    <Alert severity={'error'} sx={{ mb: 2 }}>
                        {formik.status}
                    </Alert>
                )}
                <EditMissionForm
                    formik={formik}
                    missionType={
                        MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM
                    }
                />
            </FormikProvider>
        </DetailsWrapper>
    );
};
