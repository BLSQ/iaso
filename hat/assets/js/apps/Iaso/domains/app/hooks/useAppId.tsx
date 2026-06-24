import { useContext } from 'react';
import { BackendEnvContext } from 'Iaso/domains/app/contexts/BackendEnvContext';

export const useAppId = (): string => {
    const { defaultAppId: appId } = useContext(BackendEnvContext);
    return appId ?? '';
};
