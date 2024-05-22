import { Redirection } from '../../../../../hat/assets/js/apps/Iaso/routing/types';
import { baseUrls } from './urls';

export const redirections: Redirection[] = [
    {
        path: baseUrls.embeddedCalendar,
        to: `${baseUrls.embeddedCalendar}/`, // Doesn't do anything
    },
];
