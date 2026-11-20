import React from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import Alert from '@mui/material/Alert/Alert';
import Box from '@mui/material/Box/Box';
import type { Theme } from '@mui/material/styles';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableContainer from '@mui/material/TableContainer/TableContainer';
import TableRow from '@mui/material/TableRow/TableRow';
import type { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { useSafeIntl } from 'bluesquare-components';
import { MissionPolymorphicRetrieve } from 'Iaso/api/missions/models/missionPolymorphicRetrieve.zod';
import MESSAGES from 'Iaso/domains/missions/messages';
import { SxStyles } from 'Iaso/types/general';
import { formatMaxCardinality } from '../../utils';
import { MissionFormName } from '../forms/MissionFormName';
import { MissionFormsTableHead } from '../forms/MissionFormsTableHead';
import { missionStyles } from '../styles';
import { DetailsSectionTitle } from './DetailsSectionTitle';

type FormWidgetPaperProps = {
    mission: MissionPolymorphicRetrieve;
};

const styles: SxStyles = {
    tableContainer: {
        ...missionStyles.bordered,
        maxHeight: 'calc(95vh - 260px)',
        overscrollBehavior: 'none',
    },
};

const tableSx = [
    missionStyles.borderedTable,
    missionStyles.greyHeaderTable,
] as SxProps<Theme>;

export const FormWidgetPaper: React.FunctionComponent<FormWidgetPaperProps> = ({
    mission,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box id={`mission-${mission.id}-forms`} data-testid={'missions-forms'}>
            <DetailsSectionTitle
                Icon={DescriptionIcon}
                title={formatMessage(MESSAGES.forms)}
            />
            {mission.forms?.length ? (
                <TableContainer sx={styles.tableContainer}>
                    <Table stickyHeader sx={tableSx}>
                        <MissionFormsTableHead
                            minLabel={formatMessage(MESSAGES.min)}
                            maxLabel={formatMessage(MESSAGES.max)}
                        />
                        <TableBody>
                            {mission.forms.map(
                                ({
                                    form,
                                    form_name,
                                    min_cardinality,
                                    max_cardinality,
                                }) => (
                                    <TableRow key={form}>
                                        <TableCell>
                                            <MissionFormName name={form_name} />
                                        </TableCell>
                                        <TableCell>
                                            {min_cardinality.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {formatMaxCardinality(
                                                max_cardinality,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ),
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity={'info'}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </Box>
    );
};
