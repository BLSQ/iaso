import React, {
    FunctionComponent,
    createContext,
    // useReducer,
    useMemo,
    useState,
} from 'react';

type FormDefiningContextObject = {
    formDefiningId: number | null;
    formId: number | null;
    setFormId: React.Dispatch<React.SetStateAction<number | null>>;
    setFormDefiningId: React.Dispatch<React.SetStateAction<number | null>>;
};

const defaultContext: FormDefiningContextObject = {
    formDefiningId: null,
    formId: null,
    setFormId: () => null,
    setFormDefiningId: () => null,
};
const FormDefiningContext =
    createContext<FormDefiningContextObject>(defaultContext);

const FormDefiningContextProvider: FunctionComponent = ({ children }) => {
    const [formId, setFormId] = useState<number | null>(null);
    const [formDefiningId, setFormDefiningId] = useState<number | null>(null);

    const contextValue: FormDefiningContextObject = useMemo(() => {
        return { formId, setFormId, formDefiningId, setFormDefiningId };
    }, [formDefiningId, formId]);

    return (
        <FormDefiningContext.Provider value={contextValue}>
            {children}
        </FormDefiningContext.Provider>
    );
};

export { FormDefiningContext, FormDefiningContextProvider };
