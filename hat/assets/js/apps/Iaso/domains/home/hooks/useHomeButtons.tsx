import React, { ReactElement, useMemo } from 'react';
import { ListAlt, Storage, Assignment } from '@material-ui/icons/';
import { useSafeIntl } from 'bluesquare-components';

import OrgUnitSvg from '../../../components/svg/OrgUnitSvgComponent';
import { MESSAGES } from '../messages';
import * as paths from '../../../constants/routes';
import { baseUrls } from '../../../constants/urls';
import { useGetOrgunitsExtraPath } from './useGetOrgunitsExtraPath';
import { userHasOneOfPermissions } from '../../users/utils';
import { useCurrentUser } from '../../../utils/usersUtils';
import BeneficiarySvg from '../../../components/svg/Beneficiary';

type Button = {
    label: string;
    permissions: string[];
    Icon: ReactElement;
    url: string;
};

export const useHomeButtons = (): Button[] => {
    const { formatMessage } = useSafeIntl();
    const orgUnitExtraPath = useGetOrgunitsExtraPath();
    const currentUser = useCurrentUser();
    return useMemo(
        () =>
            [
                {
                    label: formatMessage(MESSAGES.formsTitle),
                    Icon: <ListAlt />,
                    permissions: paths.formsPath.permissions,
                    url: baseUrls.forms,
                },
                {
                    label: formatMessage(MESSAGES.orgUnitsTitle),
                    permissions: paths.orgUnitsPath.permissions,
                    Icon: <OrgUnitSvg />,
                    url: `${baseUrls.orgUnits}${orgUnitExtraPath}`,
                },
                {
                    label: formatMessage(MESSAGES.beneficiaries),
                    permissions: paths.entityTypesPath.permissions,
                    Icon: <BeneficiarySvg />,
                    url: baseUrls.entities,
                },
                {
                    label: formatMessage(MESSAGES.storages),
                    permissions: paths.entityTypesPath.permissions,
                    Icon: <Storage />,
                    url: baseUrls.storages,
                },
                {
                    label: formatMessage(MESSAGES.planning),
                    permissions: paths.planningPath.permissions,
                    Icon: <Assignment />,
                    url: baseUrls.planning,
                },
            ].filter(button =>
                userHasOneOfPermissions(button.permissions, currentUser),
            ),
        [currentUser, formatMessage, orgUnitExtraPath],
    );
};
