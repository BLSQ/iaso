import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CallSplit from '@material-ui/icons/CallSplit';
import {
    Tooltip,
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Divider,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { formatThousand } from '../../../utils';

const SplitRoutesModalComponent = (
    {
        handleSplit,
        currentAssignation,
    },
) => {
    if (!currentAssignation) return null;
    const [open, setOpen] = useState(false);
    const [split, setSplit] = useState({
        part1: 0,
        part2: 0,
    });
    const population = currentAssignation.population_split || currentAssignation.population;
    const isSplitValid = () => (
        (split.part1
            && split.part2
            && split.part1 < population
            && split.part2 < population
            && split.part1 + split.part2 === population)
    );

    const onValidate = () => {
        handleSplit(split);
        setOpen(false);
    };

    const onChangeSplit = (key, event) => {
        const newSplit = {};
        const value = parseInt(event.currentTarget.value, 10);
        newSplit[key] = value;
        if (key === 'part1') {
            newSplit.part2 = population - value;
        }
        if (key === 'part2') {
            newSplit.part1 = population - value;
        }
        setSplit(newSplit);
    };

    const handleFocus = event => event.target.select();

    return (
        <>
            <Tooltip
                placement="bottom"
                title={(
                    <FormattedMessage
                        id="microplanning.route.splitVillage"
                        defaultMessage="Split village"
                    />
                )}
            >
                <IconButton size="small" onClick={() => setOpen(true)}>
                    <CallSplit fontSize="small" />
                </IconButton>
            </Tooltip>
            <Dialog
                open={open}
                onBackdropClick={() => setOpen(false)}
                scroll="body"
            >
                <DialogTitle>
                    <FormattedMessage id="microplanning.route.split" defaultMessage="Divide" />
                    {
                        ` ${currentAssignation.name} - `
                    }
                    <FormattedMessage id="main.label.total_population" defaultMessage="population" />
                    {
                        `: ${formatThousand(population)}`
                    }
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <section className="small-modal-content margin-top">
                        <Grid container spacing={1} className="margin-bottom">
                            <Grid
                                xs={5}
                                item
                                container
                                justify="center"
                                alignItems="center"
                            >
                                <label
                                    htmlFor="part-1"
                                    className="label flex-center display-flex no-margin"
                                >
                                    <FormattedMessage id="microplanning.route.part" defaultMessage="Part" />
                                    <span> 1: </span>
                                    <input
                                        onFocus={handleFocus}
                                        className="align-center"
                                        id="part-1"
                                        type="number"
                                        min={0}
                                        max={population}
                                        value={split.part1}
                                        onChange={event => onChangeSplit('part1', event)}
                                    />
                                </label>
                            </Grid>
                            <Grid
                                xs={2}
                                item
                                container
                                justify="center"
                                alignItems="center"
                            >
                                <span
                                    className="label flex-center display-flex no-margin"
                                >
                                    +
                                </span>
                            </Grid>
                            <Grid
                                xs={5}
                                item
                                container
                                justify="center"
                                alignItems="center"
                            >
                                <label
                                    htmlFor="part-2"
                                    className="label flex-center display-flex no-margin"
                                >
                                    <FormattedMessage id="microplanning.route.part" defaultMessage="Part" />
                                    <span> 2: </span>
                                    <input
                                        onFocus={handleFocus}
                                        className="align-center"
                                        id="part-2"
                                        type="number"
                                        min={0}
                                        max={population}
                                        value={split.part2}
                                        onChange={event => onChangeSplit('part2', event)}
                                    />
                                </label>
                            </Grid>
                        </Grid>
                        <div className="align-right margin-top">
                            <button
                                className="button"
                                onClick={() => setOpen(false)}
                            >
                                <i className="fa fa-arrow-left" />
                                <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                            </button>
                            <button
                                disabled={!isSplitValid()}
                                className="button margin-left"
                                onClick={() => onValidate()}
                            >
                                <FormattedMessage
                                    id="main.label.validate"
                                    defaultMessage="Validate"
                                />
                            </button>
                        </div>
                    </section>
                </DialogContent>
            </Dialog>
        </>
    );
};
SplitRoutesModalComponent.defaultProps = {
    currentAssignation: null,
};

SplitRoutesModalComponent.propTypes = {
    currentAssignation: PropTypes.object,
    handleSplit: PropTypes.func.isRequired,
};

export default SplitRoutesModalComponent;
