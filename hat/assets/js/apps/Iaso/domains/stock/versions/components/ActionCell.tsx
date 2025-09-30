import React, { FunctionComponent } from 'react';

import BlockIcon from '@mui/icons-material/Block';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton as IconButtonComponent } from 'bluesquare-components';

import { baseUrls } from 'Iaso/constants/urls';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from '../../messages';
import { StockRulesVersion } from '../../types/stocks';

import { useCopyStockRulesVersion } from '../hooks/requests';
import { useDeleteStockRulesVersion } from '../hooks/requests';
import { useUpdateStockRulesVersion } from '../hooks/requests';
import { PublishVersionIconModal } from './PublishVersionModal';

type Props = {
    version: StockRulesVersion;
};

const useStyles = makeStyles(theme => ({
    publishIcon: {
        display: 'inline-block',
        '& svg': {
            color: theme.palette.success.main,
        },
    },
}));

export const VersionsActionCell: FunctionComponent<Props> = ({ version }) => {
    const classes = useStyles();
    const { id, status } = version;
    const { mutate: copyStockRulesVersion } = useCopyStockRulesVersion();
    const { mutate: deleteStockRulesVersion } = useDeleteStockRulesVersion();
    const { mutate: updateStockRulesVersion } = useUpdateStockRulesVersion();
    const icon = status === 'DRAFT' ? 'edit' : 'remove-red-eye';
    const tooltipMessage = status === 'DRAFT' ? MESSAGES.edit : MESSAGES.see;
    return (
        <>
            <IconButtonComponent
                url={`/${baseUrls.stockRulesVersions}/versionId/${id}`}
                icon={icon}
                tooltipMessage={tooltipMessage}
            />
            {status !== 'DRAFT' && (
                <IconButtonComponent
                    onClick={() => copyStockRulesVersion(version)}
                    overrideIcon={FileCopyIcon}
                    tooltipMessage={MESSAGES.copy}
                    dataTestId={`copy-button-${version.id}`}
                />
            )}
            {status === 'DRAFT' && (
                <DeleteDialog
                    keyName={`stock-rules-version-${id}`}
                    titleMessage={MESSAGES.deleteTitle}
                    message={MESSAGES.deleteText}
                    onConfirm={() => deleteStockRulesVersion(version)}
                />
            )}
            {status !== 'PUBLISHED' && (
                <Box className={classes.publishIcon}>
                    <PublishVersionIconModal
                        version={version}
                        iconProps={{
                            dataTestId: `publish-button-${id}`,
                        }}
                    />
                </Box>
            )}
            {status === 'PUBLISHED' && (
                <IconButtonComponent
                    onClick={() =>
                        updateStockRulesVersion({
                            id: id,
                            status: 'UNPUBLISHED',
                        })
                    }
                    overrideIcon={BlockIcon}
                    tooltipMessage={MESSAGES.unpublish}
                    color="error"
                />
            )}
        </>
    );
};
