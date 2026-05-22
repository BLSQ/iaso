import React, { ReactElement, useMemo } from 'react';
import {
    ListAlt,
    Storage,
    Assignment,
    SupervisorAccount,
} from '@mui/icons-material/';
import PhonelinkSetupIcon from '@mui/icons-material/PhonelinkSetup';
import { useSafeIntl } from 'bluesquare-components';

import EntitySvg from '../../../components/svg/Entity';
import OrgUnitSvg from '../../../components/svg/OrgUnitSvgComponent';
import * as paths from '../../../constants/routes';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasOneOfPermissions } from '../../users/utils';
import { MESSAGES } from '../messages';
import { useGetOrgunitsExtraPath } from './useGetOrgunitsExtraPath';

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
                    url: `/${baseUrls.forms}`,
                },
                {
                    label: formatMessage(MESSAGES.orgUnitsTitle),
                    permissions: paths.orgUnitsPath.permissions,
                    Icon: <OrgUnitSvg />,
                    url: `/${baseUrls.orgUnits}${orgUnitExtraPath}`,
                },
                {
                    label: formatMessage(MESSAGES.entities),
                    permissions: paths.entityTypesPath.permissions,
                    Icon: <EntitySvg />,
                    url: `/${baseUrls.entities}`,
                },
                {
                    label: formatMessage(MESSAGES.users),
                    permissions: paths.usersPath.permissions,
                    Icon: <SupervisorAccount />,
                    url: `/${baseUrls.users}`,
                },
                {
                    label: formatMessage(MESSAGES.storages),
                    permissions: paths.storagesPath.permissions,
                    Icon: <Storage />,
                    url: `/${baseUrls.storages}`,
                },
                {
                    label: formatMessage(MESSAGES.planning),
                    permissions: paths.planningPath.permissions,
                    Icon: <Assignment />,
                    url: `/${baseUrls.planning}`,
                },
                {
                    label: formatMessage(MESSAGES.projects),
                    permissions: paths.projectsPath.permissions,
                    Icon: <PhonelinkSetupIcon />,
                    url: `/${baseUrls.projects}`,
                },
            ].filter(button =>
                userHasOneOfPermissions(button.permissions, currentUser),
            ),
        [currentUser, formatMessage, orgUnitExtraPath],
    );
};
