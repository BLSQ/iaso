import { makeRedirectionUrl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../../orgUnits/types/orgUnit';
import { userHasOneOfPermissions } from '../../users/utils';

import MESSAGES from '../messages';

import { REGISTRY_READ, REGISTRY_WRITE } from '../../../utils/permissions';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    color?: string;
    params?: Record<string, string>;
};

export const LinkToRegistry: FunctionComponent<Props> = ({
    orgUnit,
    useIcon = false,
    className = '',
    replace = false,
    iconSize = 'medium',
    size = 'medium',
    color = 'inherit',
    params = {},
}) => {
    const user = useCurrentUser();
    const condition =
        userHasOneOfPermissions([REGISTRY_READ, REGISTRY_WRITE], user) &&
        Boolean(orgUnit);
    const url = makeRedirectionUrl(baseUrls.registry, {
        ...params,
        orgUnitId: orgUnit?.id,
    });
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
            color={color}
        />
    );
};
