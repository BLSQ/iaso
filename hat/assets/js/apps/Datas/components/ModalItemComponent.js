import React, { Fragment } from 'react';

import {
    Grid,
} from '@material-ui/core';

import PropTypes from 'prop-types';

const ModalItem = ({
    labelComponent,
    fieldComponent,
}) => (
    <Fragment>
        <Grid
            xs={4}
            item
            container
            justify="flex-end"
            alignItems="center"
        >
            {labelComponent}
            :
        </Grid>
        <Grid xs={8} item container justify="flex-start">
            {fieldComponent}
        </Grid>
    </Fragment>
);

ModalItem.propTypes = {
    labelComponent: PropTypes.object.isRequired,
    fieldComponent: PropTypes.object.isRequired,
};


export default ModalItem;
