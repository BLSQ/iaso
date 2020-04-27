import React from 'react';
import PropTypes from 'prop-types';
import CallMergeIcon from '@material-ui/icons/CallMerge';

import RowButtonComponent from '../../../components/buttons/RowButtonComponent';

function GenerateDerivedInstancesRowButtonComponent({ onClick }) {
    return (
        <RowButtonComponent
            onClick={onClick}
            tooltipMessage={{ id: 'iaso.completeness.generateDerivedInstances', defaultMessage: 'Generate derived instances' }}
        >
            <CallMergeIcon />
        </RowButtonComponent>
    );
}
GenerateDerivedInstancesRowButtonComponent.propTypes = {
    onClick: PropTypes.func.isRequired,
};
export default GenerateDerivedInstancesRowButtonComponent;
