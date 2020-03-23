import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import {
    withStyles,
} from '@material-ui/core';


import MarkerMap from '../../../components/maps/MarkerMapComponent';
import OrgUnitDisplay from '../../orgUnits/components/OrgUnitDisplay';

import { getOrgUnitsTree, getOrgunitMessage } from '../../orgUnits/utils';

import InstanceDetailsField from './InstanceDetailsField';

import { INSTANCE_METAS_FIELDS } from '../constants';
import MESSAGES from '../messages';

const styles = theme => ({
    infosContainer: {
        padding: theme.spacing(2),
    },
});


const InstanceDetailsInfos = ({
    currentInstance,
    intl: {
        formatMessage,
    },
    classes,
}) => {
    const fields = INSTANCE_METAS_FIELDS.filter(f => f.type === 'location');
    let orgUnitTree = [];
    if (currentInstance.org_unit) {
        orgUnitTree = getOrgUnitsTree(currentInstance.org_unit);
    }
    return (
        <>
            <div className={classes.infosContainer}>
                {
                    orgUnitTree.map(ou => (
                        <InstanceDetailsField
                            key={ou.id}
                            label={ou.org_unit_type.name}
                            valueTitle={getOrgunitMessage(ou, false)}
                            value={<OrgUnitDisplay orgUnit={ou} withType={false} />}
                        />
                    ))
                }
                {
                    fields.map((f) => {
                        if (f.key !== 'org_unit') {
                            return (
                                <InstanceDetailsField
                                    key={f.key}
                                    label={formatMessage(MESSAGES[f.key])}
                                    valueTitle={f.title ? f.title(currentInstance[f.key]) : null}
                                    value={f.render ? f.render(currentInstance[f.key]) : currentInstance[f.key]}
                                />
                            );
                        }
                        return null;
                    })
                }
            </div>
            {
                currentInstance.latitude
                && currentInstance.longitude
                && (
                    <MarkerMap latitude={currentInstance.latitude} longitude={currentInstance.longitude} />
                )
            }
        </>
    );
};


InstanceDetailsInfos.propTypes = {
    classes: PropTypes.object.isRequired,
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};
export default withStyles(styles)(injectIntl(InstanceDetailsInfos));
