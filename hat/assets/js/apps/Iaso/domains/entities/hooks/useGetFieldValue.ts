import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';

import { Beneficiary, FileContent } from '../types/beneficiary';

import { FieldType, FormDescriptor } from '../../forms/types/forms';

import { findDescriptorInChildren } from '../../../utils';
import { formatLabel } from '../../instances/utils';
import MESSAGES from '../messages';

const textPlaceholder = '--';

export const useGetFieldValue = (
    formDescriptors?: FormDescriptor[],
): ((
    fieldKey: string,
    fileContent: FileContent | Beneficiary,
    type: FieldType,
) => string) => {
    const { formatMessage } = useSafeIntl();
    const getValue = (fieldKey, fileContent, type): string => {
        switch (type) {
            case 'text':
            case 'calculate':
            case 'integer':
            case 'decimal':
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
                let value = textPlaceholder;
                if (fileContent[fieldKey]) {
                    formDescriptors?.forEach(formDescriptor => {
                        const descriptor = findDescriptorInChildren(
                            fieldKey,
                            formDescriptor,
                        );
                        if (descriptor?.children) {
                            const descriptorValue = descriptor.children.find(
                                child => {
                                    return fileContent[fieldKey] === child.name;
                                },
                            );
                            if (descriptorValue) {
                                value = formatLabel(descriptorValue);
                            }
                        }
                    });
                }
                return value;
            }
            case 'select_all_that_apply':
            case 'select all that apply':
            case 'select_multiple':
            case 'select multiple': {
                if (fileContent[fieldKey]) {
                    const fieldsKeys = fileContent[fieldKey].split(' ');
                    let listValues = [];
                    formDescriptors?.forEach(formDescriptor => {
                        const descriptor = findDescriptorInChildren(
                            fieldKey,
                            formDescriptor,
                        );
                        if (descriptor?.children) {
                            listValues =
                                descriptor.children
                                    .filter(child => {
                                        return fieldsKeys.includes(child.name);
                                    })
                                    .map(child => formatLabel(child)) || [];
                        }
                    });
                    return listValues.length > 0
                        ? listValues.join(' - ')
                        : textPlaceholder;
                }
                return textPlaceholder;
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
