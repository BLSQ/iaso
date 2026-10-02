import React, { FunctionComponent, createContext, useMemo } from 'react';

type BackendEnvContextObject = {
    defaultAppId?: string;
    domainName: string;
    siteAnnouncementMessage?: string;
};

const defaultContext: BackendEnvContextObject = {
    defaultAppId: '',
    domainName: '',
    siteAnnouncementMessage: '',
};
const BackendEnvContext =
    createContext<BackendEnvContextObject>(defaultContext);

const BackendEnvContextProvider: FunctionComponent<{
    children: React.ReactNode;
    defaultAppId?: string;
    domainName: string;
    siteAnnouncementMessage?: string;
}> = ({ children, defaultAppId, domainName, siteAnnouncementMessage }) => {
    const contextValue = useMemo(() => {
        return { defaultAppId, domainName, siteAnnouncementMessage };
    }, [defaultAppId, domainName, siteAnnouncementMessage]);

    return (
        <BackendEnvContext.Provider value={contextValue}>
            {children}
        </BackendEnvContext.Provider>
    );
};

export { BackendEnvContext, BackendEnvContextProvider };
