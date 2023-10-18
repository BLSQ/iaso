import { Bounds } from 'hat/assets/js/apps/Iaso/utils/map/mapUtils';
import React, {
    FunctionComponent,
    createContext,
    useState,
    useMemo,
} from 'react';

type LqasAfroOverviewContextObject = {
    bounds: Bounds | undefined;
    setBounds: React.Dispatch<React.SetStateAction<Bounds | undefined>>;
};

const defaultContext: LqasAfroOverviewContextObject = {
    bounds: undefined,
    setBounds: () => null,
};
const LqasAfroOverviewContext =
    createContext<LqasAfroOverviewContextObject>(defaultContext);

const LqasAfroOverviewContextProvider: FunctionComponent = ({ children }) => {
    const [bounds, setBounds] = useState<Bounds | undefined>(undefined);
    const contextValue: LqasAfroOverviewContextObject = useMemo(
        () => ({
            bounds,
            setBounds,
        }),
        [bounds],
    );

    return (
        <LqasAfroOverviewContext.Provider value={contextValue}>
            {children}
        </LqasAfroOverviewContext.Provider>
    );
};

export { LqasAfroOverviewContext, LqasAfroOverviewContextProvider };
