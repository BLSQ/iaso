import React from 'react';
import { Alert } from '@mui/material';
import { FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    MissionOrgUnitTypeRetrieve,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDropdownValueEnum,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions';
import { DetailsWrapper } from 'Iaso/domains/missions/components/DetailsWrapper';
import { EditMissionForm } from 'Iaso/domains/missions/components/EditMissionForm';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';

type EditBaseMissionFormProps = {
    data: MissionOrgUnitTypeRetrieve;
    missionId: number;
    save: ReturnType<typeof useApiMicroplanningMissionsUpdate>['mutateAsync'];
    redirectBackUrl: string;
};
export const EditBaseMissionOrgUnitType: React.FunctionComponent<
    EditBaseMissionFormProps
> = ({ data, missionId, save, redirectBackUrl }) => {
    const formik = useFormik<MissionOrgUnitTypeUpdateRequest>({
        validationSchema: toFormikValidationSchema(
            MissionOrgUnitTypeUpdateRequest,
        ),
        initialValues: {
            name: data.name,
            description: data?.description,
            min_cardinality: data.min_cardinality,
            max_cardinality: data?.max_cardinality,
            org_unit_type: data.org_unit_type.id,
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
                        MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM
                    }
                />
            </FormikProvider>
        </DetailsWrapper>
    );
};
