import React, { useCallback, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { FormikProps } from 'formik';
import { useDispatch } from 'react-redux';
import { redirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { PREALERT, VAR, VRF } from '../constants';
import { SupplyChainFormData, TabValue, UseHandleSubmitArgs } from '../types';
import { makeHandleSubmit } from '../Details/utils';

type Args = {
    formik: FormikProps<SupplyChainFormData>;
    isSaving: boolean;
    initialValues: SupplyChainFormData;
    tab: TabValue;
};
type Result = { allowSaveAll: boolean; allowSaveTab: boolean };
export const useEnableSaveButtons = ({
    formik,
    isSaving,
    initialValues,
    tab,
}: Args): Result => {
    const { isValid, isSubmitting, values, touched, errors } = formik;
    const allowSaveAll =
        isValid &&
        !isSaving &&
        !isSubmitting &&
        !isEqual(touched, {}) &&
        (!isEqual(initialValues[VRF], values[VRF]) ||
            !isEqual(initialValues[PREALERT], values[PREALERT]) ||
            !isEqual(initialValues[VAR], values[VAR]));

    const isTabTouched = Boolean(touched[tab]);
    const isTabValid = !errors[tab];
    const allowSaveTab =
        isTabTouched &&
        isTabValid &&
        !isSaving &&
        !isSubmitting &&
        !isEqual(initialValues[tab], values[tab]);
    return useMemo(() => {
        return { allowSaveAll, allowSaveTab };
    }, [allowSaveAll, allowSaveTab]);
};

export const useRedirectToReplace = (): ((
    // eslint-disable-next-line no-unused-vars
    url: string,
    // eslint-disable-next-line no-unused-vars
    options: Record<string, string>,
) => void) => {
    const dispatch = useDispatch();
    return useCallback(
        (url: string, options: Record<string, string>) => {
            dispatch(redirectToReplace(url, options));
        },
        [dispatch],
    );
};

export const useHandleSubmit = ({
    formik,
    router,
    initialValues,
    setInitialValues,
    saveForm,
    redirect,
}: // eslint-disable-next-line no-unused-vars
UseHandleSubmitArgs): ((saveAll?: boolean | undefined) => void) => {
    return useMemo(() => {
        return makeHandleSubmit({
            formik,
            router,
            initialValues,
            setInitialValues,
            saveForm,
            redirect,
        });
    }, [formik, initialValues, redirect, router, saveForm, setInitialValues]);
};

type UseWatchChangedTabsArgs = {
    initialValues: SupplyChainFormData;
    values: SupplyChainFormData;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
};

export const useWatchChangedTabs = ({
    initialValues,
    values,
    setFieldValue,
}: UseWatchChangedTabsArgs): void => {
    // defining the booleans here to avoid having formik.values as dependency of useEffect, which would cause an infinite loop
    const vrfChanged = !isEqual(initialValues[VRF], values[VRF]);
    const preAlertsChanged = !isEqual(
        initialValues[PREALERT],
        values[PREALERT],
    );
    const arrivalReportsChanged = !isEqual(initialValues[VAR], values[VAR]);

    // list changed tabs to avoid patching unchanged tabs
    useEffect(() => {
        const changedTabs: TabValue[] = [];
        if (vrfChanged) {
            changedTabs.push(VRF);
        }
        if (preAlertsChanged) {
            changedTabs.push(PREALERT);
        }
        if (arrivalReportsChanged) {
            changedTabs.push(VAR);
        }
        setFieldValue('changedTabs', changedTabs);
    }, [preAlertsChanged, setFieldValue, arrivalReportsChanged, vrfChanged]);
};

type UseInitializeValueOnFetchArgs = {
    key: TabValue;
    value: any;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
    setInitialValues: React.Dispatch<Partial<SupplyChainFormData>>;
};

export const useInitializeValueOnFetch = ({
    key,
    value,
    setFieldValue,
    setInitialValues,
}: UseInitializeValueOnFetchArgs): void => {
    useEffect(() => {
        if (value) {
            setFieldValue(key, value[key]);
            // set InitialValues so we can compare with form values and enables/disabel dave button accordingly
            setInitialValues({
                [key]: value[key],
            });
        }
    }, [key, setFieldValue, setInitialValues, value]);
};
