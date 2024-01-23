import React, {
    ReactElement,
    useMemo,
    useState,
    FunctionComponent,
} from 'react';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { Box } from '@mui/material';
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
import InstanceDetail from '../../../instances/compare/components/InstanceDetail';

export type NewOrgUnitField = {
    key: string;
    isChanged: boolean;
    isSelected: boolean;
    newValue: ReactElement | string;
    oldValue: ReactElement | string;
    label: string;
    removePadding?: boolean;
    order: number;
};

type UseNewFields = {
    newFields: NewOrgUnitField[];
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
};

type ReferenceInstancesProps = {
    instances: InstanceForChangeRequest[];
};

const ReferenceInstances: FunctionComponent<ReferenceInstancesProps> = ({
    instances,
}) => {
    return (
        <>
            {!instances || (instances.length === 0 && textPlaceholder)}
            {instances.map(instance => (
                <Box mb={1}>
                    <InstanceDetail
                        key={instance.id}
                        instanceId={`${instance.id}`}
                        minHeight="150px"
                        titleVariant="subtitle1"
                    />
                </Box>
            ))}
        </>
    );
};
const getGroupsValue = (groups: NestedGroup[]): ReactElement | string => {
    return groups && groups.length > 0
        ? groups.map(group => group.name).join(', ')
        : textPlaceholder;
};

const getLocationValue = (location: NestedLocation): ReactElement => {
    return (
        <MarkerMap
            longitude={location.longitude}
            latitude={location.latitude}
            maxZoom={8}
            mapHeight={300}
        />
    );
};

export const useNewFields = (
    changeRequest?: OrgUnitChangeRequestDetails,
): UseNewFields => {
    const { formatMessage } = useSafeIntl();
    const [fields, setFields] = useState<NewOrgUnitField[]>([]);

    useMemo(() => {
        if (!changeRequest) {
            setFields([]);
            return;
        }
        const orgUnit = changeRequest.org_unit;
        const newFields: NewOrgUnitField[] = [];
        Object.entries(changeRequest).forEach(([key, value]) => {
            let field: NewOrgUnitField | null = null;
            const originalKey = key.replace('new_', '');
            switch (key) {
                // case 'new_location_accuracy': Org unit does not have accuracy in his payload
                case 'new_name': {
                    const val = value as string | number | undefined;
                    const oldValue = orgUnit[originalKey]
                        ? orgUnit[originalKey]
                        : textPlaceholder;
                    field = {
                        key: originalKey,
                        label: formatMessage(MESSAGES.name),
                        isChanged: Boolean(value),
                        isSelected: false,
                        newValue: val ? (
                            <span>{val.toString()}</span>
                        ) : (
                            oldValue
                        ),
                        oldValue,
                        order: 1,
                    };
                    break;
                }
                case 'new_parent': {
                    const oldValue = orgUnit?.parent ? (
                        <LinkToOrgUnit orgUnit={orgUnit.parent} />
                    ) : (
                        textPlaceholder
                    );
                    field = {
                        key: originalKey,
                        label: formatMessage(MESSAGES.parent),
                        isChanged: Boolean(value),
                        isSelected: false,
                        newValue: value ? (
                            <LinkToOrgUnit orgUnit={value as ShortOrgUnit} />
                        ) : (
                            oldValue
                        ),
                        oldValue,
                        order: 3,
                    };
                    break;
                }
                case 'new_org_unit_type': {
                    const type = value as NestedOrgUnitType;
                    const oldValue = orgUnit.org_unit_type ? (
                        <span>{orgUnit.org_unit_type.short_name}</span>
                    ) : (
                        textPlaceholder
                    );
                    field = {
                        key: originalKey,
                        label: formatMessage(MESSAGES.orgUnitsType),
                        isChanged: Boolean(value),
                        isSelected: false,
                        newValue: type ? (
                            <span>{type.short_name}</span>
                        ) : (
                            textPlaceholder
                        ),
                        oldValue,
                        order: 2,
                    };
                    break;
                }
                case 'new_groups': {
                    const groups = value as NestedGroup[];
                    field = {
                        key: originalKey,
                        label: formatMessage(MESSAGES.groups),
                        isChanged: groups.length > 0,
                        isSelected: false,
                        newValue: (
                            <span>
                                {getGroupsValue(
                                    groups.length > 0 ? groups : orgUnit.groups,
                                )}
                            </span>
                        ),
                        oldValue: getGroupsValue(orgUnit.groups),

                        order: 4,
                    };

                    break;
                }
                case 'new_location': {
                    const location = value as NestedLocation | undefined;
                    const oldValue = orgUnit.location ? (
                        getLocationValue(orgUnit.location)
                    ) : (
                        <Box px="6px" py={2}>
                            {textPlaceholder}
                        </Box>
                    );
                    field = {
                        key: originalKey,
                        label: formatMessage(MESSAGES.location),
                        isChanged: Boolean(value),
                        isSelected: false,
                        newValue: location
                            ? getLocationValue(location)
                            : oldValue,
                        oldValue,
                        removePadding: true,
                        order: 5,
                    };
                    break;
                }
                case 'new_opening_date':
                case 'new_closed_date': {
                    const date = value as string | undefined;
                    const oldValue = orgUnit[originalKey]
                        ? moment(orgUnit[originalKey]).format('LTS')
                        : textPlaceholder;
                    field = {
                        key: originalKey,
                        label:
                            key === 'new_opening_date'
                                ? formatMessage(MESSAGES.openingDate)
                                : formatMessage(MESSAGES.closingDate),
                        isChanged: Boolean(value),
                        isSelected: false,
                        newValue: date ? (
                            <span>{moment(date).format('LTS')}</span>
                        ) : (
                            oldValue
                        ),
                        oldValue,
                        order: key === 'new_opening_date' ? 6 : 7,
                    };

                    break;
                }
                case 'new_reference_instances': {
                    const instances = value as InstanceForChangeRequest[];
                    field = {
                        key: originalKey,
                        label: formatMessage(
                            MESSAGES.multiReferenceInstancesLabel,
                        ),
                        isChanged: instances.length > 0,
                        isSelected: false,
                        newValue: (
                            <ReferenceInstances
                                instances={
                                    instances.length > 0
                                        ? instances
                                        : orgUnit.reference_instances
                                }
                            />
                        ),
                        oldValue: (
                            <ReferenceInstances
                                instances={orgUnit.reference_instances}
                            />
                        ),
                        removePadding: true,
                        order: 8,
                    };
                    break;
                }
                default:
                    break;
            }
            if (field !== null) {
                newFields.push(field);
            }
        });
        setFields(newFields);
    }, [changeRequest, formatMessage]);

    const setSelected: UseNewFields['setSelected'] = key => {
        setFields(currentFields =>
            currentFields.map(field =>
                field.key === key
                    ? { ...field, isSelected: !field.isSelected }
                    : field,
            ),
        );
    };

    return { newFields: fields, setSelected };
};
