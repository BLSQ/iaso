import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FieldArray } from 'formik';
import { FormikProps } from 'formik/dist/types';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import MESSAGES from '../../messages';
import { MissionFormsFieldArray } from './MissionFormsFieldArray';
import { MissionStepHeader } from './MissionStepHeader';

type MissionFormsInput<TSchema> = {
    params?: UseGetFormsDropdownParams;
    formik: FormikProps<TSchema>;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
    title?: string;
    description?: string;
    step?: number;
};

export const MissionFormsBaseInput = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    params,
    formik,
    formSelectProps,
    title,
    description,
    step,
}: MissionFormsInput<TSchema>) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <MissionStepHeader
                title={title ?? formatMessage(MESSAGES.forms)}
                description={description ?? formatMessage(MESSAGES.formInfo)}
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
                    />
                )}
            />
        </>
    );
};
