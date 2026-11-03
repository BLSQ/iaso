import React, { FC, ReactNode } from 'react';
import {
    SxProps,
    Table,
    TableBody,
    TableContainer,
    Theme,
} from '@mui/material';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import { LEFT_CELL_WIDTH } from 'Iaso/domains/missions/utils';
import { missionStyles } from '../styles';

type Props = {
    rows: { label: string; value: ReactNode }[];
};

export const DetailsTable: FC<Props> = ({ rows }) => (
    <TableContainer sx={missionStyles.bordered}>
        <Table
            sx={
                [
                    missionStyles.borderedTable,
                    missionStyles.detailsTable,
                ] as SxProps<Theme>
            }
        >
            <TableBody>
                {rows.map(field => (
                    <Row
                        key={field.label}
                        leftCellWidth={LEFT_CELL_WIDTH}
                        showDivider={false}
                        field={field}
                    />
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);
