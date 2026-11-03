import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FieldArray } from 'formik';
import { FormikProps } from 'formik/dist/types';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import { FORMS_SECTION_MESSAGES } from '../missionTypeOptions';
import { MissionFormsFieldArray } from './MissionFormsFieldArray';
import { MissionStepHeader } from './MissionStepHeader';

type MissionFormsInput<TSchema> = {
    params?: UseGetFormsDropdownParams;
    formik: FormikProps<TSchema>;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
    missionType: MissionTypeDa2Enum;
    step?: number;
};

export const MissionFormsBaseInput = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    params,
    formik,
    formSelectProps,
    missionType,
    step,
}: MissionFormsInput<TSchema>) => {
    const { formatMessage } = useSafeIntl();
    const { title, description } = FORMS_SECTION_MESSAGES[missionType];

    return (
        <>
            <MissionStepHeader
                title={formatMessage(title)}
                description={formatMessage(description)}
                step={step}
            />
            <FieldArray
                name="forms"
                render={arrayHelpers => (
                    <MissionFormsFieldArray
                        params={params}
                        formik={formik}
                        formSelectProps={formSelectProps}
                        arrayHelpers={arrayHelpers}
                        missionType={missionType}
                    />
                )}
            />
        </>
    );
};
