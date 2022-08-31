import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { Beneficiary } from '../../types/beneficiary';
import { IntlFormatMessage } from '../../../../../types/intl';
import MESSAGES from '../../../messages';

type Props = {
    beneficiary?: Beneficiary | undefined;
};

export const Gender: FunctionComponent<Props> = ({ beneficiary }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const { gender } = beneficiary?.attributes?.file_content ?? {};
    return <>{gender ? formatMessage(MESSAGES[gender]) : '--'}</>;
};

Gender.defaultProps = {
    beneficiary: undefined,
};
