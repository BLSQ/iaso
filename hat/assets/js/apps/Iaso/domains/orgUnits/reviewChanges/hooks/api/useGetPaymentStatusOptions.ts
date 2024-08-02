import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../../types/utils';
import { useLocale } from '../../../../app/contexts/LocaleContext';

export const usePaymentStatusOptions = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const { locale } = useLocale();
    return useSnackQuery({
        queryKey: ['paymentStatusOptions', locale],
        queryFn: () => getRequest('/api/payments/options'),
        options: {
            staleTime: 1000 * 60 * 15, // in ms
            cacheTime: 1000 * 60 * 5,
        },
    });
};
