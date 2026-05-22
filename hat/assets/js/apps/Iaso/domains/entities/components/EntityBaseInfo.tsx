import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    IconButton,
    LinkButton,
    useSafeIntl,
} from 'bluesquare-components';

import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import { Field } from '../types/fields';
import { EntityBaseInfoContents } from './EntityBaseInfoContents';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

type Props = {
    entity: Entity;
    fields: Field[];
    withLinkToEntity?: boolean;
    hasDuplicates?: boolean;
    duplicateUrl?: string;
};

const EntityTitle: FunctionComponent<{
    hasDuplicates: boolean;
    duplicateUrl?: string;
}> = ({ hasDuplicates, duplicateUrl }) => {
    const { formatMessage } = useSafeIntl();
    return hasDuplicates && duplicateUrl ? (
        <Grid container>
            <Grid item xs={6}>
                {formatMessage(MESSAGES.entityInfo)}
            </Grid>
            <Grid item xs={6} justifyContent="flex-end" container>
                <LinkButton to={duplicateUrl}>
                    {formatMessage(MESSAGES.seeDuplicates)}
                </LinkButton>
            </Grid>
        </Grid>
    ) : (
        formatMessage(MESSAGES.entityInfo)
    );
};

export const EntityBaseInfo: FunctionComponent<Props> = ({
    entity,
    fields,
    withLinkToEntity = false,
    hasDuplicates = false,
    duplicateUrl,
}) => {
    const classes: Record<string, string> = useStyles();
    const widgetContents = <EntityBaseInfoContents fields={fields} />;

    const title = (
        <EntityTitle
            hasDuplicates={hasDuplicates}
            duplicateUrl={duplicateUrl}
        />
    );

    if (withLinkToEntity) {
        return (
            <WidgetPaper
                className={classes.infoPaper}
                title={title}
                IconButton={IconButton}
                iconButtonProps={{
                    url: `/${baseUrls.entityDetails}/entityId/${entity.id}`,
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
