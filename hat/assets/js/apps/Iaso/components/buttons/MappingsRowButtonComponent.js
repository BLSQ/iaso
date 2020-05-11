import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import DHIS2Svg from '../svg/DHIS2SvgComponent';
import RowButtonComponent from './RowButtonComponent';

const MappingsRowButtonComponent = ({ formId }) => {
    const url = `/forms/mappings/formId/${formId}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`;
    return (
        <RowButtonComponent
            tooltipMessage={{
                id: 'iaso.label.dhis2Mappings',
                defaultMessage: 'DHIS mappings',
            }}
        >
            <Link to={url}>
                <DHIS2Svg />
            </Link>
        </RowButtonComponent>
    );
};
MappingsRowButtonComponent.propTypes = {
    formId: PropTypes.func.isRequired,
};
export default MappingsRowButtonComponent;
