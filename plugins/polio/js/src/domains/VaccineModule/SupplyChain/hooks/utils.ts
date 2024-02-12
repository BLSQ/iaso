/* eslint-disable camelcase */
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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
    VRF as VRFType,
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
    to_delete: false,
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
    to_delete: false,
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
    const hasNewElements =
        (values[tab] ?? []).length > (initialValues[tab] ?? []).length;

    // If there's no new preAlert/arrivalReport, we just check that values have changed
    if (!hasNewElements) {
        return !isEqual(initialValues[tab], values[tab]);
    }
    const newElements = values[tab]
        ? // @ts-ignore we check that values[tab] is not undefined, so the ts error is wrong
          values[tab].slice(initialValues[tab].length - 1)
        : [];
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
    const [allowSaveTab, setAllowSaveTab] = useState<boolean>(false);
    const [allowSaveAll, setAllowSaveAll] = useState<boolean>(false);
    const { isValid, isSubmitting, values, errors } = formik;
    const { vrf, pre_alerts, arrival_reports } = values;

    // Putting all in a useEffect because previous version with useMemo wouldn't refresh
    // data when formik values would change
    useEffect(() => {
        const isPreAlertChanged = canSaveTab(PREALERT, initialValues, values);
        const isVARChanged = canSaveTab(VAR, initialValues, values);
        const isVRFChanged = canSaveTab(VRF, initialValues, values);
        const isTabValid = !errors[tab];

        setAllowSaveAll(
            isValid &&
                !isSaving &&
                !isSubmitting &&
                (isVRFChanged || isPreAlertChanged || isVARChanged),
        );
        setAllowSaveTab(
            isTabValid &&
                !isSaving &&
                !isSubmitting &&
                canSaveTab(tab, initialValues, values),
        );
    }, [
        initialValues,
        isSaving,
        isSubmitting,
        isValid,
        tab,
        values,
        vrf,
        pre_alerts,
        arrival_reports,
        errors,
    ]);
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

type UseInitializeVRFValueOnFetchArgs = {
    vrf?: VRFType;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
    setInitialValues: React.Dispatch<Partial<SupplyChainFormData>>;
};

export const useInitializeVRFOnFetch = ({
    vrf,
    setFieldValue,
    setInitialValues,
}: UseInitializeVRFValueOnFetchArgs): void => {
    useEffect(() => {
        if (vrf) {
            const wastageRate =
                vrf.wastage_rate_used_on_vrf === null ||
                vrf.wastage_rate_used_on_vrf === undefined
                    ? vrf.wastage_rate_used_on_vrf
                    : parseFloat(vrf.wastage_rate_used_on_vrf as string);
            const formattedValue = {
                ...vrf,
                // parsing the value, as NumberInput will automatically do it in the form, which will make theinterface believe the value has been changed
                wastage_rate_used_on_vrf: wastageRate,
            };
            setFieldValue(VRF, formattedValue);
            setInitialValues({
                [VRF]: formattedValue,
            });
        }
    }, [setFieldValue, setInitialValues, vrf]);
};

type UseInitializePreAlertsValueOnFetchArgs = {
    preAlerts?: PreAlert[];
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
    setInitialValues: React.Dispatch<Partial<SupplyChainFormData>>;
};
export const useInitializePreAlertsOnFetch = ({
    preAlerts,
    setFieldValue,
    setInitialValues,
}: UseInitializePreAlertsValueOnFetchArgs): void => {
    useEffect(() => {
        if (preAlerts) {
            const formattedValue = preAlerts[PREALERT].map(preAlert => {
                // parsing the value, as NumberInput will automatically do it in the form, which will make theinterface believe the value has been changed
                const dosesShipped =
                    preAlert.doses_shipped === null ||
                    preAlert.doses_shipped === undefined
                        ? preAlert.doses_shipped
                        : parseFloat(preAlert.doses_shipped as string);
                return {
                    ...preAlert,
                    doses_shipped: dosesShipped,
                    to_delete: false,
                };
            });
            setFieldValue(PREALERT, formattedValue);
            setInitialValues({
                [PREALERT]: formattedValue,
            });
        }
    }, [preAlerts, setFieldValue, setInitialValues]);
};
type UseInitializeArrivalReportsValueOnFetchArgs = {
    arrivalReports?: VARType[];
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
    setInitialValues: React.Dispatch<Partial<SupplyChainFormData>>;
};
export const useInitializeArrivalReportsOnFetch = ({
    arrivalReports,
    setFieldValue,
    setInitialValues,
}: UseInitializeArrivalReportsValueOnFetchArgs): void => {
    useEffect(() => {
        if (arrivalReports) {
            const formattedValue = arrivalReports[VAR].map(arrivalReport => {
                // parsing the value, as NumberInput will automatically do it in the form, which will make theinterface believe the value has been changed
                const dosesShipped =
                    arrivalReport.doses_shipped === null ||
                    arrivalReport.doses_shipped === undefined
                        ? arrivalReport.doses_shipped
                        : parseFloat(arrivalReport.doses_shipped as string);
                // parsing the value, as NumberInput will automatically do it in the form, which will make theinterface believe the value has been changed
                const dosesReceived =
                    arrivalReport.doses_received === null ||
                    arrivalReport.doses_received === undefined
                        ? arrivalReport.doses_received
                        : parseFloat(arrivalReport.doses_received as string);

                return {
                    ...arrivalReport,
                    doses_shipped: dosesShipped,
                    doses_received: dosesReceived,
                    to_delete: false,
                };
            });
            setFieldValue(VAR, formattedValue);
            setInitialValues({
                [VAR]: formattedValue,
            });
        }
    }, [arrivalReports, setFieldValue, setInitialValues]);
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
