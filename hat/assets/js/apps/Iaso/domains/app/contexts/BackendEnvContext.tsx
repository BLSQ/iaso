import React, { FunctionComponent, createContext, useMemo } from 'react';

type BackendEnvContextObject = {
    defaultAppId?: string;
    domainName: string;
};

const defaultContext: BackendEnvContextObject = {
    defaultAppId: '',
    domainName: '',
};
const BackendEnvContext =
    createContext<BackendEnvContextObject>(defaultContext);

const BackendEnvContextProvider: FunctionComponent<{
    children: React.ReactNode;
    defaultAppId?: string;
    domainName: string;
}> = ({ children, defaultAppId, domainName }) => {
    const contextValue = useMemo(() => {
        return { defaultAppId, domainName };
    }, [defaultAppId, domainName]);

    return (
        <BackendEnvContext.Provider value={contextValue}>
            {children}
        </BackendEnvContext.Provider>
    );
};

export { BackendEnvContext, BackendEnvContextProvider };
