import React, {
    FunctionComponent,
    createContext,
    useMemo,
    useEffect,
} from 'react';
import { useRedirectTo } from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import { useListenToInput } from '../hooks/useListenToInput';

type InputContextObject = {
    hasInputCode: boolean;
    // setHasInputCode: Dispatch<SetStateAction<boolean>>;
};

const combination = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
    ' ',
];

const url = baseUrls.hidden;

const defaultContext: InputContextObject = {
    hasInputCode: false,
};
const InputContext = createContext<InputContextObject>(defaultContext);

const InputContextProvider: FunctionComponent = ({ children }) => {
    const redirectTo = useRedirectTo();
    const hasInputCode = useListenToInput(combination);

    useEffect(() => {
        if (hasInputCode) {
            redirectTo(url, {});
        }
        // Including redirectTo would create an infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasInputCode]);

    const contextValue = useMemo(() => {
        return { hasInputCode };
    }, [hasInputCode]);

    return (
        <InputContext.Provider value={contextValue}>
            {children}
        </InputContext.Provider>
    );
};

export { InputContext, InputContextProvider };
