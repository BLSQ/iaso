import React, { FunctionComponent } from 'react';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Planning } from '../../assignments/types/planning';
import { PLANNINGS } from '../../../utils/permissions';
import { LinkTo } from '../../../components/nav/LinkTo';

type Props = {
    planning: Planning;
};

export const LinkToPlanning: FunctionComponent<Props> = ({ planning }) => {
    const user = useCurrentUser();
    const condition = userHasPermission(PLANNINGS, user);
    const url = `/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
    const { name: text } = planning;

    return <LinkTo condition={condition} url={url} text={text} />;
};
