import React from 'react';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FieldArray } from 'formik';
import { FormikProps } from 'formik/dist/types';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import MESSAGES from '../../messages';
import { MissionFormsFieldArray } from './MissionFormsFieldArray';

type MissionFormsInput<TSchema> = {
    params?: UseGetFormsDropdownParams;
    formik: FormikProps<TSchema>;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
};

export const MissionFormsBaseInput = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    params,
    formik,
    formSelectProps,
}: MissionFormsInput<TSchema>) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Typography variant="body2" fontWeight="bold" mb={1}>
                {formatMessage(MESSAGES.forms)}
            </Typography>
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
