import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Planning } from '../../assignments/types/planning';

type Props = {
    planning: Planning;
};

export const LinkToPlanning: FunctionComponent<Props> = ({ planning }) => {
    const user = useCurrentUser();

    if (userHasPermission('iaso_planning', user)) {
        const planningUrl = `/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
        return <Link to={planningUrl}>{planning.name}</Link>;
    }
    return <>{planning.name}</>;
};
