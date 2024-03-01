import React, {
    ReactElement,
    useMemo,
    useState,
    FunctionComponent,
    useCallback,
    useEffect,
} from 'react';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import orderBy from 'lodash/orderBy';
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
import MESSAGES from '../messages';
import InstanceDetail from '../../../instances/compare/components/InstanceDetail';
import { ShortOrgUnit } from '../../types/orgUnit';
import { Nullable, Optional } from '../../../../types/utils';

export type NewOrgUnitField = {
    key: string;
    isChanged: boolean;
    isSelected: boolean;
    newValue: ReactElement | Optional<Nullable<string>>;
    oldValue: ReactElement | Optional<Nullable<string>>;
    label: string;
    order: number;
};
type FieldDefinition = {
    label: string;
    order: number;
    formatValue: (
        // eslint-disable-next-line no-unused-vars
        val: any,
        // eslint-disable-next-line no-unused-vars
        isOld: boolean,
    ) => ReactElement | Optional<Nullable<string>>;
};

type FieldDefinitions = Record<string, FieldDefinition>;

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
                <Box mb={1} key={instance.id}>
                    <InstanceDetail
                        instanceId={`${instance.id}`}
                        height="150px"
                        titleVariant="subtitle2"
                    />
                </Box>
            ))}
        </>
    );
};
const getGroupsValue = (groups: NestedGroup[]): ReactElement => {
    return (
        <>
            {groups && groups.length > 0
                ? groups.map(group => group.name).join(', ')
                : textPlaceholder}
        </>
    );
};

const getLocationValue = (
    location: NestedLocation,
    changeRequest: OrgUnitChangeRequestDetails,
    isOld: boolean,
): ReactElement => {
    const parent =
        !isOld && Boolean(changeRequest?.new_parent)
            ? changeRequest?.new_parent
            : changeRequest?.old_parent;
    return (
        <MarkerMap
            longitude={location.longitude}
            latitude={location.latitude}
            maxZoom={8}
            mapHeight={300}
            parent={parent}
        />
    );
};
export const useNewFields = (
    changeRequest?: OrgUnitChangeRequestDetails,
): UseNewFields => {
    const { formatMessage } = useSafeIntl();
    const [fields, setFields] = useState<NewOrgUnitField[]>([]);
    const fieldDefinitions: FieldDefinitions = useMemo(
        () => ({
            new_name: {
                label: formatMessage(MESSAGES.name),
                order: 1,
                formatValue: val => val,
                // formatValue: val => <span>{val.toString()}</span>,
            },
            new_org_unit_type: {
                label: formatMessage(MESSAGES.orgUnitsType),
                order: 2,
                formatValue: val => (val as NestedOrgUnitType)?.short_name,
                // formatValue: val => (
                //     <span>{(val as NestedOrgUnitType).short_name}</span>
                // ),
            },
            new_parent: {
                label: formatMessage(MESSAGES.parent),
                order: 3,
                formatValue: val => (
                    <LinkToOrgUnit orgUnit={val as ShortOrgUnit} />
                ),
            },
            new_groups: {
                label: formatMessage(MESSAGES.groups),
                order: 4,
                formatValue: val => (
                    <span>{getGroupsValue(val as NestedGroup[])}</span>
                ),
            },
            new_location: {
                label: formatMessage(MESSAGES.location),
                order: 5,
                formatValue: (val, isOld) =>
                    changeRequest ? (
                        getLocationValue(
                            val as NestedLocation,
                            changeRequest,
                            isOld,
                        )
                    ) : (
                        <></>
                    ),
            },
            new_opening_date: {
                label: formatMessage(MESSAGES.openingDate),
                order: 6,
                formatValue: val => <span>{moment(val).format('L')}</span>,
            },
            new_closed_date: {
                label: formatMessage(MESSAGES.closingDate),
                order: 7,
                formatValue: val => <span>{moment(val).format('L')}</span>,
            },
            new_reference_instances: {
                label: formatMessage(MESSAGES.multiReferenceInstancesLabel),
                order: 8,
                formatValue: val => (
                    <ReferenceInstances
                        instances={val as InstanceForChangeRequest[]}
                    />
                ),
            },
        }),
        [changeRequest, formatMessage],
    );
    const getValues = useCallback(
        (
            key: string,
            value: any,
        ): {
            oldValue: ReactElement | Optional<Nullable<string>>;
            newValue: ReactElement | Optional<Nullable<string>>;
            isChanged: boolean;
        } => {
            const fieldDef = fieldDefinitions[`new_${key}`];
            let oldValue: ReactElement | Optional<Nullable<string>> = (
                <>{textPlaceholder}</>
            );
            let newValue: ReactElement | Optional<Nullable<string>> = (
                <>{textPlaceholder}</>
            );
            const isChanged = Array.isArray(value)
                ? value.length > 0
                : Boolean(value);
            if (changeRequest) {
                if (isChanged && changeRequest[`new_${key}`]) {
                    newValue = fieldDef.formatValue(
                        changeRequest[`new_${key}`],
                        false,
                    );
                }
                if (changeRequest[`old_${key}`]) {
                    oldValue = fieldDef.formatValue(
                        changeRequest[`old_${key}`],
                        true,
                    );
                    if (!isChanged) {
                        newValue = fieldDef.formatValue(
                            changeRequest[`old_${key}`],
                            false,
                        );
                    }
                }
            }

            return {
                oldValue,
                newValue,
                isChanged,
            };
        },
        [changeRequest, fieldDefinitions],
    );
    useEffect(() => {
        if (!changeRequest) {
            setFields([]);
            return;
        }
        const newFields = orderBy(
            Object.entries(changeRequest)
                .filter(([key]) => fieldDefinitions[key]) // Filter entries that are defined in fieldDefinitions
                .map(([key, value]) => {
                    const fieldKey = key.replace('new_', '');
                    const fieldDef = fieldDefinitions[key];
                    const { oldValue, newValue, isChanged } = getValues(
                        fieldKey,
                        value,
                    );
                    const { label, order } = fieldDef;
                    return {
                        key: fieldKey,
                        label,
                        isChanged,
                        isSelected: false,
                        newValue,
                        oldValue,
                        order,
                    };
                }),
            ['order'],
            ['asc'],
        );

        setFields(newFields);
    }, [changeRequest, fieldDefinitions, getValues]);

    const setSelected = key => {
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
