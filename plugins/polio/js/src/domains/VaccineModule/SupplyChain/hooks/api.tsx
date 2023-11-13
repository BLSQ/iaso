/* eslint-disable camelcase */
import { useMemo } from 'react';
import { UseMutationResult, UseQueryResult, useQueryClient } from 'react-query';
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
import { PREALERT, VAR, VRF } from '../Details/VaccineSupplyChainDetails';
import { mockSaveVrf, mockVRF } from './mocks';
import { waitFor } from '../../../../../../../../hat/assets/js/apps/Iaso/utils';
import {
    CAMPAIGNS_ENDPOINT,
    CampaignType,
    useGetCampaigns,
} from '../../../Campaigns/hooks/api/useGetCampaigns';
import { Campaign } from '../../../../constants/types';

const apiUrl = '/api/polio/vaccine/request_forms/';
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

const saveVars = async supplyChainData => {
    const toCreate: any = [];
    const toUpdate: any = [];
    const toDelete: any = [];
    supplyChainData.vars.forEach(arrivalReport => {
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

    const updated =
        toUpdate.length > 0
            ? await patchRequest(
                  `${apiUrl}${supplyChainData.vrf.id}/update_arrival_reports/`,
                  { arrival_reports: toUpdate },
              )
            : { arrival_reports: [] };

    const created =
        toCreate.length > 0
            ? await postRequest(
                  `${apiUrl}${supplyChainData.vrf.id}/add_arrival_reports/`,
                  { arrival_reports: toCreate },
              )
            : { arrival_reports: [] };

    console.log('Arrival reports to delete', toDelete);

    // const deleted =
    //     toDelete.length > 0
    //         ? await postRequest(
    //               `${apiUrl}${supplyChainData.vrf.id}/delete_pre_alerts/`,
    //               { pre_alerts: toDelete },
    //           )
    //         : undefined;

    return {
        arrival_reports: [
            ...updated.arrival_reports,
            ...created.arrival_reports,
        ],
    };
};
const savePreAlerts = async supplyChainData => {
    const { pre_alerts } = supplyChainData;
    const toCreate: any = [];
    const toUpdate: any = [];
    const toDelete: any = [];
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

    const updated =
        toUpdate.length > 0
            ? await patchRequest(
                  `${apiUrl}${supplyChainData.vrf.id}/update_pre_alerts/`,
                  { pre_alerts: toUpdate },
              )
            : { pre_alerts: [] };

    const created =
        toCreate.length > 0
            ? await postRequest(
                  `${apiUrl}${supplyChainData.vrf.id}/add_pre_alerts/`,
                  { pre_alerts: toCreate },
              )
            : { pre_alerts: [] };

    console.log('PreAlerts to delete', toDelete);

    // const deleted =
    //     toDelete.length > 0
    //         ? await postRequest(
    //               `${apiUrl}${supplyChainData.vrf.id}/delete_pre_alerts/`,
    //               { pre_alerts: toDelete },
    //           )
    //         : undefined;

    return { prealert: [...updated.pre_alerts, ...created.pre_alerts] };
};

const saveVrf = supplyChainData => {
    const { vrf } = supplyChainData;
    if (vrf.id) {
        return patchRequest(`${apiUrl}${supplyChainData.vrf.id}/`, vrf);
    }
    return postRequest(apiUrl, vrf);
};

const saveSupplyChainForm = async (supplyChainData: any) => {
    console.log('PAYLOAD', supplyChainData);
    if (supplyChainData.saveAll === true && supplyChainData.vrf.id) {
        let vrf;
        let pre_alerts;
        let vars;
        const response: any = {};
        // update all tabs
        if (supplyChainData.changedTabs.includes(VRF)) {
            vrf = await mockSaveVrf(supplyChainData.vrf);
        }
        if (supplyChainData.changedTabs.includes(PREALERT)) {
            pre_alerts = await savePreAlerts(supplyChainData);
        }
        if (supplyChainData.changedTabs.includes(VAR)) {
            vars = await saveVars(supplyChainData);
        }
        // build response
        if (vrf) {
            response.vrf = vrf;
        }
        if (pre_alerts) {
            response.pre_alerts = pre_alerts;
        }
        if (vars) {
            response.vars = vars;
        }
        return response;
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
                return saveVars(supplyChainData);
            }
            break;
        case PREALERT:
            if (supplyChainData.vrf.id === 6) {
                return savePreAlerts(supplyChainData);
            }
            break;
        default:
            break;
    }

    waitFor(100);
    return null;
};

export const useSaveVaccineSupplyChainForm = (): UseMutationResult<
    any,
    any
> => {
    const queryClient = useQueryClient();
    // use queryClient.setQueryData to overwrite the cache. see optimistic updates in react query
    return useSnackMutation({
        mutationFn: saveSupplyChainForm,
        invalidateQueryKey: ['getVrfList'],
        showSucessSnackBar: false,
        ignoreErrorCodes: [400],
        options: {
            // Setting the cache value with the response onSuccess, so we can reset the form state (touched, etc) without losing data
            onSuccess: (data: any, variables: any) => {
                if (variables.activeTab === VRF && data) {
                    queryClient.setQueryData(['getVrfDetails', data.id], data);
                } else if (variables.activeTab === PREALERT && data) {
                    queryClient.setQueryData(
                        ['preAlertDetails', variables.vrf.id],
                        data,
                    );
                } else if (variables.activeTab === VAR && data) {
                    queryClient.setQueryData(
                        ['arrivalReportsDetails', variables.vrf.id],
                        data,
                    );
                } else if (variables.saveAll && data) {
                    queryClient.setQueryData(
                        ['getVrfDetails', data.vrf.id],
                        data.vrf,
                    );
                    queryClient.setQueryData(
                        ['preAlertDetails', data.vrf.id],
                        data.pre_alerts,
                    );
                    queryClient.setQueryData(
                        ['arrivalReportsDetails', data.vrf.id],
                        data.vars,
                    );
                }
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
