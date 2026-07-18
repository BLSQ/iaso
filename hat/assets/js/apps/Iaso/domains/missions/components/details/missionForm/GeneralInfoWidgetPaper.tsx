import React from 'react';
import { Table, TableBody } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { MissionFormRetrieve } from 'Iaso/api/missions';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import { FormsChip } from 'Iaso/domains/missions/components/chips/FormsChip';
import MESSAGES from 'Iaso/domains/missions/messages';
import { LEFT_CELL_WIDTH } from 'Iaso/domains/missions/utils';
import { InfosTitle } from '../InfosTitle';

type GeneralInfoWidgetPaperProps = {
    mission: MissionFormRetrieve;
};

export const GeneralInfoWidgetPaper: React.FunctionComponent<
    GeneralInfoWidgetPaperProps
> = ({ mission }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <InfosTitle />
            <Table
                size="small"
                sx={{
                    border: theme =>
                        // @ts-ignore
                        `1px solid ${theme.palette.ligthGray.border}`,
                }}
            >
                <TableBody>
                    <Row
                        leftCellWidth={LEFT_CELL_WIDTH}
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.description),
                            value: mission.description || textPlaceholder,
                        }}
                    />
                    <Row
                        leftCellWidth={LEFT_CELL_WIDTH}
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.missionType),
                            value: <FormsChip />,
                        }}
                    />
                </TableBody>
            </Table>
        </>
    );
};
