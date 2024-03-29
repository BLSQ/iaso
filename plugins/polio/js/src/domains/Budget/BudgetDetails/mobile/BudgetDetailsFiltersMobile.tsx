import React, { FunctionComponent, useState } from 'react';
import { Collapse, Grid, Box } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { BudgetDetailsFilters } from '../BudgetDetailsFilters';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    params: any;
    showHidden: boolean;
    // eslint-disable-next-line no-unused-vars
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
