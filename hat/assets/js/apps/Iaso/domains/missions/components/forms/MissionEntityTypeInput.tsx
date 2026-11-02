import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik/dist/types';
import {
    MissionEntityTypeUpdateRequest,
    MissionEntityTypeCreateRequest,
} from 'Iaso/api/missions';
import { useGetEntityTypesDropdown } from 'Iaso/domains/entities/hooks/requests';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import MESSAGES from '../../messages';
import { MissionCreatedTypeStep } from './MissionCreatedTypeStep';

type MissionEntityTypeInputProps<TSchema> = {
    formik: FormikProps<TSchema>;
};

export const MissionEntityTypeInput = <
    TSchema extends
        | MissionEntityTypeUpdateRequest
        | MissionEntityTypeCreateRequest,
>({
    formik,
}: MissionEntityTypeInputProps<TSchema>) => {
    const [params, setParams] = React.useState<UseGetFormsDropdownParams>();
    const [formInputDisabled, setFormInputDisabled] =
        React.useState<boolean>(false);
    const { data: entityTypesOptions, isLoading: isLoadingEntityTypeOptions } =
        useGetEntityTypesDropdown();

    const { formatMessage } = useSafeIntl();

    const { values } = formik;

    React.useEffect(() => {
        setFormInputDisabled(!values?.entity_type);
    }, [values]);

    React.useEffect(() => {
        if (values?.entity_type) {
            setParams({ params: { entity_type_ids: values?.entity_type } });
        } else {
            setParams({});
        }
    }, [values?.entity_type]);

    const handleEntityTypeChange = (_keyValue: string, _value: number) => {
        formik.setFieldValue('forms', []);
        formik.setFieldTouched('forms', false);
    };

    return (
        <>
            <MissionCreatedTypeStep
                title={formatMessage(MESSAGES.entitiesAgentCreates)}
                description={formatMessage(MESSAGES.entitiesAgentCreatesInfo)}
                typeFieldName="entity_type"
                typeLabel={formatMessage(MESSAGES.entityTypeToCreate)}
                typeOptions={entityTypesOptions}
                isLoadingTypeOptions={isLoadingEntityTypeOptions}
                onTypeChange={handleEntityTypeChange}
                minLabel={formatMessage(MESSAGES.minEntities)}
                maxLabel={formatMessage(MESSAGES.maxEntities)}
            />

            <MissionFormsBaseInput
                step={2}
                title={formatMessage(MESSAGES.formsOnCreatedEntity)}
                description={formatMessage(MESSAGES.formsOnCreatedEntityInfo)}
                minColumnLabel={formatMessage(MESSAGES.minPerEntity)}
                maxColumnLabel={formatMessage(MESSAGES.maxPerEntity)}
                params={params}
                formik={formik}
                formSelectProps={{
                    disabled: formInputDisabled,
                    helperText: formInputDisabled
                        ? formatMessage(MESSAGES.pleaseSelectEntityType)
                        : undefined,
                }}
            />
        </>
    );
};
