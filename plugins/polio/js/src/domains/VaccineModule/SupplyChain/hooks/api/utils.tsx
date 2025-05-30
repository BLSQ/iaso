import { openSnackBar } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/snackBars/EventDispatcher';
import { deleteRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import { Optional } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { PREALERT, VAR, VRF, apiUrl } from '../../constants';
import MESSAGES from '../../messages';
import {
    ParsedSettledPromise,
    SupplyChainFormData,
    TabValue,
} from '../../types';

var GetFileBlobUsingURL = function (url, convertBlob) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.addEventListener('load', function () {
        convertBlob(xhr.response);
    });
    xhr.send();
};

var blobToFile = function (blob, name) {
    blob.lastModifiedDate = new Date();
    blob.name = name;
    return blob;
};

var GetFileObjectFromURL = function (filePathOrUrl, fileName, convertBlob) {
    GetFileBlobUsingURL(filePathOrUrl, function (blob) {
        convertBlob(blobToFile(blob, fileName));
    });
};

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
                ? lot_numbers
                      .split(',')
                      .map((number: string) => parseInt(number.trim(), 10))
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

    const createOrUpdateRequest = (url: string, data: any) => {
        const formData = new FormData();

        data.forEach((item: any, index: number) => {
            Object.keys(item).forEach(keyy => {
                if (keyy === 'document' && item[keyy]) {
                    if (Array.isArray(item[keyy])) {
                        formData.append(
                            `${key}[${index}].${keyy}`,
                            item[keyy][0],
                        );
                    } else if (typeof item[keyy] === 'string') {
                        const filePath = item[keyy];
                        const fileName = filePath.split('/').pop();
                        GetFileObjectFromURL(filePath, fileName, fileBlob => {
                            const fileObject = new File(
                                [fileBlob],
                                fileBlob.name,
                            );
                            formData.append(
                                `${key}[${index}].${keyy}`,
                                fileObject,
                            );
                        });
                    }
                } else if (item[keyy] !== null && item[keyy] !== undefined) {
                    formData.append(`${key}[${index}].${keyy}`, item[keyy]);
                }
            });
        });

        // eslint-disable-next-line no-nested-ternary
        const method = url.includes('update')
            ? 'PATCH'
            : url.includes('add')
              ? 'POST'
              : 'GET';
        return fetch(url, {
            method,
            body: formData,
        });
    };

    if (toUpdate.length > 0) {
        promises.push(
            createOrUpdateRequest(
                `${apiUrl}${supplyChainData?.vrf?.id}/update_${key}/`,
                toUpdate,
            ),
        );
    }
    if (toCreate.length > 0) {
        promises.push(
            createOrUpdateRequest(
                `${apiUrl}${supplyChainData?.vrf?.id}/add_${key}/`,
                toCreate,
            ),
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

export const findPromiseOrigin = (url: string): Optional<TabValue> => {
    if (!url) {
        return VRF;
    }

    if (url.includes(PREALERT)) return PREALERT;
    if (url.includes(VAR)) return VAR;
    return VRF;
};

export const addEntryToResponse = (
    response: Record<string, any>,
    update: PromiseFulfilledResult<any>,
): void => {
    const key = findPromiseOrigin(update.value.url);
    if (key) {
        if (!response[key]) {
            response[key] = [];
        }
        response[key].push(normalizePromiseResult(update));
    }
};

export const parsePromiseResults = (
    allUpdates: PromiseFulfilledResult<PromiseSettledResult<any>[]>[],
): Record<string, ParsedSettledPromise<any>> => {
    const response: Record<string, ParsedSettledPromise<any>> = {};
    allUpdates.forEach(update => {
        addEntryToResponse(response, update);
    });
    return response;
};

type HandlePromiseErrorsArgs = {
    data: ParsedSettledPromise<any>[];
    key: 'pre_alerts' | 'arrival_reports';
};

export const handlePromiseErrors = ({
    data,
    key,
}: HandlePromiseErrorsArgs): void => {
    const failedPromises = data.filter(item => item.value.status >= 400);

    if (failedPromises.length === 0) {
        const messageKey = `${key}ApiSuccess`;
        openSnackBar(succesfullSnackBar(key, MESSAGES[messageKey]));
    } else {
        const failedEndpoints = failedPromises.map(item => item.value.url);
        if (failedEndpoints.find(url => url.includes('add'))) {
            const messageKey = `${key}CreateError`;
            openSnackBar(
                errorSnackBar(
                    key,
                    MESSAGES[messageKey],
                    failedPromises.find(item => item.value.url.includes('add'))
                        ?.value.statusText,
                ),
            );
        }
        if (failedEndpoints.find(url => url.includes('update'))) {
            const messageKey = `${key}UpdateError`;

            openSnackBar(
                errorSnackBar(
                    key,
                    MESSAGES[messageKey],
                    failedPromises.find(item =>
                        item.value.url.includes('update'),
                    )?.value.statusText,
                ),
            );
        }
        if (failedEndpoints.find(url => url.includes('delete'))) {
            const messageKey = `${key}DeleteError`;
            openSnackBar(
                errorSnackBar(
                    key,
                    MESSAGES[messageKey],
                    failedPromises.find(item =>
                        item.value.message.includes('delete'),
                    )?.value.statusText,
                ),
            );
        }
    }
};
