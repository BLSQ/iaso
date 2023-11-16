import { useMemo } from 'react';
import { Dispatch } from 'redux';
import { UseQueryResult } from 'react-query';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useUrlParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useApiParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useGetCountries } from '../../../../../hooks/useGetCountries';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import MESSAGES from '../../messages';
import {
    CAMPAIGNS_ENDPOINT,
    CampaignType,
    useGetCampaigns,
} from '../../../../Campaigns/hooks/api/useGetCampaigns';
import { Campaign } from '../../../../../constants/types';
import { enqueueSnackbar } from '../../../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import { apiUrl } from '../../constants';
import { ParsedSettledPromise, VRF } from '../../types';

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
                return {
                    ...data,
                    campaign: data.obr_name,
                    rounds: data.rounds.map(r => r.number),
                    country: data.country_id,
                };
            },
        },
    });
};

export const saveVrf = (vrf): Promise<any>[] => {
    // console.log('DATA', supplyChainData);
    // const { vrf } = supplyChainData;
    const payload = {
        ...vrf,
        rounds: vrf.rounds.map(r => ({ number: r })),
        campaign: { obr_name: vrf.campaign },
    };
    if (vrf.id) {
        return [patchRequest(`${apiUrl}${vrf.id}/`, payload)];
    }
    return [postRequest(apiUrl, payload)];
};

// TODO There's type mismatch between single save an save all
/*

save all:{
    status:fulfilled
    value:[
        {
            status:"rejected",
            reason: ApiError etc --> normal rejected promise
        }
    ]
}

single save:   {
            status:"rejected",
            value: ApiError --> parsed rejected promise
        }

*/
export const handleVrfPromiseErrors = (
    data: ParsedSettledPromise<VRF>,
    dispatch: Dispatch,
): void => {
    console.log('error', data);
    const isSuccessful = data.value.status === 'fulfilled';
    if (isSuccessful) {
        dispatch(
            enqueueSnackbar(
                succesfullSnackBar(
                    undefined,
                    MESSAGES.defaultMutationApiSuccess,
                ),
            ),
        );
    } else {
        const details = Array.isArray(data.value)
            ? // there's only one element in the array
              data.value[0].reason.details
            : data.value;
        dispatch(
            enqueueSnackbar(
                errorSnackBar(
                    undefined,
                    MESSAGES.defaultMutationApiError,
                    details,
                ),
            ),
        );
    }
};
