import classnames from 'classnames';
import React, {
    FunctionComponent,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

import { Box, TableCell } from '@mui/material';

import { isEqual } from 'lodash';
import { useSelector } from 'react-redux';
import { polioVaccines } from '../../../../constants/virus';
import { PolioCreateEditDialog as CreateEditDialog } from '../../../Campaigns/MainDialog/CreateEditDialog';
import { useStyles } from '../Styles';
import { RoundPopperContext } from '../contexts/RoundPopperContext';
import { RoundPopper } from '../popper/RoundPopper';
import {
    CalendarRound,
    MappedCampaign,
    PeriodType,
    ReduxState,
} from '../types';

type Props = {
    colSpan: number;
    campaign: MappedCampaign;
    round: CalendarRound;
    periodType: PeriodType;
};

const getVaccineColor = (vaccine: string) =>
    polioVaccines.find(polioVaccine => polioVaccine.value === vaccine)?.color ||
    '#bcbcbc';

export const RoundCell: FunctionComponent<Props> = ({
    colSpan,
    campaign,
    round,
    periodType,
}) => {
    const classes = useStyles();
    const [dialogOpen, setDialogOpen] = useState(false);

    const { anchorEl, setAnchorEl } = useContext(RoundPopperContext);
    const [self, setSelf] = useState<HTMLElement | null>(null);

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (!self) {
                setSelf(event.currentTarget);
            }
            setAnchorEl(
                isEqual(event.currentTarget, anchorEl)
                    ? undefined
                    : event.currentTarget,
            );
        },
        [anchorEl, self, setAnchorEl],
    );

    const handleClose = () => {
        setAnchorEl(undefined);
    };

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const open = self && isEqual(self, anchorEl);
    const isLogged = useSelector((state: ReduxState) =>
        Boolean(state.users.current),
    );
    const vaccinesList = useMemo(() => {
        const list = campaign.separateScopesPerRound
            ? round.vaccine_names?.split(',') ?? []
            : campaign.original.vaccines?.split(',') ?? [];
        return list.map((vaccineName: string) => vaccineName.trim());
    }, [
        campaign.original.vaccines,
        campaign.separateScopesPerRound,
        round.vaccine_names,
    ]);

    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
            colSpan={colSpan}
        >
            <Box
                className={classes.coloredBox}
                sx={{
                    border: campaign.isTest ? '1px dashed red' : undefined,
                }}
            >
                {vaccinesList.map((vaccine: string) => (
                    <span
                        key={`${campaign.id}-${round.number}-${vaccine}`}
                        style={{
                            backgroundColor: getVaccineColor(vaccine),
                            display: 'block',
                            height: `${100 / vaccinesList.length}%`,
                        }}
                    />
                ))}
            </Box>
            <span
                onClick={handleClick}
                role="button"
                tabIndex={0}
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanWithPopOver,
                )}
            >
                {periodType !== 'year' && colSpan > 1 && `R${round.number}`}
                {periodType === 'year' && colSpan > 1 && round.number}
            </span>
            {open && (
                <RoundPopper
                    open={open}
                    round={round}
                    anchorEl={anchorEl}
                    campaign={campaign}
                    handleClose={handleClose}
                    setDialogOpen={setDialogOpen}
                />
            )}
            {isLogged && (
                <CreateEditDialog
                    campaignId={campaign.original.id}
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                />
            )}
        </TableCell>
    );
};
