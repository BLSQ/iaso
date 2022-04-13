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
    instanceDefiningId: number | null;
    setFormId: React.Dispatch<React.SetStateAction<number | null>>;
    setFormDefiningId: React.Dispatch<React.SetStateAction<number | null>>;
    setInstanceDefiningId: React.Dispatch<React.SetStateAction<number | null>>;
};

const defaultContext: FormDefiningContextObject = {
    formDefiningId: null,
    formId: null,
    instanceDefiningId: null,
    setFormId: () => null,
    setFormDefiningId: () => null,
    setInstanceDefiningId: () => null,
};
const FormDefiningContext =
    createContext<FormDefiningContextObject>(defaultContext);

const FormDefiningContextProvider: FunctionComponent = ({ children }) => {
    const [formId, setFormId] = useState<number | null>(null);
    const [formDefiningId, setFormDefiningId] = useState<number | null>(null);
    const [instanceDefiningId, setInstanceDefiningId] = useState<number | null>(null);
    const contextValue: FormDefiningContextObject = useMemo(() => {
        return { formId, setFormId,  formDefiningId, setFormDefiningId, instanceDefiningId, setInstanceDefiningId };
    });

    return (
        <FormDefiningContext.Provider value={contextValue}>
            {children}
        </FormDefiningContext.Provider>
    );
};

export { FormDefiningContext, FormDefiningContextProvider };
