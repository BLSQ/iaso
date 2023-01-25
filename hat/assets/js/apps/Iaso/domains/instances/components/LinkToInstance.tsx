import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
// @ts-ignore
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';

type Props = {
    instanceId: string;
};
export const LinkToInstance: FunctionComponent<Props> = ({ instanceId }) => {
    const user = useCurrentUser();
    if (userHasPermission('iaso_submissions', user)) {
        const formUrl = `/${baseUrls.instanceDetail}/instanceId/${instanceId}`;
        return <Link to={formUrl}>{instanceId}</Link>;
    }
    return <>{instanceId}</>;
};
