/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { DropdownOptions } from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import { CampaignLogDetail, CampaignLogData } from '../constants/types';

const getCampaignLog = (
    campaignId: string | undefined,
): Promise<CampaignLogDetail> => {
    return getRequest(
        `/api/logs/?objectId=${campaignId}&contentType=polio.campaign`,
    );
};

const getCampaignLogDetail = (
    logId: string | undefined,
): Promise<CampaignLogData> => {
    return getRequest(`/api/logs/${logId}`);
};

export const useGetCampaignLogs = (
    campaignId: string | undefined,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const queryKey: any[] = ['campaignLog', campaignId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getCampaignLog(campaignId),
        options: {
            enabled: Boolean(campaignId),
            select: data => {
                if (!data) return [];
                return data.list.map((campaignLog: CampaignLogDetail) => {
                    return {
                        value: campaignLog.id,
                        label: moment(campaignLog.created_at).format('LTS'),
                        original: campaignLog,
                    };
                });
            },
        },
    });
};

export const useGetCampaignLogDetail = (
    logId: string | undefined,
): UseQueryResult<Record<string, any> | undefined, Error> => {
    const queryKey: any[] = ['campaignLogDetail', logId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getCampaignLogDetail(logId),
        options: {
            enabled: Boolean(logId),
            select: data => {
                if (data) {
                    return data.new_value[0];
                }

                return undefined;
            },
        },
    });
};
