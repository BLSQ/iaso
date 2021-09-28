import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';

export const useGetAuthenticatedUser = () =>
    useSnackQuery(['profile', 'me'], () => getRequest('/api/profiles/me/'));
