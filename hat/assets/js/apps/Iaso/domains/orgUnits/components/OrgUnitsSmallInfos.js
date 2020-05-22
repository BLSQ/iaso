
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
                    label={formatMessage(MESSAGES.parentsMulti)}
                    value={getOrgUnitParentsString(orgUnit)}
                />
            )
        }
        {
            orgUnit.org_unit_type_name
            && (
                <OrgUnitsSmallInfosRow
                    label={formatMessage(MESSAGES.type)}
                    value={orgUnit.org_unit_type_name}
                />
            )
        }
        {
            orgUnit.source
            && (
                <OrgUnitsSmallInfosRow
                    label={formatMessage(MESSAGES.source)}
                    value={orgUnit.source}
                />
            )
        }
        {

            orgUnit.source_ref
            && (
                <OrgUnitsSmallInfosRow
                    label={formatMessage(MESSAGES.sourceRef)}
                    value={orgUnit.source_ref}
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
