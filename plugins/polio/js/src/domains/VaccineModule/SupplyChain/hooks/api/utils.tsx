/* eslint-disable camelcase */
import { Dispatch } from 'redux';
import {
    deleteRequest,
    patchRequest,
    postRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import { enqueueSnackbar } from '../../../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import MESSAGES from '../../messages';
import { Optional } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { PREALERT, VAR, VRF, apiUrl } from '../../constants';
import {
    ParsedSettledPromise,
    SupplyChainFormData,
    TabValue,
} from '../../types';

export const saveTab = (
    key: 'pre_alerts' | 'arrival_reports',
    supplyChainData: SupplyChainFormData,
): Promise<any>[] => {
    const toCreate: any = [];
    const toUpdate: any = [];
    const toDelete: any = [];
    const promises: Promise<any>[] = [];
    supplyChainData?.[key]?.forEach(tabData => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { to_delete, ...dataToPass } = tabData;
        const { lot_numbers } = dataToPass;
        if (!Array.isArray(lot_numbers)) {
            const formattedLotNumbers = lot_numbers
                ? lot_numbers.split(',').map((number: string) => number.trim())
                : undefined;
            dataToPass.lot_numbers = formattedLotNumbers;
        }
        if (tabData.id) {
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
            patchRequest(
                `${apiUrl}${supplyChainData?.vrf?.id}/update_${key}/`,
                {
                    [key]: toUpdate,
                },
            ),
        );
    }
    if (toCreate.length > 0) {
        promises.push(
            postRequest(`${apiUrl}${supplyChainData?.vrf?.id}/add_${key}/`, {
                [key]: toCreate,
            }),
        );
    }
    if (toDelete.length > 0) {
        toDelete.forEach(item => {
            promises.push(
                deleteRequest(
                    `${apiUrl}${item.id}/delete_${key}/?id=${item.id}`,
                ),
            );
        });
    }
    return promises;
};

export const normalizePromiseResult = (
    settledPromise: PromiseSettledResult<any>,
): ParsedSettledPromise<any> => {
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
    settledPromise: PromiseSettledResult<any>[],
): Optional<TabValue> => {
    if (!settledPromise) {
        throw new Error(
            `findPromiseOrigin expected PromiseSettledResult, got ${settledPromise}`,
        );
    }

    // @ts-ignore
    const { value, reason } = settledPromise[0] ?? {};

    // If there's no arrival reports or no pre alerts, settledPromise may be an empty array.
    // In this case we return undefined to skip adding an entry to the aggregated response when using saveAll
    if (!value && !reason) {
        return undefined;
    }
    const foundValue = value
        ? Object.keys(value)[0]
        : Object.keys(reason.details)[0];
    // Since there's only 1 vrf, the form of the response doesn't provide a key.
    // Since it's also the only tab in that situation, we can infer that if the found value is neither VAR nor PRREALERT, it must be VRF
    return foundValue === VAR || foundValue === PREALERT ? foundValue : VRF;
};

export const addEntryToResponse = (
    response: Record<string, any>,
    update: PromiseFulfilledResult<PromiseSettledResult<any>[]>,
): void => {
    const key = findPromiseOrigin(update.value);
    if (key) {
        const convertedArray: any[] = (
            update.value as PromiseSettledResult<any>[]
        ).map(item => normalizePromiseResult(item));
        response[key] = convertedArray;
    }
};

export const parsePromiseResults = (
    allUpdates: PromiseFulfilledResult<PromiseSettledResult<any>[]>[],
): Record<string, ParsedSettledPromise<any> | ParsedSettledPromise<any>[]> => {
    const response: Record<
        string,
        ParsedSettledPromise<any> | ParsedSettledPromise<any>[]
    > = {};
    allUpdates.forEach(update => {
        addEntryToResponse(response, update);
    });
    return response;
};

export const handlePromiseErrors = (
    data: ParsedSettledPromise<any>[],
    dispatch: Dispatch,
): void => {
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
