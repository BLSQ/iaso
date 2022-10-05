import React, { FunctionComponent, useState } from 'react';
import { Collapse, Grid } from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { BudgetDetailsFilters } from './BudgetDetailsFilters';
import { LinkToProcedure } from './LinkToProcedure';

type Props = { params: any };

export const BudgetDetailsFiltersMobile: FunctionComponent<Props> = ({
    params,
    // expand,
    // onClick,
}) => {
    const [expand, setExpand] = useState<boolean>(false);
    return (
        <>
            <Grid container justifyContent="space-between">
                <Grid item>
                    <LinkToProcedure />
                </Grid>
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
                <BudgetDetailsFilters params={params} buttonSize="small" />
            </Collapse>
        </>
    );
};
