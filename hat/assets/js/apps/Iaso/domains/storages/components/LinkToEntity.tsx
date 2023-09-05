import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Entity } from '../../entities/types/entity';
import * as Permission from '../../../utils/permissions';

type Props = {
    entity?: Entity;
};

export const LinkToEntity: FunctionComponent<Props> = ({ entity }) => {
    const user = useCurrentUser();
    if (userHasPermission(Permission.ENTITIES, user) && entity?.name) {
        const url = `/${baseUrls.entityDetails}/entityId/${entity.id}`;
        return (
            <Link to={url}>
                {/*  // TODO this will not work as this field is not in use anymore */}
                {entity.name}
            </Link>
        );
    }
    return <>{entity ? entity.name : '-'}</>;
};
