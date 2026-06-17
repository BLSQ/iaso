import React from 'react';
import { Stack, Typography } from '@mui/material';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
} from 'bluesquare-components';
import { baseUrls } from '../../../../../constants/urls';
import { Instance } from '../../../../instances/types/instance';
import MESSAGES from '../../messages';

interface Props {
    instance: Instance;
}

const ExpandableLabel: React.FunctionComponent<Props> = ({ instance }) => {
    return (
        <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
        }}>
            <Typography variant="h6">
                {`${instance.form_name} - ${displayDateFromTimestamp(instance.source_created_at)}`}
            </Typography>
            <IconButtonComponent
                size="small"
                url={`/${baseUrls.instanceDetail}/instanceId/${instance?.id}`}
                icon="remove-red-eye"
                tooltipMessage={MESSAGES.submissionTitle}
                color="primary"
            />
        </Stack>
    );
};

export default ExpandableLabel;
