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
};

export const LinkToOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    useIcon = false,
}) => {
    const user = useCurrentUser();
    if (userHasPermission('iaso_org_units', user) && orgUnit) {
        const url = `/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`;
        if (useIcon) {
            return (
                <IconButtonComponent
                    url={url}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                />
            );
        }
        return <Link to={url}>{orgUnit.name}</Link>;
    }
    return <>{orgUnit ? orgUnit.name : '-'}</>;
};
