import { createContext } from 'react';

interface FormAdditionalPropsContextType {
    isFetchingSelectedCampaign: boolean;
}

const FormAdditionalPropsContext =
    createContext<FormAdditionalPropsContextType | null>(null);

export const FormAdditionalPropsProvider = FormAdditionalPropsContext.Provider;

export default FormAdditionalPropsContext;
