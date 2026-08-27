import { useContext } from 'react';
import { BackendEnvContext } from 'Iaso/domains/app/contexts/BackendEnvContext';

export const useDomainName = (): string => {
    const { domainName } = useContext(BackendEnvContext);
    return domainName ?? '';
};
