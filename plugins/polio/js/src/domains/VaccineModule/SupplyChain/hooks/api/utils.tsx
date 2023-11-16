/* eslint-disable camelcase */
import { Dispatch } from 'redux';
import {
    patchRequest,
    postRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    PREALERT,
    TabValue,
    VAR,
    VRF,
} from '../../Details/VaccineSupplyChainDetails';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import { enqueueSnackbar } from '../../../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import MESSAGES from '../../messages';
import { Optional } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const apiUrl = '/api/polio/vaccine/request_forms/';

export type ParsedSettledPromise = {
    status: 'fulfilled' | 'rejected';
    value: any; // if success: api response, if failure: error message
};

export const prepareData = (data: any[]) => {
    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    const toDelete: any[] = [];
    data.forEach(item => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { to_delete, ...dataToPass } = item;
        if (item.id) {
            if (!to_delete) {
                toUpdate.push(dataToPass);
            } else {
                toDelete.push(dataToPass);
            }
        } else if (!to_delete) {
            // Temporary solution to handle users creating then deleting prealerts in the UI
            toCreate.push(dataToPass);
        }
    });
    return { toCreate, toUpdate, toDelete };
};

export const saveTab = (key, supplyChainData): Promise<any>[] => {
    const toCreate: any = [];
    const toUpdate: any = [];
    const toDelete: any = [];
    const promises: Promise<any>[] = [];
    supplyChainData.arrival_reports.forEach(arrivalReport => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { to_delete, ...dataToPass } = arrivalReport;
        if (arrivalReport.id) {
            if (!to_delete) {
                toUpdate.push(dataToPass);
            } else {
                toDelete.push(dataToPass);
            }
        } else if (!to_delete) {
            // Temporary solution to handle users creating then deleting prealerts in the UI
            toCreate.push(dataToPass);
        }
    });
    if (toUpdate.length > 0) {
        promises.push(
            patchRequest(`${apiUrl}${supplyChainData.vrf.id}/update_${key}/`, {
                [key]: toUpdate,
            }),
        );
    }
    if (toCreate.length > 0) {
        promises.push(
            postRequest(`${apiUrl}${supplyChainData.vrf.id}/add_${key}/`, {
                [key]: toCreate,
            }),
        );
    }
    // if (toDelete.length > 0) {
    //     toDelete.forEach(item => {
    //         promises.push(
    //             deleteRequest(`${apiUrl}${item.id}/delete_${key}/`),
    //         );
    //     });
    // }
    // console.log('To delete', toDelete);
    return promises;
};

export const normalizePromiseResult = (
    settledPromise: PromiseSettledResult<any>,
): ParsedSettledPromise => {
    // TS thinks value does not exist because it does not exist on rejected promises
    // @ts-ignore
    const { status, value } = settledPromise;
    const result = { status, value };
    if (!result.value) {
        // If the promise is rejected, we include the message, so we can use the url to figure out
        // which call failed and update react-query's cache accordingly
        result.value = {
            // TS thinks reason does not exist because it does not exist on fulfilled promises
            // @ts-ignore
            ...settledPromise.reason.details,
            // @ts-ignore
            message: settledPromise.reason.message,
        };
    }
    return result;
};

export const findPromiseOrigin = (
    settledPromise: PromiseSettledResult<any>,
): Optional<TabValue> => {
    if (!settledPromise) {
        throw new Error(
            `findPromiseOrigin expected PromiseSettledResult, got ${settledPromise}`,
        );
    }

    const { value, reason } = Array.isArray(settledPromise)
        ? settledPromise[0] ?? {}
        : settledPromise;
    // If there's no arrival reports or no pre alerts, settledPromise may be an empty array.
    // In this case we return undefined to skip adding an entry to the aggregated response when using saveAll
    if (!value && !reason) {
        return undefined;
    }
    const foundValue = value
        ? Object.keys(value)[0]
        : Object.keys(reason.details)[0];

    return foundValue === VAR || foundValue === PREALERT ? foundValue : VRF;
};

export const addEntryToResponse = (response, update): void => {
    const key = findPromiseOrigin(update.value);
    if (key === VRF) {
        response[key] = normalizePromiseResult(update);
    } else if (key) {
        const convertedArray: any[] = update.value.map(item =>
            normalizePromiseResult(item),
        );
        response[key] = convertedArray;
    }
};

export const parsePromiseResults = (
    allUpdates: (PromiseSettledResult<any> | PromiseSettledResult<any>[])[],
): any => {
    // if length == 3, all tabs have been updated, and we know the order: vrf, prealert, var
    if (allUpdates.length === 3) {
        // there's only 1 vrf, so we don't have an array here
        const vrf = normalizePromiseResult(
            allUpdates[0] as PromiseSettledResult<any>,
        );
        const preAlerts: any[] = (
            allUpdates[1] as PromiseSettledResult<any>[]
        ).map(item => normalizePromiseResult(item));

        const arrival_reports: any[] = (
            allUpdates[2] as PromiseSettledResult<any>[]
        ).map(item => normalizePromiseResult(item));
        return { vrf, preAlerts, arrival_reports };
    }
    if (allUpdates.length === 2) {
        const response: any = {};
        allUpdates.forEach(update => {
            addEntryToResponse(response, update);
        });
        return response;
    }
    if (allUpdates.length === 1) {
        const response: any = {};
        const [update] = allUpdates;
        addEntryToResponse(response, update);
        return response;
    }
    throw new Error(`Expected array of length 1-3, got ${allUpdates.length}`);
};

export const handlePromiseErrors = (data: any, dispatch: Dispatch): void => {
    const failedPromises = data.filter(item => item.status === 'rejected');
    if (failedPromises.length === 0) {
        dispatch(
            enqueueSnackbar(
                succesfullSnackBar(
                    undefined,
                    MESSAGES.defaultMutationApiSuccess,
                ),
            ),
        );
    } else {
        const failedEndpoints = failedPromises.map(item => item.value.message);
        if (failedEndpoints.find(msg => msg.includes('add'))) {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar(
                        undefined,
                        MESSAGES.defaultMutationApiError,
                        failedPromises.find(item =>
                            item.value.message.includes('add'),
                        )?.value,
                    ),
                ),
            );
        }
        if (failedEndpoints.find(msg => msg.includes('update'))) {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar(
                        undefined,
                        MESSAGES.defaultMutationApiError,
                        failedPromises.find(item =>
                            item.value.message.includes('update'),
                        )?.value,
                    ),
                ),
            );
        }
        if (failedEndpoints.find(msg => msg.includes('delete'))) {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar(
                        undefined,
                        MESSAGES.defaultMutationApiError,
                        failedPromises.find(item =>
                            item.value.message.includes('delete'),
                        )?.value,
                    ),
                ),
            );
        }
    }
};
