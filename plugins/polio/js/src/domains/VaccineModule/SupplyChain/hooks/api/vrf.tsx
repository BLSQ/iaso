import { useMemo } from 'react';
import {
    UrlParams,
    renderTagsWithTooltip,
    textPlaceholder,
} from 'bluesquare-components';
import moment from 'moment';
import { UseMutationResult, UseQueryResult } from 'react-query';
import { openSnackBar } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/snackBars/EventDispatcher';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import {
    FormattedApiParams,
    useApiParams,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useUrlParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import {
    deleteRequest,
    getRequest,
    iasoFetch,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PostArg } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import {
    DropdownOptions,
    DropdownOptionsWithOriginal,
    Optional,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { dateApiToDateRangePicker } from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { Campaign, Round } from '../../../../../constants/types';
import { useGetCountries } from '../../../../../hooks/useGetCountries';
import {
    CAMPAIGNS_ENDPOINT,
    CampaignCategory,
    Options,
    useGetCampaigns,
} from '../../../../Campaigns/hooks/api/useGetCampaigns';
import { apiUrl, singleVaccinesList } from '../../constants';
import MESSAGES from '../../messages';
import {
    CampaignDropdowns,
    ParsedSettledPromise,
    VRF,
    VRFFormData,
} from '../../types';

const defaults = {
    order: '-start_date',
    pageSize: 20,
    page: 1,
};
const getVrfList = (
    params: FormattedApiParams,
): Promise<{ results: VRF[] }> => {
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

export const useGetVrfListByRound = (
    roundId: string,
): UseQueryResult<any, any> => {
    const apiParams = useApiParams({ round_id: roundId });
    return useSnackQuery({
        queryKey: ['getVrfListByRound', roundId],
        queryFn: () => getVrfList(apiParams),
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            keepPreviousData: false,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            enabled: Boolean(roundId),
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

type UseCampaignDropdownsParams = {
    countryId?: number;
    campaign?: string;
    vaccine?: string;
    rounds?: number;
};

export const useCampaignDropDowns = ({
    countryId,
    campaign,
    vaccine,
    rounds: rndsParams,
}): CampaignDropdowns => {
    const options: Options = {
        enabled: Boolean(countryId),
        countries: Number.isSafeInteger(countryId) ? `${countryId}` : undefined,
        campaignCategory: 'regular' as CampaignCategory,
        campaignType: 'polio',
        on_hold: true,
        show_test: false,
    };

    const { data, isFetching } = useGetCampaigns(options, CAMPAIGNS_ENDPOINT);

    return useMemo(() => {
        const list = (data as Campaign[]) ?? [];
        const selectedCampaign = list.find(c => c.obr_name === campaign);
        const campaigns = list
            .filter(
                c => c.separate_scopes_per_round || (c.scopes ?? []).length > 0,
            )
            // filter out on hold campaign, except selected campaign to avoid UI bug
            .filter(
                c => !c.on_hold || c.obr_name === selectedCampaign?.obr_name,
            )
            // filter out campaign with all rounds on hold, except selected campaign to avoid UI bug
            .filter(
                c =>
                    !c.rounds.every(rnd => rnd.on_hold) ||
                    c.obr_name === selectedCampaign?.obr_name,
            )
            .map(c => ({
                label: c.obr_name,
                value: c.obr_name,
            }));
        const vaccines = selectedCampaign?.single_vaccines
            ? selectedCampaign.single_vaccines.split(',').map(vaccineName => ({
                  label: vaccineName.trim(),
                  value: vaccineName.trim(),
              }))
            : singleVaccinesList;

        const rounds = vaccine
            ? (selectedCampaign?.rounds ?? [])
                  .filter(round =>
                      round.vaccine_names_extended.includes(vaccine),
                  )
                  .filter(
                      round =>
                          (selectedCampaign?.separate_scopes_per_round &&
                              (round?.scopes ?? []).length > 0) ||
                          (!selectedCampaign?.separate_scopes_per_round &&
                              (selectedCampaign?.scopes ?? []).length > 0),
                  )
                  // filter out rounds on_hold, except selected round to avoid UI bug
                  .filter(
                      round =>
                          !round.on_hold ||
                          (rndsParams ?? []).includes(round.number),
                  )
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
            rndsParams,
        };
    }, [data, vaccine, isFetching, campaign, rndsParams]);
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

const createFormDataRequest = (
    method: 'PATCH' | 'POST',
    arg1: PostArg,
): Promise<any> => {
    const { url, data = {}, fileData = {}, signal = null } = arg1;

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        let converted_value = value;
        if (typeof converted_value === 'object') {
            converted_value = JSON.stringify(converted_value);
        }
        formData.append(key, converted_value);
    });

    const init: Record<string, unknown> = {
        method,
        body: formData,
        signal,
        headers: {
            'Accept-Language': moment.locale(),
        },
    };

    if (Object.keys(fileData).length > 0) {
        Object.entries(fileData).forEach(([key, value]) => {
            if (key === 'files' && Array.isArray(value) && value.length > 0) {
                formData.append('document', value[0]); // Use 'document' key
            } else if (Array.isArray(value)) {
                value.forEach((blob, index) => {
                    formData.append(`${key}[${index}]`, blob);
                });
            } else {
                formData.append(key, value);
            }
        });
    }

    return iasoFetch(url, init).then(response => response.json());
};

export const patchRequest2 = (arg1: PostArg): Promise<any> => {
    return createFormDataRequest('PATCH', arg1);
};

export const postRequest2 = (arg1: PostArg): Promise<any> => {
    return createFormDataRequest('POST', arg1);
};

export const saveVrf = (
    vrf: Optional<Partial<VRFFormData>>,
): Promise<any>[] => {
    const filteredParams = vrf
        ? Object.fromEntries(
              Object.entries(vrf).filter(
                  ([key, value]) =>
                      value !== undefined &&
                      value !== null &&
                      key !== 'document',
              ),
          )
        : {};

    const { rounds } = filteredParams;
    if (Array.isArray(rounds)) {
        if (rounds.length > 0) {
            filteredParams.rounds = rounds.join(',');
        } else {
            filteredParams.rounds = '';
        }
    }
    const requestBody: any = {
        url: `${apiUrl}${vrf?.id ? `${vrf.id}/` : ''}`,
        data: filteredParams,
    };

    if (vrf?.document) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        const { files, ...data } = filteredParams;
        const fileData = { files: vrf.document };
        requestBody.data = data;
        requestBody.fileData = fileData;
    }

    if (vrf?.id) {
        return [patchRequest2(requestBody)];
    }
    return [postRequest2(requestBody)];
};

export const handleVrfPromiseErrors = (
    data: ParsedSettledPromise<VRF>[],
): void => {
    const vrf = data[0];
    const isSuccessful = vrf.status === 'fulfilled';
    if (isSuccessful) {
        openSnackBar(succesfullSnackBar(undefined, MESSAGES.vrfApiSuccess));
    } else {
        const details = Array.isArray(vrf.value)
            ? // there's only one element in the array
              vrf.value[0].reason.details
            : vrf.value;
        openSnackBar(errorSnackBar(undefined, MESSAGES.vrfApiError, details));
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
