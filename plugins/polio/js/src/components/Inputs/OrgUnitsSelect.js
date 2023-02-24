import React from 'react';
import { CircularProgress, Box } from '@material-ui/core';
import PropTypes from 'prop-types';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from 'Iaso/domains/orgUnits/components/TreeView/requests';
import { isTouched } from '../../utils';

const getErrors = (touched, formErrors) => {
    const { name } = formErrors;

    return isTouched(touched) && formErrors?.[name] ? [formErrors[name]] : [];
};

export const OrgUnitsLevels = ({
    field,
    form,
    label,
    required,
    clearable,
    errors: backendErrors,
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
    const errors = backendErrors ?? getErrors(touched, formErrors);
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

OrgUnitsLevels.defaultProps = {
    required: false,
    clearable: true,
    errors: undefined,
};

OrgUnitsLevels.propTypes = {
    field: PropTypes.shape({
        name: PropTypes.string,
    }).isRequired,
    form: PropTypes.shape({
        setFieldValue: PropTypes.func.isRequired,
        values: PropTypes.object.isRequired,
        errors: PropTypes.object,
        touched: PropTypes.object.isRequired,
        setFieldTouched: PropTypes.func.isRequired,
    }).isRequired,
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    clearable: PropTypes.bool,
    errors: PropTypes.arrayOf(PropTypes.string),
};
