import React, { FunctionComponent } from 'react';
import { IconVariant, LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import { ORG_UNITS } from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import MESSAGES from '../../assignments/messages';
import { userHasPermission } from '../../users/utils';
import { OrgUnit, ShortOrgUnit } from '../types/orgUnit';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    icon?: IconVariant;
    name?: string;
};

export const LinkToOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    useIcon,
    className,
    replace,
    iconSize,
    size,
    icon,
    name,
}) => {
    const user = useCurrentUser();
    const condition = userHasPermission(ORG_UNITS, user) && Boolean(orgUnit);
    const url = `/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit?.id}`;
    const text = name ?? orgUnit?.name;

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
            tooltipMessage={MESSAGES.details}
            icon={icon}
        />
    );
};
