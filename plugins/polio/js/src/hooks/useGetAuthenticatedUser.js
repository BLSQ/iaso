import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetAuthenticatedUser = () =>
    useQuery(['polio', 'user'], () => sendRequest('GET', '/api/profiles/me'));
