import moment from 'moment';
import { baseUrls } from 'Iaso/constants/urls';
import { ValidationWorkflowInstanceListResponseItem } from './types';

export const getSubmissionLabel = (
    item: Pick<
        ValidationWorkflowInstanceListResponseItem,
        'id' | 'display_name' | 'form'
    >,
): string => `${item.form.name} — ${item.display_name || `#${item.id}`}`;

export const getSubmissionUrl = ({
    item,
    accountId,
    isValidating = true,
}: {
    item: Pick<ValidationWorkflowInstanceListResponseItem, 'id' | 'form'>;
    accountId?: number | string;
    isValidating?: boolean;
}): string =>
    `/${baseUrls.instanceDetail}/referenceFormId/${item.form.id}` +
    `/instanceId/${item.id}/accountId/${accountId}` +
    `${isValidating ? '/isValidating/true' : ''}/`;

/** Number of full days elapsed since `date`, never negative */
export const daysSince = (
    date: string,
    now: moment.MomentInput = undefined,
): number => Math.max(0, moment(now).diff(moment(date), 'days'));
