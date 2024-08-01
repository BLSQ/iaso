import { UseQueryResult } from 'react-query';
import { optionsRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { mapOptions } from '../../../../../libs/utils';
import { DropdownOptions } from '../../../../../types/utils';
import { useLocale } from '../../../../app/contexts/LocaleContext';

export const usePaymentStatusOptions = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const { locale } = useLocale();
    return useSnackQuery({
        queryKey: ['paymentStatusOptions', locale],
        queryFn: () => optionsRequest('/api/payments'),
        options: {
            staleTime: 1000 * 60 * 15, // in ms
            cacheTime: 1000 * 60 * 5,
            select: data => mapOptions(data, ['status']).status,
        },
    });
};
