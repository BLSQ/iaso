
import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import MESSAGES from '../messages';
import { getOrgUnitParentsString } from '../utils';

import OrgUnitsSmallInfosRow from './OrgUnitsSmallInfosRow';

const OrgUnitsSmallInfos = ({ orgUnit, intl: { formatMessage } }) => (
    <>
        <OrgUnitsSmallInfosRow
            label="Id"
            value={`${orgUnit.id}`}
            isLarge={!orgUnit.parent}
        />
        {
            orgUnit.parent
            && (
                <OrgUnitsSmallInfosRow
                    label={formatMessage(MESSAGES.parents)}
                    value={getOrgUnitParentsString(orgUnit)}
                    isLarge={!orgUnit.parent}
                />
            )
        }
        {
            orgUnit.org_unit_type_name
            && (
                <OrgUnitsSmallInfosRow
                    label={formatMessage(MESSAGES.type)}
                    value={orgUnit.org_unit_type_name}
                    isLarge={!orgUnit.parent}
                />
            )
        }
    </>
);

OrgUnitsSmallInfos.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};


export default injectIntl(OrgUnitsSmallInfos);
