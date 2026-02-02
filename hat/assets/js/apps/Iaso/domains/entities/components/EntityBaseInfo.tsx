import React, { FunctionComponent } from 'react';
import { Box, Button, Grid } from '@mui/material';
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
import { ManualDuplicateDialog } from './ManualEntityDuplicate';

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
    entityId: number;
    hasDuplicates: boolean;
    duplicateUrl?: string;
    showManualDuplicates: boolean;
}> = ({ entityId, hasDuplicates, duplicateUrl, showManualDuplicates }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container alignItems="center">
            <Grid item xs={6}>
                {formatMessage(MESSAGES.entityInfo)}
            </Grid>
            <Grid
                item
                xs={6}
                justifyContent="flex-end"
                container
                alignItems="center"
                spacing={1}
            >
                {hasDuplicates && duplicateUrl && (
                    <Grid item>
                        <LinkButton to={duplicateUrl} size="small">
                            {formatMessage(MESSAGES.seeDuplicates)}
                        </LinkButton>
                    </Grid>
                )}

                <Grid item>
                    {showManualDuplicates && (
                        <ManualDuplicateDialog entityId={entityId} />
                    )}
                </Grid>
            </Grid>
        </Grid>
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

    const openMigratedToInstance = () => {
        window.open(
            `/old-trypelim-dashboard/datas/register/detail/patient_id/${entity.migration_source}/order/last_name/pageSize/50/page/1`,
            '_blank',
        );
    };

    const title = (
        <EntityTitle
            entityId={entity.id}
            hasDuplicates={hasDuplicates}
            duplicateUrl={duplicateUrl}
            showManualDuplicates={!withLinkToEntity}
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
        <Box>
            <WidgetPaper className={classes.infoPaper} title={title}>
                {widgetContents}
            </WidgetPaper>
            {entity.migration_source && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openMigratedToInstance()}
                >
                    Open patient
                </Button>
            )}
        </Box>
    );
};
