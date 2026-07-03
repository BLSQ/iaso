import React, { FunctionComponent } from 'react';
import { Done } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { Table, TableBody } from '@mui/material';
import { TablePropsSizeOverrides } from '@mui/material/Table/Table';
import { OverridableStringUnion } from '@mui/types/esm';
import { useSafeIntl } from 'bluesquare-components';

import moment from 'moment';
import { PaperTableRow } from 'Iaso/components/tables/PaperTableRow';
import { APIImport } from 'Iaso/domains/apiimports/types/apiimport';
import { textOrPlaceholder } from 'Iaso/domains/apiimports/utils';
import getDisplayName from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';

type Props = {
    apiImport: APIImport;
    size?: OverridableStringUnion<'small' | 'medium', TablePropsSizeOverrides>;
};
export const APIImportBaseInfo: FunctionComponent<Props> = ({
    apiImport,
    size,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Table size={size} data-test="api-import-base-info">
                <TableBody>
                    <PaperTableRow
                        label={formatMessage(MESSAGES.is_successful)}
                        value={
                            <>
                                {apiImport.has_problem && (
                                    <CloseIcon color="error" />
                                )}
                                {!apiImport.has_problem && (
                                    <Done color="success" />
                                )}
                            </>
                        }
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.created_at)}
                        value={moment.unix(apiImport.created_at).format('LTS')}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.user)}
                        value={getDisplayName(apiImport.user)}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.import_type)}
                        value={apiImport.import_type}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.app_id)}
                        value={textOrPlaceholder(apiImport.app_id)}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.app_version)}
                        value={textOrPlaceholder(apiImport.app_version)}
                    />
                </TableBody>
            </Table>
        </>
    );
};
