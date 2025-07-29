import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { postRequest, getRequest } from 'Iaso/libs/Api';
import {
    ObrName,
    RefreshPreparednessResponse,
} from '../../../../constants/types';
import { Url } from 'Iaso/routing/types';
import { UseMutationResult } from 'react-query';
import { UuidAsString, DjangoError } from 'Iaso/types/general';

export const useGetPreparednessData = (
    campaignId?: string,
    roundKey?: number,
) => {
    const url = `/api/polio/campaigns/${campaignId}/preparedness?round=${roundKey}`;
    return useSnackQuery<RefreshPreparednessResponse>(
        [campaignId, roundKey],
        () => getRequest(url),
        undefined,
        {
            enabled: Boolean(campaignId),
        },
    );
};

type RefreshPreparednessArgs = {
    googleSheetUrl?: Url | null;
    campaignName?: ObrName;
};

const refreshPreparedness = ({
    googleSheetUrl,
    campaignName,
}: RefreshPreparednessArgs): Promise<RefreshPreparednessResponse> => {
    // launch task to refresh endpoint for preparedness dashboard
    postRequest('/api/tasks/create/refreshpreparedness/', {
        obr_name: campaignName,
    });
    return postRequest('/api/polio/campaigns/preview_preparedness/', {
        google_sheet_url: googleSheetUrl,
    });
};

// This retrieve data but since it contact data from an external service this is
// implemented as a post. This fetch and parse the Google spreadsheet
export const useFetchPreparedness = (): UseMutationResult<
    RefreshPreparednessResponse,
    DjangoError,
    RefreshPreparednessArgs,
    unknown
> => {
    return useSnackMutation({ mutationFn: refreshPreparedness });
};

type PreparednessSpreadSheetResponse = {
    campaign_id: number;
    campaign_obr_name: ObrName;
    round: string; // double check this
    round_number: number;
    round_id: number;
    round_start: string | null;
    round_end: string | null;
    date: string;
    overall_status_score: number;
    indicators: {
        [key: string]: {
            sn: number;
            key: string;
            title: string;
            national: number | null;
            regions: number | null;
            districts: number | null;
        };
    };
    history: Array<{
        days_before: number;
        expected_score: number;
        preparedness_score: number | null;
        date: string;
        sync_time: string | null;
    }>;
    status?: 'not_sync' | 'error';
    details?: string;
};

export const useGeneratePreparednessSheet = (
    campaign_id: UuidAsString | undefined,
    onSuccess: (data: { url: Url }) => void,
): UseMutationResult<
    PreparednessSpreadSheetResponse,
    DjangoError,
    number,
    unknown
> => {
    return useSnackMutation({
        mutationFn: (roundNumber: number) =>
            postRequest(
                `/api/polio/campaigns/${campaign_id}/create_preparedness_sheet/`,
                {
                    round_number: roundNumber,
                },
            ),
        showSucessSnackBar: false,
        options: { onSuccess },
    });
};
