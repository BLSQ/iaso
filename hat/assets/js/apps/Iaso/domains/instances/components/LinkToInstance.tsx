import React, { FunctionComponent } from 'react';
import { userHasOneOfPermissions } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import MESSAGES from '../../assignments/messages';
import { SUBMISSIONS, SUBMISSIONS_UPDATE } from '../../../utils/permissions';
import { LinkTo } from '../../../components/nav/LinkTo';

type Props = {
    instanceId: string;
    useIcon?: boolean;
    color?: string;
    replace?: boolean;
};
export const LinkToInstance: FunctionComponent<Props> = ({
    instanceId,
    useIcon = false,
    color = 'inherit',
    replace = false,
}) => {
    const user = useCurrentUser();
    const condition = userHasOneOfPermissions(
        [SUBMISSIONS, SUBMISSIONS_UPDATE],
        user,
    );
    const url = `/${baseUrls.instanceDetail}/instanceId/${instanceId}`;
    return (
        <LinkTo
            condition={condition}
            url={url}
            useIcon={useIcon}
            replace={replace}
            tooltipMessage={MESSAGES.details}
            text={instanceId}
            color={color}
        />
    );
};
