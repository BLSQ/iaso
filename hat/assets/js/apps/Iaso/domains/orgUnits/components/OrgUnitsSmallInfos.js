import React from 'react';
import PropTypes from 'prop-types';

import MESSAGES from '../messages';
import {
    getOrgUnitParentsString,
    getStatusMessage,
    getOrgUnitGroups,
} from '../utils';

import OrgUnitsSmallInfosRow from './OrgUnitsSmallInfosRow';
import injectIntl from '../../../libs/intl/injectIntl';

const OrgUnitsSmallInfos = ({ orgUnit, intl: { formatMessage } }) => (
    <>
        <OrgUnitsSmallInfosRow
            label="Id"
            value={`${orgUnit.id}`}
            isLarge={!orgUnit.parent}
        />
        {orgUnit.parent && (
            <OrgUnitsSmallInfosRow
                label={formatMessage(MESSAGES.parentsMulti)}
                value={getOrgUnitParentsString(orgUnit)}
            />
        )}
        {orgUnit.org_unit_type_name && (
            <OrgUnitsSmallInfosRow
                label={formatMessage(MESSAGES.type)}
                value={orgUnit.org_unit_type_name}
            />
        )}
        {orgUnit.source && (
            <OrgUnitsSmallInfosRow
                label={formatMessage(MESSAGES.source)}
                value={orgUnit.source}
            />
        )}
        {orgUnit.source_ref && (
            <OrgUnitsSmallInfosRow
                label={formatMessage(MESSAGES.sourceRef)}
                value={orgUnit.source_ref}
            />
        )}
        {orgUnit.groups && orgUnit.groups.length > 0 && (
            <OrgUnitsSmallInfosRow
                label={formatMessage(MESSAGES.groups)}
                value={getOrgUnitGroups(orgUnit)}
            />
        )}
        {orgUnit.validation_status && (
            <OrgUnitsSmallInfosRow
                label={formatMessage(MESSAGES.status)}
                value={getStatusMessage(
                    orgUnit.validation_status,
                    formatMessage,
                )}
            />
        )}
    </>
);

OrgUnitsSmallInfos.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(OrgUnitsSmallInfos);
