/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { DropdownOptions } from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import { CampaignLogDetail, CampaignLogData } from '../constants/types';
import { Profile } from '../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

export const getCampaignLog = (
    campaignId?: string,
): Promise<CampaignLogDetail> => {
    return getRequest(
        `/api/logs/?objectId=${campaignId}&contentType=polio.campaign`,
    );
};

const getCampaignLogDetail = (logId?: string): Promise<CampaignLogData> => {
    return getRequest(`/api/logs/${logId}`);
};

export const useGetCampaignLogs = (
    campaignId?: string,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    return useSnackQuery({
        queryKey: ['campaignLog', campaignId],
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

export type CampaignLogDetailResult = {
    user: Profile;
    logDetail: CampaignLogData;
};

export const useGetCampaignLogDetail = (
    logId?: string,
): UseQueryResult<CampaignLogDetailResult | undefined, Error> => {
    return useSnackQuery({
        queryKey: ['campaignLogDetail', logId],
        queryFn: () => getCampaignLogDetail(logId),
        options: {
            enabled: Boolean(logId),
            select: data => {
                if (data) {
                    return { user: data.user, logDetail: data.new_value[0] };
                }

                return undefined;
            },
        },
    });
};
