import React from 'react';
import { CircularProgress } from '@material-ui/core';
import PropTypes from 'prop-types';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from 'Iaso/domains/orgUnits/components/TreeView/requests';

export const OrgUnitsLevels = ({ field, form, label }) => {
    const { name } = field;
    const {
        setFieldValue,
        touched,
        errors: formErrors,
        setFieldTouched,
    } = form;
    const initialOrgUnitId = form.initialValues[name];
    const errors = touched[name] && formErrors[name] ? [formErrors[name]] : [];
    const { data: initialOrgUnit, isLoading } = useGetOrgUnit(initialOrgUnitId);

    return (
        <>
            {isLoading && <CircularProgress />}
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
            />
        </>
    );
};

OrgUnitsLevels.propTypes = {
    field: PropTypes.shape({
        name: PropTypes.string,
    }).isRequired,
    form: PropTypes.shape({
        setFieldValue: PropTypes.func.isRequired,
        initialValues: PropTypes.object.isRequired,
        errors: PropTypes.object.isRequired,
        touched: PropTypes.object.isRequired,
        setFieldTouched: PropTypes.func.isRequired,
    }).isRequired,
    label: PropTypes.string.isRequired,
};
