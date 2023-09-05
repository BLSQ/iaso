import React, { FunctionComponent } from 'react';
import { FormikProps, FieldInputProps } from 'formik';
import { CircularProgress, Box } from '@material-ui/core';
import { useGetOrgUnit } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/components/TreeView/requests';
import { OrgUnitTreeviewModal } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { isTouched } from '../../utils';

type Props = {
    field: FieldInputProps<string>;
    form: FormikProps<Record<string, any>>;
    label: string;
    required?: boolean;
    clearable?: boolean;
    errors?: string[];
};

const getErrors = (touched, formErrors, name) => {
    return isTouched(touched) && formErrors?.[name] ? [formErrors[name]] : [];
};

export const OrgUnitsLevels: FunctionComponent<Props> = ({
    field,
    form,
    label,
    required = false,
    clearable = true,
    errors: backendErrors = undefined,
}) => {
    const { name } = field;
    const {
        setFieldValue,
        touched,
        errors: formErrors,
        setFieldTouched,
        values,
    } = form;
    const initialOrgUnitId = values[name];
    const errors = backendErrors ?? getErrors(touched, formErrors, name);
    const { data: initialOrgUnit, isLoading } = useGetOrgUnit(initialOrgUnitId);

    return (
        <Box position="relative">
            <OrgUnitTreeviewModal
                titleMessage={label}
                toggleOnLabelClick={false}
                onConfirm={orgUnit => {
                    setFieldTouched(name, true);
                    setFieldValue(name, orgUnit?.id);
                }}
                initialSelection={initialOrgUnit}
                showStatusIconInTree={false}
                showStatusIconInPicker={false}
                errors={errors}
                required={required}
                clearable={clearable}
            />
            {isLoading && (
                <Box
                    display="flex"
                    justifyContent="center"
                    position="absolute"
                    width="100%"
                    height="100%"
                    alignItems="center"
                    top="0"
                    left="0"
                >
                    <CircularProgress size={20} />
                </Box>
            )}
        </Box>
    );
};
