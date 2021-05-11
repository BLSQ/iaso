import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetAuthenticatedUser = () =>
    useQuery(['profile', 'me'], () => sendRequest('GET', '/api/profiles/me'));
