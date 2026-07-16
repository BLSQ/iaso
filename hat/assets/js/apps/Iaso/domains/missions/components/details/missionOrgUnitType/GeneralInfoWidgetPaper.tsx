import React from 'react';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Table, TableBody, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionOrgUnitTypeRetrieve } from 'Iaso/api/missions';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import MESSAGES from 'Iaso/domains/missions/messages';
import { LEFT_CELL_WIDTH } from 'Iaso/domains/missions/utils';
import { OrgUnitAndFormChip } from '../../chips/OrgUnitAndFormChip';
import { InfosTitle } from '../InfosTitle';

type GeneralInfoWidgetPaperProps = {
    mission: MissionOrgUnitTypeRetrieve;
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
                            value: mission.description,
                        }}
                    />
                    <Row
                        leftCellWidth={LEFT_CELL_WIDTH}
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.missionType),
                            value: <OrgUnitAndFormChip />,
                        }}
                    />
                </TableBody>
            </Table>{' '}
            <Typography
                variant="body1"
                sx={{
                    textTransform: 'uppercase',
                    mb: 2,
                    fontSize: '15px',
                    mt: 2,
                }}
            >
                <LocationOnIcon
                    color="primary"
                    sx={{
                        mr: 1,
                        fontSize: '15px',
                        position: 'relative',
                        top: '2px',
                    }}
                />
                {formatMessage(MESSAGES.orgUnitType)}
            </Typography>
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
                            label: formatMessage(MESSAGES.orgUnitType),
                            value: mission.org_unit_type.name,
                        }}
                    />
                    <Row
                        leftCellWidth={LEFT_CELL_WIDTH}
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.minCardinality),
                            value: mission.min_cardinality.toLocaleString(),
                        }}
                    />

                    <Row
                        leftCellWidth={LEFT_CELL_WIDTH}
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.maxCardinality),
                            value: mission?.max_cardinality?.toLocaleString() ?? (
                                <AllInclusiveIcon
                                    sx={{ position: 'relative', top: '2px' }}
                                    fontSize="small"
                                    color="primary"
                                    aria-label={formatMessage(
                                        MESSAGES.infinity,
                                    )}
                                />
                            ),
                        }}
                    />
                </TableBody>
            </Table>
        </>
    );
};
