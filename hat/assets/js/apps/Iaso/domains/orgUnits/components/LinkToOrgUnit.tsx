import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../types/orgUnit';

import MESSAGES from '../../assignments/messages';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    toRegistry: boolean;
};

export const LinkToOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    useIcon = false,
    className = '',
    toRegistry = false,
}) => {
    const user = useCurrentUser();
    const hasPermission = toRegistry
        ? userHasPermission('iaso_registry', user)
        : userHasPermission('iaso_org_units', user);
    if (hasPermission && orgUnit) {
        const url = toRegistry
            ? `/${baseUrls.registryDetail}/orgUnitId/${orgUnit.id}`
            : `/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`;
        if (useIcon) {
            return (
                <IconButtonComponent
                    url={url}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                />
            );
        }
        return (
            <Link className={className} to={url}>
                {orgUnit.name}
            </Link>
        );
    }
    return <>{orgUnit ? orgUnit.name : '-'}</>;
};
