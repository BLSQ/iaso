import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Collapse, Grid } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { BudgetDetailsFilters } from '../BudgetDetailsFilters';

type Props = {
    params: any;
    showHidden: boolean;
    setShowHidden: (show: boolean) => void;
    stepsList?: DropdownOptions<string>[];
};

export const BudgetDetailsFiltersMobile: FunctionComponent<Props> = ({
    params,
    showHidden,
    setShowHidden,
    stepsList = [],
}) => {
    const [expand, setExpand] = useState<boolean>(false);
    return (
        <Box width="100%" mb={2}>
            <Grid container justifyContent="space-between">
                <Grid item>
                    <MoreHorizIcon
                        color="action"
                        onClick={() => {
                            setExpand(value => !value);
                        }}
                    />
                </Grid>
            </Grid>
            <Collapse in={expand}>
                <BudgetDetailsFilters
                    params={params}
                    stepsList={stepsList}
                    buttonSize="small"
                    showHidden={showHidden}
                    setShowHidden={setShowHidden}
                />
            </Collapse>
        </Box>
    );
};
