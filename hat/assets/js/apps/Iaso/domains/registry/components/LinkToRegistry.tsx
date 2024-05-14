import React, { FunctionComponent } from 'react';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../../orgUnits/types/orgUnit';
import { LinkTo } from '../../../components/nav/LinkTo';

import MESSAGES from '../messages';

import { REGISTRY } from '../../../utils/permissions';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
};

export const LinkToRegistry: FunctionComponent<Props> = ({
    orgUnit,
    useIcon,
    className,
    replace,
    iconSize,
    size,
}) => {
    const user = useCurrentUser();
    const condition = userHasPermission(REGISTRY, user) && Boolean(orgUnit);
    const url = `/${baseUrls.registry}/orgUnitId/${orgUnit?.id}`;
    const text = orgUnit?.name;

    return (
        <LinkTo
            condition={condition}
            url={url}
            useIcon={useIcon}
            className={className}
            replace={replace}
            size={size}
            iconSize={iconSize}
            text={text}
            tooltipMessage={MESSAGES.seeRegistry}
        />
    );
};
