import { Redirection } from '../../../../../hat/assets/js/apps/Iaso/routing/types';
import { baseUrls } from './urls';

export const redirections: Redirection[] = [
    {
        path: '/polio/im/ihh/*',
        to: `/${baseUrls.imHH}/`,
    },
];
