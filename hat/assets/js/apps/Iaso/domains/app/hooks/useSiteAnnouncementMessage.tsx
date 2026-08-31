import { useContext } from 'react';
import { BackendEnvContext } from 'Iaso/domains/app/contexts/BackendEnvContext';

export const useSiteAnnouncementMessage = (): string => {
    const { siteAnnouncementMessage } = useContext(BackendEnvContext);
    return siteAnnouncementMessage ?? '';
};
