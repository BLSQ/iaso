import React, { FunctionComponent } from 'react';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import ENTITY_MESSAGES from '../../../entities/messages';
import { Entity } from '../../../entities/types/entity';
import { Field } from '../../../entities/types/fields';
import { InfoRow } from './InfoRow';

type Props = {
    entity: Entity;
    fields: Field[];
    /** Show the link through to the full entity page */
    withLinkToEntity?: boolean;
};

/**
 * Entity card for the submission rail, styled like the general card. Renders the
 * entity fields resolved by useGetEntityFields; the legacy EntityBaseInfo is
 * kept for the entities and duplicates pages.
 */
export const EntityCard: FunctionComponent<Props> = ({
    entity,
    fields,
    withLinkToEntity = false,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={0} variant="outlined" sx={{ mb: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    px: 2.25,
                    pt: 1.75,
                    pb: 1,
                }}
            >
                <Typography variant="h6" color="primary">
                    {entity.entity_type_name ||
                        formatMessage(ENTITY_MESSAGES.entityInfo)}
                </Typography>
                {withLinkToEntity && (
                    <Tooltip title={formatMessage(ENTITY_MESSAGES.see)}>
                        <IconButton
                            size="small"
                            color="primary"
                            component={LinkWithLocation}
                            to={`/${baseUrls.entityDetails}/entityId/${entity.id}`}
                        >
                            <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Box sx={{ px: 2.25, pb: 1.5 }}>
                {fields.map(field => (
                    <InfoRow key={field.key} label={field.label}>
                        {field.value}
                    </InfoRow>
                ))}
            </Box>
        </Paper>
    );
};
