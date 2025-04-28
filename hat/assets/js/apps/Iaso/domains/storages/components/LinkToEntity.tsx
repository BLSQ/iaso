import React, { FunctionComponent } from 'react';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import { ENTITIES } from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Entity } from '../../entities/types/entity';
import { userHasPermission } from '../../users/utils';

type Props = {
    entity?: Entity;
};

export const LinkToEntity: FunctionComponent<Props> = ({ entity }) => {
    const user = useCurrentUser();
    const condition =
        userHasPermission(ENTITIES, user) &&
        (Boolean(entity?.name) || Boolean(entity?.id));
    const url = `/${baseUrls.entityDetails}/entityId/${entity?.id}`;

    return (
        <LinkTo
            condition={condition}
            url={url}
            text={entity?.name || entity?.id.toString()}
        />
    );
};
