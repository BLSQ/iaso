import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { useGetAge } from '../../../../hooks/useGetAge';

import { IntlFormatMessage } from '../../../../types/intl';
import MESSAGES from '../messages';

type Props = {
    birthDate?: string | undefined;
};

export const AgeCell: FunctionComponent<Props> = ({ birthDate }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const age = useGetAge(birthDate);
    if (!age) return <>--</>;
    return <>{`${age} ${formatMessage(MESSAGES.years)}`}</>;
};
AgeCell.defaultProps = {
    birthDate: undefined,
};
