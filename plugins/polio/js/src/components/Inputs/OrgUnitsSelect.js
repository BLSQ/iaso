import React from 'react';
import { CircularProgress } from '@material-ui/core';
import PropTypes from 'prop-types';
import { useGetOrgUnit } from '../../hooks/useGetOrgUnits';
import { OrgUnitTreeviewModal } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';

export const OrgUnitsLevels = ({ field, form, label }) => {
    const { name } = field;
    const initialOrgUnitId = form.initialValues[name];

    const { data: initialOrgUnit, isLoading } = useGetOrgUnit(initialOrgUnitId);
    const { setFieldValue } = form;

    return (
        <>
            {isLoading && <CircularProgress />}
            <OrgUnitTreeviewModal
                // FIXME: OrgUnitTreeviewModal expect a translatable
                titleMessage={{ id: 'fake', defaultMessage: label }}
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
