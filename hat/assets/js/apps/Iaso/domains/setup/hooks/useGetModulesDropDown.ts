import { IntlFormatMessage, useSafeIntl } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { DropdownOptions } from '../../../types/utils';
import { MESSAGES as MODULE_MESSAGES } from '../../modules/messages';
import { MESSAGES } from '../messages';
import { Module } from '../types/account';

export const useGetModulesDropDown = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    return useSnackQuery({
        queryKey: ['modules'],
        queryFn: () => getRequest('/api/modules/'),
        snackErrorMsg: MESSAGES.modulesDropDownError,
        options: {
            select: data => {
                return (
                    data?.results?.map((module: Module) => {
                        return {
                            value: module.codename,
                            label: formatMessage(
                                MODULE_MESSAGES[module.codename.toLowerCase()],
                            ),
                            original: module,
                        };
                    }) ?? []
                );
            },
        },
    });
};
