import React, {
    FunctionComponent,
    useCallback,
    useState,
    MouseEvent,
} from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Popper,
    Paper,
    IconButton as MuiIconButton,
    ClickAwayListener,
    Box,
} from '@mui/material';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetOrgUnitsByOrgUnitTypeId } from 'Iaso/domains/assignments/hooks/requests/useGetOrgUnits';
import { Planning } from 'Iaso/domains/assignments/types/planning';
import { ParameterValues } from '../hooks/usePipelineParameters';
import { MESSAGES } from '../messages';

type Props = {
    index: number;
    orgUnitTypeId?: number;
    handleParameterChange: (parameterName: string, value: any) => void;
    selectedOrgUnitIds: number[];
    parameterValues?: ParameterValues;
    planning: Planning;
};

export const PopperConfig: FunctionComponent<Props> = ({
    index,
    orgUnitTypeId,
    handleParameterChange,
    selectedOrgUnitIds,
    parameterValues,
    planning,
}) => {
    const { data: orgUnits, isFetching: isFetchingOrgUnits } =
        useGetOrgUnitsByOrgUnitTypeId({
            orgUnitTypeId,
            projectId: planning.project,
        });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [openPopperIndex, setOpenPopperIndex] = useState<number | null>(null);

    // Popper handlers
    const handlePopperOpen = useCallback(
        (event: MouseEvent<HTMLElement>, index: number) => {
            setAnchorEl(event.currentTarget);
            setOpenPopperIndex(index);
        },
        [],
    );

    const handlePopperClose = useCallback(() => {
        setAnchorEl(null);
        setOpenPopperIndex(null);
    }, []);

    const handleExcludedOrgUnitsChange = useCallback(
        (value: string) => {
            const selectedOrgUnitIds =
                value?.split(',').map(id => parseInt(id, 10)) || [];
            const currentArray =
                parameterValues?.org_unit_type_exceptions || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = selectedOrgUnitIds;
            handleParameterChange('org_unit_type_exceptions', updatedArray);
        },
        [
            handleParameterChange,
            index,
            parameterValues?.org_unit_type_exceptions,
        ],
    );
    return (
        <>
            <MuiIconButton
                disabled={!orgUnitTypeId}
                onClick={event => handlePopperOpen(event, index)}
                size="small"
            >
                <MoreVertIcon />
            </MuiIconButton>
            <Popper
                open={openPopperIndex === index && Boolean(anchorEl)}
                anchorEl={anchorEl}
                placement="right"
                sx={{ zIndex: 1300 }}
            >
                <Box>
                    <ClickAwayListener onClickAway={handlePopperClose}>
                        <Paper sx={{ p: 2, width: 450 }}>
                            <InputComponent
                                type="select"
                                multi
                                label={MESSAGES.excludedOrgUnits}
                                keyValue="orgUnitId"
                                value={selectedOrgUnitIds}
                                loading={isFetchingOrgUnits}
                                options={orgUnits?.map(ou => ({
                                    label: ou.name,
                                    value: ou.id,
                                }))}
                                onChange={(_, value) => {
                                    handleExcludedOrgUnitsChange(value);
                                }}
                            />
                        </Paper>
                    </ClickAwayListener>
                </Box>
            </Popper>
        </>
    );
};
