// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import {
    Nullable,
    Optional,
} from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Profile } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../constants/messages';
import { LinkWithAlias } from '../types';

export const COMMENT_CHAR_LIMIT = 50;
export const getProfileFromId = (
    userId: number,
    profiles: Profile[],
): Profile => {
    return (
        profiles.find((profile: Profile) => profile.user_id === userId) ??
        ({} as Profile)
    );
};
export const formatComment = (comment: Optional<string>): Nullable<string> => {
    if (!comment) return null;
    if (comment.length > COMMENT_CHAR_LIMIT)
        return `${comment.substring(0, COMMENT_CHAR_LIMIT)}...`;
    return comment;
};

export const useActionMessage = (
    comment = '',
    files = 0,
    links = [] as LinkWithAlias[],
): Nullable<string> => {
    const { formatMessage } = useSafeIntl();
    const fileMsg = `${files} ${formatMessage(MESSAGES.files)}`;
    const commentsMessage = formatMessage(MESSAGES.seeFullComment);
    const linkMessage = formatMessage(MESSAGES.links);

    let message: Nullable<string> = null;

    if (comment.length > COMMENT_CHAR_LIMIT && files > 0) {
        message = `${commentsMessage} + ${fileMsg}`;
    }
    if (comment.length <= COMMENT_CHAR_LIMIT && files > 0) {
        message = `${formatMessage(MESSAGES.see)} ${fileMsg}`;
    }
    if (comment.length > COMMENT_CHAR_LIMIT && files === 0) {
        message = `${commentsMessage}`;
    }
    if (links.length > 0 && message) {
        message = `${message ?? formatMessage(MESSAGES.see)} + ${linkMessage}`;
    }
    if (links.length > 0 && !message) {
        message = `${formatMessage(MESSAGES.see)} ${linkMessage.toLowerCase()}`;
    }
    return message;
};

export const shouldOpenModal = (
    files: Nullable<number> = 0,
    links: Nullable<LinkWithAlias[]> = [],
    comments: Nullable<string> = '',
): boolean => {
    if (files || (links ?? []).length > 0 || comments) return true;
    return false;
};
