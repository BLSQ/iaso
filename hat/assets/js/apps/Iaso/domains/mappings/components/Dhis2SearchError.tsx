import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import { SOURCES, SOURCE_WRITE } from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasOneOfPermissions } from '../../users/utils';
import MESSAGES from '../messages';

// error codes returned by /api/datasources/<id>/<resource>/ when DHIS2 can't be queried
export const DHIS2_NO_CREDENTIALS = 'dhis2_no_credentials';
export const DHIS2_INVALID_CREDENTIALS = 'dhis2_invalid_credentials';
export const DHIS2_UNAVAILABLE = 'dhis2_unavailable';

const ERROR_MESSAGES = {
    [DHIS2_NO_CREDENTIALS]: MESSAGES.dhis2NoCredentials,
    [DHIS2_INVALID_CREDENTIALS]: MESSAGES.dhis2InvalidCredentials,
    [DHIS2_UNAVAILABLE]: MESSAGES.dhis2Unavailable,
};

export class Dhis2SearchError extends Error {
    code: string;

    constructor(code: string) {
        super(code);
        this.code = code;
    }
}

export const fetchDhis2Resource = async (url: string): Promise<any> => {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Dhis2SearchError(body.code ?? DHIS2_UNAVAILABLE);
    }
    return response.json();
};

type Props = {
    code: string;
    dataSourceId: number;
};

export const Dhis2SearchErrorMessage: FunctionComponent<Props> = ({
    code,
    dataSourceId,
}) => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();
    const canSeeSource = userHasOneOfPermissions([SOURCES, SOURCE_WRITE], user);
    return (
        <>
            <span>
                {formatMessage(
                    ERROR_MESSAGES[code] ?? MESSAGES.dhis2Unavailable,
                )}
            </span>
            {canSeeSource && (
                <>
                    {' '}
                    <LinkTo
                        condition
                        url={`/${baseUrls.sourceDetails}/sourceId/${dataSourceId}`}
                        text={formatMessage(MESSAGES.checkDataSource)}
                        target="_blank"
                    />
                </>
            )}
        </>
    );
};
