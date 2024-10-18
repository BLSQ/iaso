import {
    UrlParams,
    renderTagsWithTooltip,
    textPlaceholder,
} from 'bluesquare-components';
import { useMemo } from 'react';
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
    patchRequest,
    postRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
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
    useGetCampaigns,
} from '../../../../Campaigns/hooks/api/useGetCampaigns';
import { apiUrl, defaultVaccineOptions } from '../../constants';
import MESSAGES from '../../messages';
import {
    CampaignDropdowns,
    ParsedSettledPromise,
    VRF,
    VRFFormData,
} from '../../types';
import moment from 'moment';
import { PostArg } from 'hat/assets/js/apps/Iaso/types/general';

const defaults = {
    order: '-start_date',
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
        campaignType: 'polio',
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

// export const saveVrf = (
//     vrf: Optional<Partial<VRFFormData>>,
// ): Promise<any>[] => {
//     const payload: Partial<VRF> = {
//         ...vrf,
//         rounds: getRoundsForApi(vrf?.rounds),
//     };
//     if (vrf?.id) {
//         return [patchRequest(`${apiUrl}${vrf?.id}/`, payload)];
//     }
//     return [postRequest(apiUrl, payload)];
// };

export const patchRequest2 = (
    arg1: PostArg
): Promise<any> => {
    const { url, data = {}, fileData = {}, signal = null } = arg1;

    let init: Record<string, unknown> = {};
    if (Object.keys(fileData).length > 0) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            let converted_value = value;
            if (typeof converted_value === 'object') {
                converted_value = JSON.stringify(converted_value);
            }
            formData.append(key, converted_value);
        });
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
        init = {
            method: 'PATCH',
            body: formData,
            signal,
        };
    } else {
        init = {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': moment.locale(),
            },
            signal,
        };
    }

    return iasoFetch(url, init).then(response => response.json());
};

export const postRequest2 = (
    arg1: PostArg
): Promise<any> => {
    const { url, data = {}, fileData = {}, signal = null } = arg1;

    let init: Record<string, unknown> = {};
    if (Object.keys(fileData).length > 0) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            let converted_value = value;
            if (typeof converted_value === 'object') {
                converted_value = JSON.stringify(converted_value);
            }
            formData.append(key, converted_value);
        });
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
        init = {
            method: 'POST',
            body: formData,
            signal,
        };
    } else {
        init = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': moment.locale(),
            },
            signal,
        };
    }

    return iasoFetch(url, init).then(response => response.json());
};

export const saveVrf = (
    vrf: Optional<Partial<VRFFormData>>,
): Promise<any>[] => {
    const filteredParams = vrf
        ? Object.fromEntries(
            Object.entries(vrf).filter(
                ([key, value]) => value !== undefined && value !== null && key !== 'document',
            ),
        )
        : {};

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
