import React, {
    FunctionComponent,
    createContext,
    useState,
    useMemo,
} from 'react';

type RoundPopperContextObject = {
    anchorEl: any;
    setAnchorEl: any;
};

const defaultContext: RoundPopperContextObject = {
    anchorEl: null,
    setAnchorEl: () => null,
};
const RoundPopperContext =
    createContext<RoundPopperContextObject>(defaultContext);

const RoundPopperContextProvider: FunctionComponent = ({ children }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const contextValue: RoundPopperContextObject = useMemo(
        () => ({
            anchorEl,
            setAnchorEl,
        }),
        [anchorEl],
    );

    return (
        <RoundPopperContext.Provider value={contextValue}>
            {children}
        </RoundPopperContext.Provider>
    );
};

export { RoundPopperContext, RoundPopperContextProvider };
