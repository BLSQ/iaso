import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { isEqual } from 'lodash';
import { FormikProps } from 'formik';
import { useDispatch } from 'react-redux';
import { redirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { PREALERT, VAR, VRF } from '../constants';
import {
    PreAlert,
    VAR as VARType,
    SupplyChainFormData,
    TabValue,
    UseHandleSubmitArgs,
} from '../types';
import { makeHandleSubmit } from '../Details/utils';
import { Optional } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const emptyArrivalReport = {
    report_date: undefined,
    po_number: undefined,
    lot_numbers: undefined,
    expiration_date: undefined,
    doses_shipped: undefined,
    doses_received: undefined,
    doses_per_vial: 20, // this is hardcoded in backend too, we need to think about it.
};

export const emptyPreAlert = {
    date_pre_alert_reception: undefined,
    po_number: undefined,
    estimated_arrival_time: undefined,
    expiration_date: undefined,
    doses_shipped: undefined,
    doses_per_vial: 20,
    lot_numbers: undefined,
    id: undefined,
};

const areArrayElementsChanged = (
    newElements: Array<Partial<PreAlert>> | Array<Partial<VARType>>,
): boolean => {
    return Boolean(
        newElements.find(el => {
            // We need to loop on object keys because when setting a field to undefined
            // formik may remove it from the form state, so we can't use isEqual or structuredClone
            const keys = Object.keys(el);
            const result = keys.find(
                key =>
                    key !== 'doses_per_vial' && // this key is not sent to the backend so it's not relevant
                    key !== 'vials_shipped' && // idem
                    el[key] !== undefined,
            );

            return Boolean(result);
        }),
    );
};

const canSaveArrayTab = (
    tab: 'pre_alerts' | 'arrival_reports',
    initialValues: SupplyChainFormData,
    values: SupplyChainFormData,
) => {
    const newElements = values[tab]
        ? // @ts-ignore we check that values[tab] is not undefined, so the ts error is wrong
          values[tab].slice(values[tab].length - 1)
        : [];
    // If there's no new preAlert/arrivalReport, we just check that values have changed
    if (newElements.length === 0) {
        return !isEqual(initialValues[tab], values[tab]);
    }
    // If an element has been added, we check that it's not empty
    return areArrayElementsChanged(newElements);
};

const canSaveTab = (
    tab: TabValue,
    initialValues: SupplyChainFormData,
    values: SupplyChainFormData,
): boolean => {
    if (tab === VRF) {
        return !isEqual(initialValues[tab], values[tab]);
    }
    if (tab === PREALERT) {
        return canSaveArrayTab(PREALERT, initialValues, values);
    }
    if (tab === VAR) {
        return canSaveArrayTab(VAR, initialValues, values);
    }
    return false;
};

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
    const { isValid, isSubmitting, values, errors } = formik;
    const isPreAlertChanged = canSaveTab(PREALERT, initialValues, values);
    const isVARChanged = canSaveTab(VAR, initialValues, values);
    const isVRFChanged = canSaveTab(VRF, initialValues, values);
    const allowSaveAll =
        isValid &&
        !isSaving &&
        !isSubmitting &&
        (isVRFChanged || isPreAlertChanged || isVARChanged);

    const isTabValid = !errors[tab];
    const allowSaveTab =
        isTabValid &&
        !isSaving &&
        !isSubmitting &&
        canSaveTab(tab, initialValues, values);
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
            if (key === VRF) {
                setInitialValues({
                    [key]: {
                        ...value,
                        // parsing the value, as NumberInput will automatically do it in the form, which will make theinterface believe the value has been changed
                        wastage_rate_used_on_vrf: parseFloat(
                            value.wastage_rate_used_on_vrf,
                        ),
                    },
                });
            } else {
                setInitialValues({
                    [key]: value[key],
                });
            }
        }
    }, [key, setFieldValue, setInitialValues, value]);
};

// Needs to be passed a useCallback, so we can have a static deps array for the internal useEffect
export const useSkipEffectUntilValue = (
    value: Optional<any>,
    callback: () => void,
): void => {
    const watcher = useRef(undefined);

    useEffect(() => {
        if (value && !watcher.current) {
            watcher.current = value;
        }
        if (value !== watcher.current) {
            callback();
        }
    }, [callback, value]);
};
