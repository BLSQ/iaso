import React from 'react';

import { Box } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';

import { MarkerMap } from '../../../components/maps/MarkerMapComponent';
import { findDescriptorInChildren, getDescriptorValue } from '../../../utils';

import { FieldType, FormDescriptor } from '../../forms/types/forms';
import { formatLabel } from '../../instances/utils';
import MESSAGES from '../messages';
import { Entity, FileContent } from '../types/entity';

const getDescriptorListValues = (
    fieldKey: string,
    fileContent: FileContent | Entity,
    formDescriptors?: FormDescriptor[],
): string[] => {
    const fieldsKeys = fileContent[fieldKey]?.split(' ') || [];
    let listValues: string[] = [];
    formDescriptors?.forEach(formDescriptor => {
        const descriptor = findDescriptorInChildren(fieldKey, formDescriptor);
        if (descriptor?.children) {
            listValues =
                descriptor.children
                    .filter(child => fieldsKeys.includes(child.name))
                    .map(child => formatLabel(child)) || [];
        }
    });
    return listValues;
};

export const useGetFieldValue = (
    formDescriptors?: FormDescriptor[],
): ((
    fieldKey: string,
    fileContent: FileContent | Entity,
    type: FieldType,
) => string | number | React.ReactNode) => {
    const { formatMessage } = useSafeIntl();
    const getValue = (fieldKey, fileContent, type) => {
        switch (type) {
            case 'text':
            case 'calculate':
            case 'integer':
            case 'decimal':
            case 'barcode':
            case 'note': {
                return fileContent[fieldKey] || textPlaceholder;
            }
            case 'date': {
                return fileContent[fieldKey]
                    ? moment(fileContent[fieldKey]).format('L')
                    : textPlaceholder;
            }
            case 'start':
            case 'end':
            case 'dateTime': {
                return fileContent[fieldKey]
                    ? moment(fileContent[fieldKey]).format('LTS')
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
                if (!fileContent[fieldKey]) return textPlaceholder;
                const latitude = fileContent[fieldKey]?.split(' ')[0];
                const longitude = fileContent[fieldKey]?.split(' ')[1];
                return (
                    <Box width="100%" height="100%">
                        <MarkerMap
                            longitude={longitude}
                            latitude={latitude}
                            maxZoom={8}
                            mapHeight={200}
                        />
                    </Box>
                );
            }
            case 'time': {
                return fileContent[fieldKey]
                    ? moment(fileContent[fieldKey]).format('T')
                    : textPlaceholder;
            }
            default:
                return formatMessage(MESSAGES.typeNotSupported, { type });
        }
    };
    return getValue;
};
