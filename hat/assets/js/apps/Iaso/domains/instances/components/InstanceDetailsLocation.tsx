import React from 'react';

import { useSafeIntl } from 'bluesquare-components';
import { MarkerMap } from '../../../components/maps/MarkerMapComponent';
import OrgUnitDisplay from '../../orgUnits/components/OrgUnitDisplay';
import { OrgUnitSourceRefDisplay } from '../../orgUnits/components/OrgUnitSourceRefDisplay';

import { getOrgUnitsTree } from '../../orgUnits/utils';

import { Instance } from '../types/instance';
import InstanceDetailsField from './InstanceDetailsField';

import { OrgUnitLabel } from '../../orgUnits/components/OrgUnitLabel';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import MESSAGES from '../messages';

type Props = {
    currentInstance: Instance;
};

const InstanceDetailsLocation: React.FunctionComponent<Props> = ({
    currentInstance,
}) => {
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
    const hasAccuracy = Boolean(accuracy);

    return (
        <>
            {orgUnitTree.map(ou => (
                <InstanceDetailsField
                    key={ou.id}
                    label={
                        ou.org_unit_type?.name ??
                        formatMessage(MESSAGES.noOrgUnitType)
                    }
                    valueTitle={<OrgUnitLabel orgUnit={ou} withType={false} />}
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
                            value={`${
                                currentInstance.org_unit.latitude
                            } ${formatMessage(MESSAGES.fromOrgUnit)}`}
                        />
                        <InstanceDetailsField
                            label={formatMessage(MESSAGES.longitude)}
                            value={`${
                                currentInstance.org_unit.longitude
                            } ${formatMessage(MESSAGES.fromOrgUnit)}`}
                        />
                    </>
                )}
            {hasCoordinatesFromForm && (
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
            {hasAltitudeFromForm && (
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.altitude)}
                    value={currentInstance.altitude}
                />
            )}
            {!hasAltitudeFromForm &&
                hasAltitudeFromOrgUnit &&
                !hasCoordinatesFromForm && (
                    <InstanceDetailsField
                        label={formatMessage(MESSAGES.altitude)}
                        value={`${orgUnit.altitude} ${formatMessage(
                            MESSAGES.fromOrgUnit,
                        )}`}
                    />
                )}
            {hasAccuracy && (
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.accuracy)}
                    value={currentInstance.accuracy}
                />
            )}

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
