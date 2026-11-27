import React, { FunctionComponent } from 'react';
import Grid from '@mui/material/Grid/Grid';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
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
import { EntityActionsMenu } from './EntityActions';
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
    withActionsMenu?: boolean;
    onDeleted?: () => void;
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
    withActionsMenu = false,
    onDeleted,
}) => {
    const classes: Record<string, string> = useStyles();
    const widgetContents = <EntityBaseInfoContents fields={fields} />;

    const title = (
        <EntityTitle
            hasDuplicates={hasDuplicates}
            duplicateUrl={duplicateUrl}
        />
    );

    let titleButton = {};
    if (withLinkToEntity) {
        titleButton = {
            IconButton,
            iconButtonProps: {
                url: `/${baseUrls.entityDetails}/entityId/${entity.id}`,
                icon: 'remove-red-eye',
                tooltipMessage: MESSAGES.see,
            },
        };
    } else if (withActionsMenu) {
        titleButton = {
            IconButton: EntityActionsMenu,
            iconButtonProps: { entity, onDeleted },
        };
    }

    return (
        <WidgetPaper
            className={classes.infoPaper}
            title={title}
            {...titleButton}
        >
            {widgetContents}
        </WidgetPaper>
    );
};
