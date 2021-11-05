import React from 'react';
import { CircularProgress } from '@material-ui/core';
import PropTypes from 'prop-types';
import { OrgUnitTreeviewModal } from 'iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from 'iaso/domains/orgUnits/components/TreeView/requests';

export const OrgUnitsLevels = ({ field, form, label }) => {
    const { name } = field;
    const initialOrgUnitId = form.initialValues[name];

    const { data: initialOrgUnit, isLoading } = useGetOrgUnit(initialOrgUnitId);
    const { setFieldValue } = form;

    return (
        <>
            {isLoading && <CircularProgress />}
            <OrgUnitTreeviewModal
                titleMessage={label}
                toggleOnLabelClick={false}
                onConfirm={orgUnit => {
                    setFieldValue(name, orgUnit.id);
                }}
                initialSelection={initialOrgUnit}
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
    }).isRequired,
    label: PropTypes.string.isRequired,
};
