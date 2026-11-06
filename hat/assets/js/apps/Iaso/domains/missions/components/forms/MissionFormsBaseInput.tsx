import React, { FC } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FieldArray } from 'formik';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { FORMS_SECTION_MESSAGES } from '../../constants';
import { MissionFormsFieldArray } from './MissionFormsFieldArray';
import { MissionStepHeader } from './MissionStepHeader';

type Props = {
    params?: UseGetFormsDropdownParams;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
    missionType: MissionTypeDa2Enum;
    step?: number;
};

export const MissionFormsBaseInput: FC<Props> = ({
    params,
    formSelectProps,
    missionType,
    step,
}) => {
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
                        formSelectProps={formSelectProps}
                        arrayHelpers={arrayHelpers}
                        missionType={missionType}
                    />
                )}
            />
        </>
    );
};
