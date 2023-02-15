import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';

import { injectIntl } from 'bluesquare-components';
import { MarkerMap } from '../../../components/maps/MarkerMapComponent.tsx';
import OrgUnitDisplay from '../../orgUnits/components/OrgUnitDisplay';
import OrgUnitSourceRefDisplay from '../../orgUnits/components/OrgUnitSourceRefDisplay';

import { getOrgUnitsTree, OrgUnitLabel } from '../../orgUnits/utils';

import InstanceDetailsField from './InstanceDetailsField';

import { INSTANCE_METAS_FIELDS } from '../constants';
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
    const fields = INSTANCE_METAS_FIELDS.filter(f => f.type === 'location');
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
                {fields.map(f => {
                    if (f.key !== 'org_unit') {
                        return (
                            <InstanceDetailsField
                                key={f.key}
                                label={formatMessage(MESSAGES[f.key])}
                                valueTitle={
                                    f.title
                                        ? f.title(currentInstance[f.key])
                                        : null
                                }
                                value={
                                    f.render
                                        ? f.render(currentInstance[f.key])
                                        : currentInstance[f.key]
                                }
                            />
                        );
                    }

                    return null;
                })}
            </div>
            {currentInstance.latitude && currentInstance.longitude && (
                <MarkerMap
                    latitude={currentInstance.latitude}
                    longitude={currentInstance.longitude}
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
