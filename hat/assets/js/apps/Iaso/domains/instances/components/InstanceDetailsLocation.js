import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';

import { injectIntl } from 'bluesquare-components';
import { MarkerMap } from '../../../components/maps/MarkerMapComponent.tsx';
import OrgUnitDisplay from '../../orgUnits/components/OrgUnitDisplay';
import OrgUnitSourceRefDisplay from '../../orgUnits/components/OrgUnitSourceRefDisplay';

import { getOrgUnitsTree, OrgUnitLabel } from '../../orgUnits/utils';

import InstanceDetailsField from './InstanceDetailsField';

import MESSAGES from '../messages';

const styles = theme => ({
    infosContainer: {
        padding: theme.spacing(2),
    },
});

const InstanceDetailsLocation = ({
    currentInstance,
    intl: { formatMessage },
    classes,
}) => {
    let orgUnitTree = [];
    if (currentInstance.org_unit) {
        orgUnitTree = getOrgUnitsTree(currentInstance.org_unit);
    }

    return (
        <>
            <div className={classes.infosContainer}>
                {orgUnitTree.map(ou => (
                    <InstanceDetailsField
                        key={ou.id}
                        label={
                            ou.org_unit_type?.name ??
                            formatMessage(MESSAGES.noOrgUnitType)
                        }
                        valueTitle={
                            <OrgUnitLabel orgUnit={ou} withType={false} />
                        }
                        value={<OrgUnitDisplay orgUnit={ou} withType={false} />}
                    />
                ))}
                {currentInstance.org_unit && (
                    <InstanceDetailsField
                        label={formatMessage(MESSAGES.source_ref)}
                        valueTitle={
                            <OrgUnitLabel
                                orgUnit={currentInstance.org_unit}
                                withType={false}
                            />
                        }
                        value={
                            <OrgUnitSourceRefDisplay
                                orgUnit={currentInstance.org_unit}
                            />
                        }
                    />
                )}
                {currentInstance.org_unit &&
                    currentInstance.org_unit.groups && (
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.groups)}
                            value={
                                currentInstance.org_unit.groups.length > 0
                                    ? currentInstance.org_unit.groups
                                          .map(g => g.name)
                                          .join(', ')
                                    : null
                            }
                        />
                    )}
                {!currentInstance.latitude &&
                    !currentInstance.longitude &&
                    currentInstance.org_unit.latitude &&
                    currentInstance.org_unit.longitude && (
                        <>
                            <InstanceDetailsField
                                label={formatMessage(MESSAGES.latitude)}
                                value={currentInstance.org_unit.latitude}
                            />
                            <InstanceDetailsField
                                label={formatMessage(MESSAGES.longitude)}
                                value={currentInstance.org_unit.longitude}
                            />
                        </>
                    )}

                {currentInstance.latitude && currentInstance.longitude && (
                    <>
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.latitude)}
                            value={currentInstance.latitude}
                        />
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.longitude)}
                            value={currentInstance.longitude}
                        />
                    </>
                )}
                {currentInstance.altitude === 0 &&
                    currentInstance.org_unit &&
                    currentInstance.org_unit.altitude && (
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.altitude)}
                            value={currentInstance.org_unit.altitude}
                        />
                    )}
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.altitude)}
                    value={
                        currentInstance.altitude > 0 && currentInstance.altitude
                    }
                />
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.accuracy)}
                    value={currentInstance.accuracy}
                />
            </div>
            {currentInstance.latitude && currentInstance.longitude && (
                <MarkerMap
                    latitude={currentInstance.latitude}
                    longitude={currentInstance.longitude}
                />
            )}
            {!currentInstance.latitude &&
                !currentInstance.longitude &&
                currentInstance.org_unit.latitude &&
                currentInstance.org_unit.longitude && (
                    <MarkerMap
                        latitude={currentInstance.org_unit.latitude}
                        longitude={currentInstance.org_unitlongitude}
                    />
                )}
        </>
    );
};

InstanceDetailsLocation.propTypes = {
    classes: PropTypes.object.isRequired,
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};
export default withStyles(styles)(injectIntl(InstanceDetailsLocation));
