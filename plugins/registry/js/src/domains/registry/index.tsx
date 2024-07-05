import React, { createContext, useMemo } from 'react';
import { Registry as RegistryPage } from '../../../../../../hat/assets/js/apps/Iaso/domains/registry/index';
import { baseUrls } from '../../constants/urls';

export const PublicRegistryContext = createContext(undefined);
export const Registry = () => {
    const contextValue = useMemo(() => ({ data_source_id: 30 }), []);
    return (
        <PublicRegistryContext.Provider value={contextValue as any}>
            <RegistryPage baseUrl={baseUrls.registry} />
        </PublicRegistryContext.Provider>
    );
};
