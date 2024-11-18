import { PaginationParams } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { CampaignCategory } from '../../Campaigns/hooks/api/useGetCampaigns';

export type VaccineRepositoryParams = PaginationParams & {
    countries?: string;
    campaignType?: string;
    campaignCategory?: CampaignCategory;
    orgUnitGroups?: string;
    campaignGroups?: string;
    fileType?: string;
    campaignStatus?: string;
};
