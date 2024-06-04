import React, { FunctionComponent } from 'react';
import { userHasOneOfPermissions } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Planning } from '../../assignments/types/planning';
import { PLANNING_READ, PLANNING_WRITE } from '../../../utils/permissions';
import { LinkTo } from '../../../components/nav/LinkTo';

type Props = {
    planning: Planning;
};

export const LinkToPlanning: FunctionComponent<Props> = ({ planning }) => {
    const user = useCurrentUser();
    const condition = userHasOneOfPermissions(
        [PLANNING_READ, PLANNING_WRITE],
        user,
    );
    const url = `/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
    const { name: text } = planning;

    return <LinkTo condition={condition} url={url} text={text} />;
};
