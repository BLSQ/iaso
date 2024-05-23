import React, { FunctionComponent } from 'react';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../types/orgUnit';
import { ORG_UNITS } from '../../../utils/permissions';
import { LinkTo } from '../../../components/nav/LinkTo';
import MESSAGES from '../../assignments/messages';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
};

export const LinkToOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    useIcon,
    className,
    replace,
    iconSize,
    size,
}) => {
    const user = useCurrentUser();
    const condition = userHasPermission(ORG_UNITS, user) && Boolean(orgUnit);
    const url = `/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit?.id}`;
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
            tooltipMessage={MESSAGES.details}
        />
    );
};
