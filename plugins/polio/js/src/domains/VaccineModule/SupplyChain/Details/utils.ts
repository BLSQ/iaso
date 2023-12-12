import { FormikErrors, FormikProps, FormikTouched } from 'formik';
import { VRF } from '../constants';
import {
    PreAlert,
    SupplyChainFormData,
    TabValue,
    UseHandleSubmitArgs,
    VAR,
} from '../types';
import { VACCINE_SUPPLY_CHAIN_DETAILS } from '../../../../constants/routes';

type SaveAllArgs = {
    changedTabs: TabValue[];
    variables: SupplyChainFormData;
    initialValues: SupplyChainFormData;
};

export const makeNewInitialStateAfterSaveAll = ({
    changedTabs,
    variables,
    initialValues,
}: SaveAllArgs): SupplyChainFormData => {
    const newInitialValues = { ...initialValues };
    changedTabs.forEach(touchedTab => {
        if (touchedTab === VRF) {
            newInitialValues[touchedTab] = variables[touchedTab];
        } else {
            const newField = variables[touchedTab]?.filter(
                value => !value.to_delete,
            );
            // @ts-ignore
            newInitialValues[touchedTab] = newField;
        }
    });
    return newInitialValues;
};

type SaveOneArgs = {
    variables: SupplyChainFormData;
    initialValues: SupplyChainFormData;
};
export const makeNewInitialValuesAfterSaveOne = ({
    initialValues,
    variables,
}: SaveOneArgs): SupplyChainFormData => {
    const newInitialValues = { ...initialValues };
    const { activeTab } = variables;
    const fieldVariable = variables[activeTab];
    if (activeTab === VRF) {
        // @ts-ignore
        newInitialValues[activeTab] = fieldVariable;
    } else {
        const newFieldValue = (
            fieldVariable as Partial<PreAlert>[] | Partial<VAR>[]
        )?.filter(value => !value.to_delete);
        // @ts-ignore
        newInitialValues[activeTab] = newFieldValue;
    }
    return newInitialValues;
};

export const makeNewErrors = (
    activeTab: TabValue,
    errors: FormikErrors<SupplyChainFormData>,
): FormikErrors<SupplyChainFormData> => {
    const newErrors: FormikErrors<SupplyChainFormData> = { ...errors };
    delete newErrors[activeTab];
    return newErrors;
};

export const makeNewTouched = (
    activeTab: TabValue,
    touched: FormikTouched<SupplyChainFormData>,
): FormikTouched<SupplyChainFormData> => {
    const newTouched = {
        ...touched,
    };
    delete newTouched[activeTab];
    delete newTouched.saveAll;
    delete newTouched.activeTab;
    return newTouched;
};

type NewFormValuesArgs = {
    changedTabs: TabValue[];
    formikValues: SupplyChainFormData;
    newInitialValues: SupplyChainFormData;
    activeTab: TabValue;
};

export const makeNewFormValues = ({
    activeTab,
    changedTabs,
    newInitialValues,
    formikValues,
}: NewFormValuesArgs): SupplyChainFormData => {
    const updatedChangedTabs = changedTabs.filter(
        changedTab => changedTab !== activeTab,
    );
    const newValues = { ...newInitialValues };
    updatedChangedTabs.forEach(updated => {
        // TS error because not all properties are arrays
        // @ts-ignore
        newValues[updated] = formikValues[updated];
    });
    newValues.changedTabs = formikValues.changedTabs;
    return newValues;
};

type NewFormikValuesArgs = {
    variables: SupplyChainFormData;
    initialValues: SupplyChainFormData;
    formik: FormikProps<SupplyChainFormData>;
};

type NewFormikValuesResult = {
    newInitialValues: SupplyChainFormData;
    newErrors: FormikErrors<SupplyChainFormData>;
    newTouched: FormikTouched<SupplyChainFormData>;
    newValues: SupplyChainFormData;
};
export const makeNewFormikValues = ({
    variables,
    initialValues,
    formik,
}: NewFormikValuesArgs): NewFormikValuesResult => {
    const newInitialValues = makeNewInitialValuesAfterSaveOne({
        variables,
        initialValues,
    });
    const newErrors = makeNewErrors(variables.activeTab, formik.errors);
    const newTouched = makeNewTouched(variables.activeTab, formik.touched);
    const newValues = makeNewFormValues({
        activeTab: variables.activeTab,
        newInitialValues,
        formikValues: formik.values,
        changedTabs: variables.changedTabs,
    });

    return {
        newInitialValues,
        newErrors,
        newTouched,
        newValues,
    };
};

export const makeHandleSubmit =
    ({
        formik,
        router,
        initialValues,
        setInitialValues,
        saveForm,
        redirect,
    }: // eslint-disable-next-line no-unused-vars
    UseHandleSubmitArgs): ((saveAll?: boolean) => void) =>
    (saveAll = false): void => {
        formik.submitForm();
        saveForm(
            { ...formik.values, saveAll },
            {
                onSuccess: (data, variables: SupplyChainFormData) => {
                    // if POST request on vrf, redirect to replace so we leave the create screen and move to the details screen
                    if (!router.params.id) {
                        redirect(VACCINE_SUPPLY_CHAIN_DETAILS, {
                            id: data.vrf[0].value.id,
                        });
                    } else if (variables.saveAll) {
                        const newInitialValues =
                            makeNewInitialStateAfterSaveAll({
                                initialValues,
                                changedTabs: variables.changedTabs,
                                variables,
                            });
                        setInitialValues(newInitialValues);
                        formik.setErrors({});
                        formik.setTouched({});
                    } else {
                        const {
                            newInitialValues,
                            newErrors,
                            newTouched,
                            newValues,
                        } = makeNewFormikValues({
                            variables,
                            initialValues,
                            formik,
                        });
                        setInitialValues(newInitialValues);
                        formik.setErrors(newErrors);
                        formik.setTouched(newTouched);
                        formik.setValues(newValues);
                    }
                },
                onSettled: () => {
                    formik.setSubmitting(false);
                },
            },
        );
    };
