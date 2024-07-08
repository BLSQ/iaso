import { makeRedirectionUrl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { LinkTo } from '../../../../../../hat/assets/js/apps/Iaso/components/nav/LinkTo';
import {
    OrgUnit,
    ShortOrgUnit,
} from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { baseUrls } from '../../constants/urls';
import { MESSAGES } from './messages';

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
    const url = makeRedirectionUrl(baseUrls.registry, {
        ...params,
        orgUnitId: orgUnit?.id,
    });
    const text = orgUnit?.name;

    return (
        <LinkTo
            condition
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
