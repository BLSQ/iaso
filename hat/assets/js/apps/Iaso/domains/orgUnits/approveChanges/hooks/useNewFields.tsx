import React, { ReactElement, useMemo } from 'react';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import {
    InstanceForChangeRequest,
    NestedGroup,
    NestedOrgUnitType,
    NestedLocation,
    OrgUnitChangeRequestDetails,
} from '../types';
import { MarkerMap } from '../../../../components/maps/MarkerMapComponent';
import { LinkToOrgUnit } from '../../components/LinkToOrgUnit';
import { ShortOrgUnit } from '../../types/orgUnit';
import MESSAGES from '../messages';

type NewField = {
    key: string;
    isChanged: boolean;
    newValue: ReactElement | string;
    oldValue: ReactElement | string;
    label: string;
};

const getReferenceInstancesValue = (
    instances: InstanceForChangeRequest[],
): ReactElement | string => {
    return instances && instances.length > 0
        ? instances.map(instance => instance.form_name).join(', ')
        : textPlaceholder;
};

const getGroupsValue = (groups: NestedGroup[]): ReactElement | string => {
    return groups && groups.length > 0
        ? groups.map(group => group.name).join(', ')
        : textPlaceholder;
};

const getLocationValue = (location: NestedLocation): ReactElement => {
    return (
        <MarkerMap
            longitude={location.latitude}
            latitude={location.longitude}
            maxZoom={8}
        />
    );
};

export const useNewFields = (
    changeRequest?: OrgUnitChangeRequestDetails,
): NewField[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        if (!changeRequest) return [];
        const orgUnit = changeRequest.org_unit;
        return Object.entries(changeRequest)
            .filter(([key]) => key.startsWith('new_'))
            .map(([key, value]) => {
                const originalKey = key.replace('_new', '');
                switch (key) {
                    case 'new_parent': {
                        const oldValue = orgUnit?.parent ? (
                            <LinkToOrgUnit orgUnit={orgUnit.parent} />
                        ) : (
                            textPlaceholder
                        );
                        return {
                            key: originalKey,
                            label: formatMessage(MESSAGES.parent),
                            isChanged: Boolean(value),
                            newValue: value ? (
                                <LinkToOrgUnit
                                    orgUnit={value as ShortOrgUnit}
                                />
                            ) : (
                                oldValue
                            ),
                            oldValue,
                        };
                    }
                    case 'new_org_unit_type': {
                        const type = value as NestedOrgUnitType;
                        const oldValue = orgUnit.org_unit_type
                            ? orgUnit.org_unit_type.short_name
                            : textPlaceholder;
                        return {
                            key: originalKey,
                            label: formatMessage(MESSAGES.orgUnitsType),
                            isChanged: Boolean(value),
                            newValue: type ? (
                                <span>{type.short_name}</span>
                            ) : (
                                oldValue
                            ),
                            oldValue,
                        };
                    }
                    case 'new_groups': {
                        const groups = value as NestedGroup[];
                        return {
                            key: originalKey,
                            label: formatMessage(MESSAGES.groups),
                            isChanged: groups.length > 0,
                            newValue: (
                                <span>
                                    {getGroupsValue(
                                        groups.length > 0
                                            ? groups
                                            : orgUnit.groups,
                                    )}
                                </span>
                            ),
                            oldValue: getGroupsValue(orgUnit.groups),
                        };
                    }
                    case 'new_location': {
                        const location = value as NestedLocation | undefined;
                        const oldValue = orgUnit.location
                            ? getLocationValue(orgUnit.location)
                            : textPlaceholder;
                        return {
                            key: originalKey,
                            label: formatMessage(MESSAGES.location),
                            isChanged: Boolean(value),
                            newValue: location
                                ? getLocationValue(location)
                                : oldValue,
                            oldValue,
                        };
                    }
                    case 'new_opening_date':
                    case 'new_closed_date': {
                        const date = value as string | undefined;
                        const oldValue = orgUnit[originalKey]
                            ? moment(orgUnit[originalKey]).format('LTS')
                            : textPlaceholder;
                        return {
                            key: originalKey,
                            label:
                                key === 'new_opening_date'
                                    ? formatMessage(MESSAGES.openingDate)
                                    : formatMessage(MESSAGES.closingDate),
                            isChanged: Boolean(value),
                            newValue: date ? (
                                <span>{moment(date).format('LTS')}</span>
                            ) : (
                                oldValue
                            ),
                            oldValue,
                        };
                    }
                    // case 'new_location_accuracy': Org unit does not have accuracy in his payload
                    case 'new_name': {
                        const val = value as string | number | undefined;
                        const oldValue = orgUnit[originalKey]
                            ? orgUnit[originalKey]
                            : textPlaceholder;
                        return {
                            key: originalKey,
                            label: formatMessage(MESSAGES.name),
                            isChanged: Boolean(value),
                            newValue: val ? (
                                <span>{val.toString()}</span>
                            ) : (
                                oldValue
                            ),
                            oldValue,
                        };
                    }
                    case 'new_reference_instances': {
                        const instances = value as InstanceForChangeRequest[];
                        return {
                            key: originalKey,
                            label: formatMessage(
                                MESSAGES.multiReferenceInstancesLabel,
                            ),
                            isChanged: instances.length > 0,
                            newValue: (
                                <span>
                                    {getReferenceInstancesValue(
                                        instances.length > 0
                                            ? instances
                                            : orgUnit.reference_instances,
                                    )}
                                </span>
                            ),
                            oldValue: getReferenceInstancesValue(
                                orgUnit.reference_instances,
                            ),
                        };
                    }
                    default:
                        return null;
                }
            })
            .filter(field => field !== null) as NewField[];
    }, [changeRequest, formatMessage]);
};
