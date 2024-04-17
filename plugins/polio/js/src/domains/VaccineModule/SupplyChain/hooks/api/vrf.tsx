import { useMemo } from 'react';
import { Dispatch } from 'redux';
import { UseMutationResult, UseQueryResult } from 'react-query';
import {
    UrlParams,
    textPlaceholder,
    renderTagsWithTooltip,
} from 'bluesquare-components';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useUrlParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import {
    FormattedApiParams,
    useApiParams,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
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
    CampaignCategory,
    useGetCampaigns,
} from '../../../../Campaigns/hooks/api/useGetCampaigns';
import { Campaign, Round } from '../../../../../constants/types';
import { enqueueSnackbar } from '../../../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import { apiUrl, defaultVaccineOptions } from '../../constants';
import {
    CampaignDropdowns,
    ParsedSettledPromise,
    VRF,
    VRFFormData,
} from '../../types';
import {
    DropdownOptions,
    DropdownOptionsWithOriginal,
    Optional,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { dateApiToDateRangePicker } from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/dates';

const defaults = {
    order: 'country',
    pageSize: 20,
    page: 1,
};
const getVrfList = (params: FormattedApiParams): Promise<VRF[]> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${apiUrl}?${queryString}`);
};

export const useGetVrfList = (
    params: Partial<UrlParams>,
): UseQueryResult<any, any> => {
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

const deleteVrf = (id: string) => {
    return deleteRequest(`${apiUrl}${id}`);
};

export const useDeleteVrf = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: deleteVrf,
        invalidateQueryKey: ['getVrfList'],
    });
};

export const useGetCountriesOptions = (
    enabled = true,
): { data: DropdownOptions<number>[]; isFetching: boolean } => {
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

export const useCampaignDropDowns = (
    countryId?: number,
    campaign?: string,
    vaccine?: string,
): CampaignDropdowns => {
    const options = {
        enabled: Boolean(countryId),
        countries: countryId ? [`${countryId}`] : undefined,
        campaignCategory: 'regular' as CampaignCategory,
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
                      original: round,
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

const getRoundsForApi = (
    rounds: number[] | string | undefined,
): { number: number }[] | undefined => {
    if (!rounds) return undefined;
    if (Array.isArray(rounds)) return rounds.map(r => ({ number: r }));
    return rounds.split(',').map(r => ({ number: parseInt(r, 10) }));
};

export const saveVrf = (
    vrf: Optional<Partial<VRFFormData>>,
): Promise<any>[] => {
    const payload: Partial<VRF> = {
        ...vrf,
        rounds: getRoundsForApi(vrf?.rounds),
    };
    if (vrf?.id) {
        return [patchRequest(`${apiUrl}${vrf?.id}/`, payload)];
    }
    return [postRequest(apiUrl, payload)];
};

export const handleVrfPromiseErrors = (
    data: ParsedSettledPromise<VRF>[],
    dispatch: Dispatch,
): void => {
    const vrf = data[0];
    const isSuccessful = vrf.status === 'fulfilled';
    if (isSuccessful) {
        dispatch(
            enqueueSnackbar(
                succesfullSnackBar(undefined, MESSAGES.vrfApiSuccess),
            ),
        );
    } else {
        const details = Array.isArray(vrf.value)
            ? // there's only one element in the array
              vrf.value[0].reason.details
            : vrf.value;
        dispatch(
            enqueueSnackbar(
                errorSnackBar(undefined, MESSAGES.vrfApiError, details),
            ),
        );
    }
};

export const getRoundTagTooltipTitle = (
    option: DropdownOptionsWithOriginal<Round>,
): string => {
    const tooltip = `${dateApiToDateRangePicker(
        option.original.started_at,
    )} - ${
        option.original.ended_at
            ? dateApiToDateRangePicker(option.original.ended_at)
            : textPlaceholder
    }`;
    return tooltip;
};

export const renderRoundTag = renderTagsWithTooltip(getRoundTagTooltipTitle);
