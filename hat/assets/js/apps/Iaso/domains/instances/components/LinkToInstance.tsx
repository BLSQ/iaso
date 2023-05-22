import React, { FunctionComponent } from 'react';

import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import MESSAGES from '../../assignments/messages';

type Props = {
    instanceId: string;
    useIcon?: boolean;
    color?: string;
};
export const LinkToInstance: FunctionComponent<Props> = ({
    instanceId,
    useIcon = false,
    color = 'inherit',
}) => {
    const user = useCurrentUser();
    if (userHasPermission('iaso_submissions', user)) {
        const formUrl = `/${baseUrls.instanceDetail}/instanceId/${instanceId}`;
        if (useIcon) {
            return (
                <IconButtonComponent
                    icon="remove-red-eye"
                    url={formUrl}
                    tooltipMessage={MESSAGES.details}
                    color={color}
                />
            );
        }
        return <Link to={formUrl}>{instanceId}</Link>;
    }
    return <>{instanceId}</>;
};
