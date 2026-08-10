import React from 'react';

import { useSafeIntl } from 'bluesquare-components';
import { MarkerMap } from '../../../components/maps/MarkerMapComponent';
import OrgUnitDisplay from '../../orgUnits/components/OrgUnitDisplay';
import { OrgUnitLabel } from '../../orgUnits/components/OrgUnitLabel';
import { OrgUnitSourceRefDisplay } from '../../orgUnits/components/OrgUnitSourceRefDisplay';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { getOrgUnitsTree } from '../../orgUnits/utils';

import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import InstanceDetailsField from './InstanceDetailsField';

type FieldComponentProps = {
    label: string;
    value?: any;
    valueTitle?: any;
};

type Props = {
    currentInstance: Instance;
    /**
     * How each location row is rendered. Defaults to InstanceDetailsField (the
     * legacy right-aligned-with-colon style used by the compare view); the
     * submission rail passes a design-matching row instead.
     */
    FieldComponent?: React.ComponentType<FieldComponentProps>;
    /** Height of the map. The narrow rail passes a shorter, landscape height. */
    mapHeight?: number;
};

const InstanceDetailsLocation: React.FunctionComponent<Props> = ({
    currentInstance,
    FieldComponent = InstanceDetailsField,
    mapHeight,
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
                <FieldComponent
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
                <FieldComponent
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
                <FieldComponent
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
                        <FieldComponent
                            label={formatMessage(MESSAGES.latitude)}
                            value={`${
                                currentInstance.org_unit.latitude
                            } ${formatMessage(MESSAGES.fromOrgUnit)}`}
                        />
                        <FieldComponent
                            label={formatMessage(MESSAGES.longitude)}
                            value={`${
                                currentInstance.org_unit.longitude
                            } ${formatMessage(MESSAGES.fromOrgUnit)}`}
                        />
                    </>
                )}
            {hasCoordinatesFromForm && (
                <>
                    <FieldComponent
                        label={formatMessage(MESSAGES.latitude)}
                        value={currentInstance.latitude}
                    />
                    <FieldComponent
                        label={formatMessage(MESSAGES.longitude)}
                        value={currentInstance.longitude}
                    />
                </>
            )}
            {hasAltitudeFromForm && (
                <FieldComponent
                    label={formatMessage(MESSAGES.altitude)}
                    value={currentInstance.altitude}
                />
            )}
            {!hasAltitudeFromForm &&
                hasAltitudeFromOrgUnit &&
                !hasCoordinatesFromForm && (
                    <FieldComponent
                        label={formatMessage(MESSAGES.altitude)}
                        value={`${orgUnit.altitude} ${formatMessage(
                            MESSAGES.fromOrgUnit,
                        )}`}
                    />
                )}
            {hasAccuracy && (
                <FieldComponent
                    label={formatMessage(MESSAGES.accuracy)}
                    value={currentInstance.accuracy}
                />
            )}

            {hasCoordinatesFromForm && (
                <MarkerMap
                    latitude={currentInstance.latitude}
                    longitude={currentInstance.longitude}
                    mapHeight={mapHeight}
                />
            )}

            {!hasCoordinatesFromForm &&
                orgUnit.latitude &&
                orgUnit.longitude && (
                    <MarkerMap
                        latitude={orgUnit.latitude}
                        longitude={orgUnit.longitude}
                        mapHeight={mapHeight}
                    />
                )}
        </>
    );
};

export default InstanceDetailsLocation;
