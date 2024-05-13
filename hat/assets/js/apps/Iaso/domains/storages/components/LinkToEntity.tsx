import React, { FunctionComponent } from 'react';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Beneficiary } from '../../entities/types/beneficiary';
import { ENTITIES } from '../../../utils/permissions';
import { LinkTo } from '../../../components/nav/LinkTo';

type Props = {
    entity?: Beneficiary;
};

export const LinkToEntity: FunctionComponent<Props> = ({ entity }) => {
    const user = useCurrentUser();
    const condition =
        userHasPermission(ENTITIES, user) && Boolean(entity?.name);
    const url = `/${baseUrls.entityDetails}/entityId/${entity?.id}`;

    return <LinkTo condition={condition} url={url} text={entity?.name} />;
};
