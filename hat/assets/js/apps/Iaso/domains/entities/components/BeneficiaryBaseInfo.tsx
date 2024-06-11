/* eslint-disable react/require-default-props */
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { commonStyles, IconButton, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';
import { BeneficiaryBaseInfoContents } from './BeneficiaryBaseInfoContents';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

type Props = {
    beneficiary: Beneficiary;
    fields: Field[];
    withLinkToBeneficiary?: boolean;
};

export const BeneficiaryBaseInfo: FunctionComponent<Props> = ({
    beneficiary,
    fields,
    withLinkToBeneficiary = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const widgetContents = <BeneficiaryBaseInfoContents fields={fields} />;

    if (withLinkToBeneficiary) {
        return (
            <WidgetPaper
                className={classes.infoPaper}
                title={formatMessage(MESSAGES.beneficiaryInfo)}
                IconButton={IconButton}
                iconButtonProps={{
                    url: `/${baseUrls.entityDetails}/entityId/${beneficiary.id}`,
                    icon: 'remove-red-eye',
                    tooltipMessage: MESSAGES.see,
                }}
            >
                {widgetContents}
            </WidgetPaper>
        );
    } else {
        return (
            <WidgetPaper
                className={classes.infoPaper}
                title={formatMessage(MESSAGES.beneficiaryInfo)}
            >
                {widgetContents}
            </WidgetPaper>
        );
    }
};
