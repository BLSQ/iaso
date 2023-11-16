/* eslint-disable camelcase */
import { useMemo } from 'react';
import { UseMutationResult, UseQueryResult, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useGetCountries } from '../../../../hooks/useGetCountries';
import {
    PREALERT,
    TabValue,
    VAR,
    VRF,
} from '../Details/VaccineSupplyChainDetails';
import { mockSaveVrf, mockVRF } from './mocks';
import {
    CAMPAIGNS_ENDPOINT,
    CampaignType,
    useGetCampaigns,
} from '../../../Campaigns/hooks/api/useGetCampaigns';
import { Campaign } from '../../../../constants/types';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import { enqueueSnackbar } from '../../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import MESSAGES from '../messages';

export const apiUrl = '/api/polio/vaccine/request_forms/';
const defaults = {
    order: 'country',
    pageSize: 20,
    page: 1,
};
const getVrfList = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${apiUrl}?${queryString}`);
};

export const useGetVrfList = params => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    return useSnackQuery({
        queryKey: [
            'getVrfList',
            apiParams,
            apiParams.page,
            apiParams.limit,
            apiParams.order,
        ],
        queryFn: () => getVrfList(apiParams),
        options: {
            select: data => {
                if (!data) return { results: [] };
                return data;
            },
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

const deleteVrf = id => {
    return deleteRequest(`${apiUrl}${id}`);
};

export const useDeleteVrf = () => {
    return useSnackMutation({
        mutationFn: deleteVrf,
        invalidateQueryKey: ['getVrfList'],
    });
};

export const useGetCountriesOptions = (enabled = true) => {
    const { data: countries, isFetching } = useGetCountries('VALID', enabled);
    return useMemo(() => {
        const options = countries
            ? countries.orgUnits.map(country => {
                  return {
                      label: country.name,
                      value: country.id,
                  };
              })
            : [];
        return { data: options, isFetching };
    }, [countries, isFetching]);
};

// TODO rename, since we don't save yet
const saveVars = (supplyChainData): Promise<any>[] => {
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
            patchRequest(
                `${apiUrl}${supplyChainData.vrf.id}/update_arrival_reports/`,
                { arrival_reports: toUpdate },
            ),
        );
    }
    if (toCreate.length > 0) {
        promises.push(
            postRequest(
                `${apiUrl}${supplyChainData.vrf.id}/add_arrival_reports/`,
                { arrival_reports: toCreate },
            ),
        );
    }
    // console.log('Arrival reports to delete', toDelete);
    return promises;
};

const savePreAlerts = (supplyChainData: any): Promise<any>[] => {
    const { pre_alerts } = supplyChainData;
    const toCreate: any = [];
    const toUpdate: any = [];
    const toDelete: any = [];
    const promises: Promise<any>[] = [];

    pre_alerts.forEach(preAlert => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { to_delete, ...dataToPass } = preAlert;
        if (preAlert.id) {
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
                `${apiUrl}${supplyChainData.vrf.id}/update_pre_alerts/`,
                { pre_alerts: toUpdate },
            ),
        );
    }
    if (toCreate.length > 0) {
        promises.push(
            postRequest(`${apiUrl}${supplyChainData.vrf.id}/add_pre_alerts/`, {
                pre_alerts: toCreate,
            }),
        );
    }

    // console.log('PreAlerts to delete', toDelete);
    return promises;
};

const saveVrf = supplyChainData => {
    const { vrf } = supplyChainData;
    if (vrf.id) {
        return patchRequest(`${apiUrl}${supplyChainData.vrf.id}/`, vrf);
    }
    return postRequest(apiUrl, vrf);
};

export type ParsedSettledPromise = {
    status: 'fulfilled' | 'rejected';
    value: any; // if success: api response, if failure: error message
};

const normalizePromiseResult = (
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

const findPromiseOrigin = (
    settledPromise: PromiseSettledResult<any>,
): TabValue => {
    if (!settledPromise) {
        throw new Error(
            `findPromiseOrigin expected PromiseSettledResult, got ${settledPromise}`,
        );
    }

    const { value, reason } = Array.isArray(settledPromise)
        ? settledPromise[0]
        : settledPromise;

    if (value) {
        return Object.keys(value)[0] as TabValue;
    }
    return Object.keys(reason.details)[0] as TabValue;
};

const addEntryToResponse = (response, update): void => {
    const key = findPromiseOrigin(update.value);
    if (key === VRF) {
        response[key] = normalizePromiseResult(update);
    } else {
        const convertedArray: any[] = update.value.map(item =>
            normalizePromiseResult(item),
        );
        response[key] = convertedArray;
    }
};

const parsePromiseResults = (
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

const saveSupplyChainForm = async (supplyChainData: any) => {
    if (supplyChainData.saveAll === true && supplyChainData.vrf.id) {
        const promises: Promise<any>[] = [];

        // update all tabs
        if (supplyChainData.changedTabs.includes(VRF)) {
            promises.push(mockSaveVrf(supplyChainData.vrf));
        }
        if (supplyChainData.changedTabs.includes(PREALERT)) {
            promises.push(Promise.allSettled(savePreAlerts(supplyChainData)));
        }
        if (supplyChainData.changedTabs.includes(VAR)) {
            promises.push(Promise.allSettled(saveVars(supplyChainData)));
        }

        const allUpdates = await Promise.allSettled(promises);
        return parsePromiseResults(allUpdates);
    }
    // We can't save prealerts or var if there's no preexisting vrf
    if (supplyChainData.saveAll === true) {
        return mockSaveVrf(supplyChainData.vrf);
    }
    switch (supplyChainData.activeTab) {
        case VRF:
            return mockSaveVrf(supplyChainData.vrf);
        case VAR:
            if (supplyChainData.vrf.id === 6) {
                const newVars = await Promise.allSettled(
                    saveVars(supplyChainData),
                );
                return {
                    arrival_reports: newVars.map(item =>
                        normalizePromiseResult(item),
                    ),
                };
            }
            break;
        case PREALERT:
            if (supplyChainData.vrf.id === 6) {
                const newPreAlerts = await Promise.allSettled(
                    savePreAlerts(supplyChainData),
                );
                return {
                    pre_alerts: newPreAlerts.map(item =>
                        normalizePromiseResult(item),
                    ),
                };
            }
            break;
        default:
            break;
    }

    return null;
};

const handlePromiseErrors = (data: any, dispatch: Dispatch): void => {
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

export const useSaveVaccineSupplyChainForm = (): UseMutationResult<
    any,
    any
> => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    // use queryClient.setQueryData to overwrite the cache. see optimistic updates in react query
    return useSnackMutation({
        mutationFn: saveSupplyChainForm,
        invalidateQueryKey: ['getVrfList'],
        showSucessSnackBar: false,
        ignoreErrorCodes: [400],
        options: {
            // Setting the cache value with the response onSuccess, so we can reset the form state (touched, etc) without losing data
            onSuccess: (data: any, variables: any) => {
                if (variables.saveAll && data) {
                    if (data.pre_alerts) {
                        const { pre_alerts } = data;
                        handlePromiseErrors(pre_alerts, dispatch);
                        queryClient.invalidateQueries('preAlertDetails');
                    }
                    if (data.arrival_reports) {
                        const { arrival_reports } = data;
                        handlePromiseErrors(arrival_reports, dispatch);
                        queryClient.invalidateQueries('arrivalReportsDetails');
                    }
                } else {
                    if (variables.activeTab === PREALERT && data.pre_alerts) {
                        const { pre_alerts } = data;
                        handlePromiseErrors(pre_alerts, dispatch);
                        queryClient.invalidateQueries('preAlertDetails');
                    }
                    if (variables.activeTab === VAR && data.arrival_reports) {
                        const { arrival_reports } = data;
                        handlePromiseErrors(arrival_reports, dispatch);
                        queryClient.invalidateQueries('arrivalReportsDetails');
                    }
                }

                // if (variables.activeTab === VRF && data) {
                //     queryClient.setQueryData(['getVrfDetails', data.id], data);
                // } else if (variables.saveAll && data) {
                //     queryClient.setQueryData(
                //         ['getVrfDetails', data.vrf.id],
                //         data.vrf,
                //     );
                // }
            },
        },
    });
};

const getVrfDetails = (id?: string) => {
    return getRequest(`${apiUrl}${id}`);
};

export const useGetVrfDetails = (id?: string): UseQueryResult => {
    return useSnackQuery({
        queryKey: ['getVrfDetails', id],
        queryFn: () => getVrfDetails(id),
        options: {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            enabled: Boolean(id),
            select: data => {
                if (!data) return data;
                return mockVRF;
            },
        },
    });
};

// This is just to avoid a warning polluting the console
const defaultVaccineOptions = [
    {
        label: 'nOPV2',
        value: 'nOPV2',
    },
    {
        label: 'mOPV2',
        value: 'mOPV2',
    },
    {
        label: 'bOPV',
        value: 'bOPV',
    },
];

export const useCampaignDropDowns = (
    countryId?: number,
    campaign?: string,
    vaccine?: string,
) => {
    const options = {
        enabled: Boolean(countryId),
        countries: countryId ? [`${countryId}`] : undefined,
        campaignType: 'regular' as CampaignType,
    };

    const { data, isFetching } = useGetCampaigns(options, CAMPAIGNS_ENDPOINT);

    return useMemo(() => {
        const list = (data as Campaign[]) ?? [];
        const selectedCampaign = list.find(c => c.obr_name === campaign);
        const campaigns = list.map(c => ({
            label: c.obr_name,
            value: c.obr_name,
        }));
        const vaccines = selectedCampaign?.vaccines
            ? selectedCampaign.vaccines.split(',').map(vaccineName => ({
                  label: vaccineName,
                  value: vaccineName,
              }))
            : defaultVaccineOptions;
        const rounds = vaccine
            ? (selectedCampaign?.rounds ?? [])
                  .filter(round => round.vaccine_names.includes(vaccine))
                  .map(round => ({
                      label: `Round ${round.number}`,
                      value: `${round.number}`,
                  }))
            : [];
        return {
            campaigns,
            vaccines,
            rounds,
            isFetching,
        };
    }, [data, vaccine, isFetching, campaign]);
};

export const useGetPreAlertDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_pre_alerts/`),
        queryKey: ['preAlertDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};
export const useGetArrivalReportsDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_arrival_reports/`),
        queryKey: ['arrivalReportsDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};
