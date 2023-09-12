import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type Dhi2Credentials = {
    errors: string;
};
export const useTranslatedDhis2Errors = (
    dhis2Credentials: Dhi2Credentials,
): Array<string> => {
    const { formatMessage } = useSafeIntl();

    const errorValue =
        dhis2Credentials?.errors.length > 0
            ? [
                  formatMessage(
                      MESSAGES[dhis2Credentials?.errors]
                          ? MESSAGES[dhis2Credentials?.errors]
                          : MESSAGES.notDefinedDhis2ConnectionError,
                  ),
              ]
            : [];
    return errorValue;
};
