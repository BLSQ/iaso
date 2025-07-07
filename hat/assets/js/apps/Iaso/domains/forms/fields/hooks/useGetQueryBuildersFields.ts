import { useMemo } from 'react';
import { QueryBuilderFields, useSafeIntl } from 'bluesquare-components';

import { findDescriptorInChildren } from '../../../../utils';
import { formatLabel } from '../../../instances/utils';

import MESSAGES from '../../../workflows/messages';
import { FieldType, FormDescriptor, PossibleField } from '../../types/forms';

import { Field, iasoFields } from '../constants';

// existing mappings are referenced here: https://docs.openiaso.com/pages/dev/how_to/create_forms_for_entities/create_forms_for_entities.html#type-indicators

type CalculateFieldSuffix =
    | '__time__'
    | '__date__'
    | '__boolean__'
    | '__bool__'
    | '__double__'
    | '__decimal__'
    | '__long__'
    | '__integer__'
    | '__int__'
    | '__datetime__'
    | '__date_time__';

const calculateMapping: { suffix: CalculateFieldSuffix; type: FieldType }[] = [
    {
        suffix: '__int__',
        type: 'integer',
    },
    {
        suffix: '__integer__',
        type: 'integer',
    },
    {
        suffix: '__long__',
        type: 'decimal',
    },
    {
        suffix: '__decimal__',
        type: 'decimal',
    },
    {
        suffix: '__double__',
        type: 'decimal',
    },
    {
        suffix: '__bool__',
        type: 'boolean',
    },
    {
        suffix: '__boolean__',
        type: 'boolean',
    },
    {
        suffix: '__date__',
        type: 'date',
    },
    {
        suffix: '__time__',
        type: 'time',
    },
    {
        suffix: '__date_time__',
        type: 'dateTime',
    },
    {
        suffix: '__datetime__',
        type: 'dateTime',
    },
];

export const getQueryBuildersFields = (
    formatMessage: (msg: any) => string,
    formDescriptors?: FormDescriptor[],
    possibleFields?: PossibleField[],
    configFields: Field[] = iasoFields,
): QueryBuilderFields => {
    if (!possibleFields || !formDescriptors) return {};
    // you can fields examples here: https://codesandbox.io/s/github/ukrbublik/react-awesome-query-builder/tree/master/sandbox?file=/src/demo/config.tsx:1444-1464
    const fields: QueryBuilderFields = {};
    possibleFields.forEach(field => {
        const fieldCopy = { ...field };
        const mapping =
            field.type === 'calculate'
                ? calculateMapping.find(m => field.name.endsWith(m.suffix))
                : undefined;
        if (mapping) {
            fieldCopy.type = mapping.type;
        }
        const currentField: Field | undefined = configFields.find(
            iasoField =>
                iasoField.type === fieldCopy.type ||
                iasoField.alias === fieldCopy.type,
        );
        if (
            currentField &&
            !currentField.disabled &&
            currentField.queryBuilder
        ) {
            fields[fieldCopy.fieldKey] = {
                ...currentField.queryBuilder,
                label: `${formatLabel(fieldCopy)} [${fieldCopy.name}]`,
            };
            // in case the field needs a list of values to display
            if (currentField.useListValues) {
                // We will take the last found value in the form descriptors list
                formDescriptors?.forEach(formDescriptor => {
                    const descriptor = findDescriptorInChildren(
                        fieldCopy,
                        formDescriptor,
                    );
                    if (descriptor?.children) {
                        const listValues = Object.fromEntries(
                            (descriptor.children || []).map(child => [
                                child.name,
                                formatLabel(child),
                            ]),
                        );
                        // @ts-ignore
                        fields[fieldCopy.fieldKey].fieldSettings = {
                            listValues,
                        };
                    }
                });
            }
        }
    });
    fields.current_date = {
        label: formatMessage(MESSAGES.currentDate),
        type: 'currentDate',
        valueSources: ['value', 'field'],
    };
    fields.current_datetime = {
        label: formatMessage(MESSAGES.currentDateTime),
        type: 'currentDatetime',
        valueSources: ['value', 'field'],
    };
    return Object.fromEntries(
        Object.entries(fields).sort(([, a], [, b]) =>
            (a.label ?? '').localeCompare(b.label ?? ''),
        ),
    );
};

export const useGetQueryBuildersFields = (
    formDescriptors?: FormDescriptor[],
    possibleFields?: PossibleField[],
    configFields: Field[] = iasoFields,
): QueryBuilderFields => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () =>
            getQueryBuildersFields(
                formatMessage,
                formDescriptors,
                possibleFields,
                configFields,
            ),
        [formatMessage, formDescriptors, possibleFields, configFields],
    );
};
