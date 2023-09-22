/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import {
    CampaignLogDetail,
    CampaignLogData,
    CampaignLogsDetail,
    Campaign,
} from '../../../../constants/types';
import { Profile } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

export const getCampaignLog = (
    campaignId?: string,
): Promise<CampaignLogsDetail> => {
    return getRequest(
        `/api/logs/?limit=500&objectId=${campaignId}&contentType=polio.campaign`,
    );
};

export const useGetCampaignLogs = (
    campaignId?: string,
    isOpen = true,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    return useSnackQuery({
        queryKey: ['campaignLog', campaignId],
        queryFn: () => getCampaignLog(campaignId),
        options: {
            enabled: Boolean(campaignId) && isOpen,
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
export const initialLogDetail = { user: undefined, logDetail: undefined };
export type CampaignLogDetailResult = {
    user?: Profile;
    logDetail?: Campaign;
};

const getCampaignLogDetail = (logId?: string): Promise<CampaignLogData> => {
    return getRequest(`/api/logs/${logId}/`);
};

export const useGetCampaignLogDetail = (
    initialData: CampaignLogDetailResult,
    logId?: string,
): UseQueryResult<CampaignLogDetailResult, Error> => {
    return useSnackQuery({
        queryKey: ['campaignLogDetail', logId],
        queryFn: () => getCampaignLogDetail(logId),
        options: {
            enabled: Boolean(logId),
            initialData,
            select: data => {
                if (data) {
                    return {
                        user: data.user,
                        logDetail: data.new_value
                            ? data.new_value[0]
                            : undefined,
                    };
                }

                return initialData;
            },
        },
    });
};
