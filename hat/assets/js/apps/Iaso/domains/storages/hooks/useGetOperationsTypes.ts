// @ts-ignore
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';

type OperationType =
    | 'WRITE_PROFILE'
    | 'RESET'
    | 'READ'
    | 'WRITE_RECORD'
    | 'CHANGE_STATUS';

export const useGetOperationsTypes = (): Array<DropdownOptions<string>> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            value: 'WRITE_PROFILE',
            label: formatMessage(MESSAGES.writeProfile),
        },
        {
            value: 'RESET',
            label: formatMessage(MESSAGES.reset),
        },
        {
            value: 'READ',
            label: formatMessage(MESSAGES.read),
        },
        {
            value: 'WRITE_RECORD',
            label: formatMessage(MESSAGES.writeRecord),
        },
        {
            value: 'CHANGE_STATUS',
            label: formatMessage(MESSAGES.changeStatus),
        },
    ];
};

export const useGetOperationsTypesLabel = (): ((
    // eslint-disable-next-line no-unused-vars
    operationTypeKey: OperationType,
) => string) => {
    const operationTypes = useGetOperationsTypes();
    const getLabel = (operationTypeKey: OperationType): string => {
        const current = operationTypes.find(
            operationType => operationType.value === operationTypeKey,
        );
        return current?.label || '-';
    };
    return getLabel;
};
