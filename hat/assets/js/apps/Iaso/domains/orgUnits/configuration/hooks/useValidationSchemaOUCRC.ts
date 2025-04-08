import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import MESSAGES from '../messages';

yup.addMethod(
    yup.string,
    'isMultiSelectValid',
    function isMultiSelectValid(formatMessage) {
        return this.test('isMultiSelectValid', '', (value, context) => {
            const { path, createError, parent } = context;
            if (!parent.editableFields && !parent.groupSetIds) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.requiredField),
                });
            }
            const splitFields = parent.editableFields || [];
            const isFieldPopulated = parent[path];
            if (!isFieldPopulated && splitFields.includes(path)) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.requiredField),
                });
            }
            return true;
        });
    },
);

export const useValidationSchemaOUCRC = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        projectId: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        type: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        orgUnitTypeId: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        orgUnitsEditable: yup
            .boolean()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        editableFields: yup.string().nullable(),
        possibleTypeIds: yup
            .string()
            .nullable()
            .when('orgUnitsEditable', {
                is: true,
                then: yup.string().nullable().isMultiSelectValid(formatMessage),
                otherwise: yup.string().nullable(),
            }),
        possibleParentTypeIds: yup
            .string()
            .nullable()
            .when('orgUnitsEditable', {
                is: true,
                then: yup.string().nullable().isMultiSelectValid(formatMessage),
                otherwise: yup.string().nullable(),
            }),
        groupSetIds: yup
            .string()
            .nullable()
            .when('orgUnitsEditable', {
                is: true,
                then: yup.string().nullable().isMultiSelectValid(formatMessage),
                otherwise: yup.string().nullable(),
            }),
        editableReferenceFormIds: yup.string().nullable(),
        otherGroupIds: yup.string().nullable(),
    });
};
