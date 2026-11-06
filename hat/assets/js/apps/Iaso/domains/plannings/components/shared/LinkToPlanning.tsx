import React, { FunctionComponent } from 'react';
import { Planning } from 'Iaso/domains/plannings/types';
import { LinkTo } from '../../../../components/nav/LinkTo';
import { PLANNING_READ, PLANNING_WRITE } from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { userHasOneOfPermissions } from '../../../users/utils';
import { getAssignmentsUrl } from '../../utils';

type Props = {
    planning: Planning;
};

export const LinkToPlanning: FunctionComponent<Props> = ({ planning }) => {
    const user = useCurrentUser();
    const condition = userHasOneOfPermissions(
        [PLANNING_READ, PLANNING_WRITE],
        user,
    );
    const url = getAssignmentsUrl(planning.id);
    const { name: text } = planning;

    return <LinkTo condition={condition} url={url} text={text} />;
};
