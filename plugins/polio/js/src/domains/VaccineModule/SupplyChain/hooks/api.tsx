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

const saveVar = async supplyChainData => {
    const toCreate: any = [];
    const toUpdate: any = [];
    supplyChainData.var.forEach(arrivalReport => {
        if (arrivalReport.id) {
            toUpdate.push(arrivalReport);
        } else {
            toCreate.push(arrivalReport);
        }
    });

    const updated = await patchRequest(
        `${apiUrl}${supplyChainData.vrf.id}/update_arrival_reports/`,
        { arrival_reports: toUpdate },
    );

    const created = await postRequest(
        `${apiUrl}${supplyChainData.vrf.id}/add_arrival_reports/`,
        { arrival_reports: toCreate },
    );

    return {
        arrival_reports: [
            ...updated.arrival_reports,
            ...created.arrival_reports,
        ],
    };
};
const savePreAlert = async supplyChainData => {
    const { pre_alerts } = supplyChainData;
    const toCreate: any = [];
    const toUpdate: any = [];
    pre_alerts.forEach(preAlert => {
        if (preAlert.id) {
            toUpdate.push(preAlert);
        } else {
            toCreate.push(preAlert);
        }
    });

    const updated = await patchRequest(
        `${apiUrl}${supplyChainData.vrf.id}/update_pre_alerts/`,
        { pre_alerts: toUpdate },
    );

    const created = await postRequest(
        `${apiUrl}${supplyChainData.vrf.id}/add_pre_alerts/`,
        { pre_alerts: toCreate },
    );

    return { prealert: [...updated.pre_alerts, ...created.pre_alerts] };
};

const saveSupplyChainForm = async supplyChainData => {
    if (supplyChainData.saveAll === true) {
        // update all tabs
    } else {
        switch (supplyChainData.activeTab) {
            case VRF:
                return mockSaveVrf(supplyChainData.vrf);
            case VAR:
                if (supplyChainData.vrf.id === 6) {
                    return saveVar(supplyChainData);
                }
                break;
            case PREALERT:
                if (supplyChainData.vrf.id === 6) {
                    return savePreAlert(supplyChainData);
                }
                break;
            default:
                break;
        }
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
            onSuccess: (data: any, variables: any) => {
                if (variables.activeTab === VRF && data) {
                    queryClient.setQueryData(['getVrfDetails', data.id], data);
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
        const vaccines = (selectedCampaign?.vaccines ?? '')
            .split(',')
            .map(vaccineName => ({ label: vaccineName, value: vaccineName }));
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
