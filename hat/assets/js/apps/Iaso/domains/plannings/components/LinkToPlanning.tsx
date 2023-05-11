import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { useGetPlanning } from '../../assignments/hooks/requests/useGetPlanning';

type Props = {
    planningId: string | undefined;
    planningName: string;
};

export const LinkToPlanning: FunctionComponent<Props> = ({
    planningId,
    planningName,
}) => {
    const user = useCurrentUser();
    const { data: planning } = useGetPlanning(planningId);

    if (userHasPermission('iaso_planning', user)) {
        const planningUrl = `/${baseUrls.assignments}/planningId/${planningId}/team/${planning?.team}`;
        return <Link to={planningUrl}>{planningName}</Link>;
    }
    return <>{planningName}</>;
};
