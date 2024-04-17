import React, {
    FunctionComponent,
    createContext,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react';

type RoundPopperContextObject = {
    anchorEl?: HTMLElement;
    setAnchorEl: Dispatch<SetStateAction<HTMLElement | undefined>>;
};

const defaultContext: RoundPopperContextObject = {
    anchorEl: undefined,
    setAnchorEl: () => undefined,
};
const RoundPopperContext =
    createContext<RoundPopperContextObject>(defaultContext);

const RoundPopperContextProvider: FunctionComponent = ({ children }) => {
    const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(
        undefined,
    );
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
