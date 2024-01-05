import React from 'react';
import { makeStyles } from '@mui/styles';

import { useSafeIntl } from 'bluesquare-components';
import { MarkerMap } from '../../../components/maps/MarkerMapComponent';
import OrgUnitDisplay from '../../orgUnits/components/OrgUnitDisplay';
import OrgUnitSourceRefDisplay from '../../orgUnits/components/OrgUnitSourceRefDisplay';

import { getOrgUnitsTree, OrgUnitLabel } from '../../orgUnits/utils';

import InstanceDetailsField from './InstanceDetailsField';
import { Instance } from '../types/instance';

import MESSAGES from '../messages';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { NumberCell } from '../../../components/Cells/NumberCell';

const useStyles = makeStyles(theme => ({
    infosContainer: {
        padding: theme.spacing(2),
    },
}));

type Props = {
    currentInstance: Instance;
};

const InstanceDetailsLocation: React.FunctionComponent<Props> = ({
    currentInstance,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const orgUnitTree: OrgUnit[] = currentInstance.org_unit
        ? getOrgUnitsTree(currentInstance.org_unit)
        : [];

    const {
        org_unit: orgUnit,
        latitude,
        longitude,
        altitude,
        accuracy,
    } = currentInstance;

    const hasCoordinatesFromOrgUnit = orgUnit.latitude && orgUnit.longitude;
    const hasCoordinatesFromForm = latitude && longitude;
    const hasAltitudeFromOrgUnit =
        orgUnit.altitude !== null && orgUnit.altitude !== 0;
    const hasAltitudeFromForm =
        !altitude || (altitude !== null && altitude !== 0);
    const hasAccuracy = accuracy;

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
                {orgUnit && (
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
                {orgUnit && orgUnit.groups && (
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
                {orgUnit &&
                    hasCoordinatesFromOrgUnit &&
                    !hasCoordinatesFromForm && (
                        <>
                            <InstanceDetailsField
                                label={formatMessage(MESSAGES.latitude)}
                                value={currentInstance.org_unit.latitude}
                                renderValue={value => {
                                    return (
                                        <span>
                                            <NumberCell value={value} />
                                            {` ${formatMessage(
                                                MESSAGES.fromOrgUnit,
                                            )}`}
                                        </span>
                                    );
                                }}
                            />
                            <InstanceDetailsField
                                label={formatMessage(MESSAGES.longitude)}
                                value={currentInstance.org_unit.longitude}
                                renderValue={value => {
                                    return (
                                        <span>
                                            <NumberCell value={value} />
                                            {` ${formatMessage(
                                                MESSAGES.fromOrgUnit,
                                            )}`}
                                        </span>
                                    );
                                }}
                            />
                        </>
                    )}
                {hasCoordinatesFromForm && (
                    <>
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.latitude)}
                            value={currentInstance.latitude}
                            renderValue={value => <NumberCell value={value} />}
                        />
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.longitude)}
                            value={currentInstance.longitude}
                            renderValue={value => <NumberCell value={value} />}
                        />
                    </>
                )}
                {hasAltitudeFromForm && (
                    <InstanceDetailsField
                        label={formatMessage(MESSAGES.altitude)}
                        value={currentInstance.altitude}
                        renderValue={value => <NumberCell value={value} />}
                    />
                )}
                {!hasAltitudeFromForm &&
                    hasAltitudeFromOrgUnit &&
                    !hasCoordinatesFromForm && (
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.altitude)}
                            value={orgUnit.altitude}
                            renderValue={value => {
                                return (
                                    <span>
                                        <NumberCell value={value} />
                                        {` ${formatMessage(
                                            MESSAGES.fromOrgUnit,
                                        )}`}
                                    </span>
                                );
                            }}
                        />
                    )}
                {hasAccuracy && (
                    <InstanceDetailsField
                        label={formatMessage(MESSAGES.accuracy)}
                        value={currentInstance.accuracy}
                        renderValue={value => <NumberCell value={value} />}
                    />
                )}
            </div>

            {hasCoordinatesFromForm && (
                <MarkerMap
                    latitude={currentInstance.latitude}
                    longitude={currentInstance.longitude}
                />
            )}

            {!hasCoordinatesFromForm &&
                orgUnit.latitude &&
                orgUnit.longitude && (
                    <MarkerMap
                        latitude={orgUnit.latitude}
                        longitude={orgUnit.longitude}
                    />
                )}
        </>
    );
};

export default InstanceDetailsLocation;
