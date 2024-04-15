import React, { FunctionComponent } from 'react';

import { Link } from 'react-router-dom';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Beneficiary } from '../../entities/types/beneficiary';
import * as Permission from '../../../utils/permissions';

type Props = {
    entity?: Beneficiary;
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
