import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    IconButton,
    LinkButton,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import { Grid } from '@mui/material';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';
import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';
import { BeneficiaryBaseInfoContents } from './BeneficiaryBaseInfoContents';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

type Props = {
    beneficiary: Beneficiary;
    fields: Field[];
    withLinkToBeneficiary?: boolean;
    hasDuplicates?: boolean;
    duplicateUrl?: string;
};

const BeneficiaryTitle: FunctionComponent<{
    hasDuplicates: boolean;
    duplicateUrl?: string;
}> = ({ hasDuplicates, duplicateUrl }) => {
    const { formatMessage } = useSafeIntl();
    return hasDuplicates && duplicateUrl ? (
        <Grid container>
            <Grid item xs={6}>
                {formatMessage(MESSAGES.beneficiaryInfo)}
            </Grid>
            <Grid item xs={6} justifyContent="flex-end" container>
                <LinkButton to={duplicateUrl}>
                    {formatMessage(MESSAGES.seeDuplicates)}
                </LinkButton>
            </Grid>
        </Grid>
    ) : (
        formatMessage(MESSAGES.beneficiaryInfo)
    );
};

export const BeneficiaryBaseInfo: FunctionComponent<Props> = ({
    beneficiary,
    fields,
    withLinkToBeneficiary = false,
    hasDuplicates = false,
    duplicateUrl,
}) => {
    const classes: Record<string, string> = useStyles();
    const widgetContents = <BeneficiaryBaseInfoContents fields={fields} />;

    const title = (
        <BeneficiaryTitle
            hasDuplicates={hasDuplicates}
            duplicateUrl={duplicateUrl}
        />
    );

    if (withLinkToBeneficiary) {
        return (
            <WidgetPaper
                className={classes.infoPaper}
                title={title}
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
    }
    return (
        <WidgetPaper className={classes.infoPaper} title={title}>
            {widgetContents}
        </WidgetPaper>
    );
};
