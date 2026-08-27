import React, { useCallback } from 'react';

import { Box } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';

import { findDescriptorInChildren, getDescriptorValue } from 'Iaso/utils';

import { MarkerMap } from '../../../components/maps/MarkerMapComponent';
import {
    ChildrenDescriptor,
    FieldType,
    FormDescriptor,
} from '../../forms/types/forms';
import { formatLabel } from '../../instances/utils';
import MESSAGES from '../messages';
import { Entity, FileContent } from '../types/entity';

type FieldSource = FileContent | Entity;

// Form answers and list-row extras are dynamic keys on FileContent / Entity.
const getRawFieldValue = (
    fileContent: FieldSource,
    fieldKey: string,
): unknown => (fileContent as Record<string, unknown>)[fieldKey];

const getRawFieldString = (
    fileContent: FieldSource,
    fieldKey: string,
): string | undefined => {
    const value = getRawFieldValue(fileContent, fieldKey);
    if (value == null || value === '') return undefined;
    return typeof value === 'string' ? value : String(value);
};

const getDescriptorListValues = (
    fieldKey: string,
    fileContent: FieldSource,
    formDescriptors?: FormDescriptor[],
): string[] => {
    const fieldsKeys =
        getRawFieldString(fileContent, fieldKey)?.split(' ') || [];
    let listValues: string[] = [];
    formDescriptors?.forEach(formDescriptor => {
        const descriptor = findDescriptorInChildren(fieldKey, formDescriptor);
        if (descriptor?.children) {
            listValues =
                descriptor.children
                    .filter((child: ChildrenDescriptor) =>
                        fieldsKeys.includes(child.name),
                    )
                    .map((child: ChildrenDescriptor) => formatLabel(child)) ||
                [];
        }
    });
    return listValues;
};

export const useGetFieldValue = (
    formDescriptors?: FormDescriptor[],
): ((
    fieldKey: string,
    fileContent: FieldSource,
    type: FieldType,
) => string | number | React.ReactNode) => {
    const { formatMessage } = useSafeIntl();
    return useCallback(
        (
            fieldKey: string,
            fileContent: FieldSource,
            type: FieldType,
        ): string | number | React.ReactNode => {
            switch (type) {
                case 'text':
                case 'calculate':
                case 'integer':
                case 'decimal':
                case 'barcode':
                case 'note': {
                    const value = getRawFieldValue(fileContent, fieldKey);
                    return (
                        (value as string | number | undefined) ||
                        textPlaceholder
                    );
                }
                case 'date': {
                    const rawDate = getRawFieldString(fileContent, fieldKey);
                    return rawDate
                        ? moment(rawDate).format('L')
                        : textPlaceholder;
                }
                case 'start':
                case 'end':
                case 'dateTime': {
                    const rawDateTime = getRawFieldString(
                        fileContent,
                        fieldKey,
                    );
                    return rawDateTime
                        ? moment(rawDateTime).format('LTS')
                        : textPlaceholder;
                }
                case 'select one':
                case 'select_one': {
                    return getDescriptorValue(
                        fieldKey,
                        fileContent,
                        formDescriptors,
                    );
                }
                case 'select_all_that_apply':
                case 'select all that apply':
                case 'select_multiple':
                case 'select multiple': {
                    const listValues = getDescriptorListValues(
                        fieldKey,
                        fileContent,
                        formDescriptors,
                    );
                    return listValues.length > 0
                        ? listValues.join(' - ')
                        : textPlaceholder;
                }

                case 'geopoint': {
                    const rawGeo = getRawFieldString(fileContent, fieldKey);
                    if (!rawGeo) return textPlaceholder;
                    const latitude = Number(rawGeo.split(' ')[0]);
                    const longitude = Number(rawGeo.split(' ')[1]);
                    return (
                        <Box width="100%" height="100%">
                            <MarkerMap
                                longitude={
                                    Number.isFinite(longitude)
                                        ? longitude
                                        : undefined
                                }
                                latitude={
                                    Number.isFinite(latitude)
                                        ? latitude
                                        : undefined
                                }
                                maxZoom={8}
                                mapHeight={200}
                            />
                        </Box>
                    );
                }
                case 'time': {
                    // ODK/XLSForm times look like "10:30:00.000+02:00" (time + offset, no date).
                    const rawTime = getRawFieldString(fileContent, fieldKey);
                    if (!rawTime) return textPlaceholder;
                    const parsedTime = moment.parseZone(rawTime, [
                        'HH:mm:ss.SSSZ',
                        'HH:mm:ss.SSSZZ',
                        'HH:mm:ssZ',
                        'HH:mm:ss.SSS',
                        'HH:mm:ss',
                        'HH:mm',
                    ]);
                    return parsedTime.isValid()
                        ? parsedTime.format('LT')
                        : textPlaceholder;
                }
                default:
                    return formatMessage(MESSAGES.typeNotSupported, { type });
            }
        },
        [formDescriptors, formatMessage],
    );
};
