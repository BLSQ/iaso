import React, { FunctionComponent } from 'react';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import { SUBMISSIONS, SUBMISSIONS_UPDATE } from '../../../utils/permissions';
import MESSAGES from '../../assignments/messages';
import { useCurrentUserHasOneOfPermissions } from '../../users/utils';

type Props = {
    instanceId: string;
    useIcon?: boolean;
    color?: string;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    replace?: boolean;
};
export const LinkToInstance: FunctionComponent<Props> = ({
    instanceId,
    useIcon = false,
    color = 'inherit',
    iconSize = 'medium',
    size = 'medium',
    replace = false,
}) => {
    const condition = useCurrentUserHasOneOfPermissions([
        SUBMISSIONS,
        SUBMISSIONS_UPDATE,
    ]);
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
            size={size}
            iconSize={iconSize}
        />
    );
};
