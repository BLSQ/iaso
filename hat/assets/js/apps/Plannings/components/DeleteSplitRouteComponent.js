import React, { useState } from 'react';
import {
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
    Tooltip,
    Divider,
} from '@material-ui/core';
import { FormattedMessage, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Select from 'react-select';

import HighlightOff from '@material-ui/icons/HighlightOff';

const DeleteSplitRoute = (
    {
        assignations,
        currentAssignation,
        intl: {
            formatMessage,
        },
        handleDelete,
        monthList,
    },
) => {
    const [open, setOpen] = useState(false);
    const [selectedAssignation, selectAssignation] = React.useState(null);
    return (
        <>
            <Tooltip
                placement="bottom"
                title={(
                    <FormattedMessage
                        id="microplanning.route.deleteVillage"
                        defaultMessage="Delete village"
                    />
                )}
            >
                <IconButton size="small" onClick={() => setOpen(true)}>
                    <HighlightOff fontSize="small" />
                </IconButton>
            </Tooltip>
            <Dialog
                open={open}
                onBackdropClick={() => setOpen(false)}
                scroll="body"
            >
                <DialogTitle>
                    <FormattedMessage id="microplanning.route.deleteVillage" defaultMessage="Delete village" />
                    {
                        ` ${currentAssignation.name} - `
                    }
                    <FormattedMessage id="main.label.total_population" defaultMessage="population" />
                    {
                        `: ${currentAssignation.population_split || currentAssignation.village_population}`
                    }
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <section className="small-modal-content margin-top">
                        <Typography variant="body1">
                            <FormattedMessage
                                id="microplanning.route.selectAssignation"
                                defaultMessage="PLease select another assignation in the planning in order to attribute the population"
                            />
                        </Typography>
                        <Select
                            className="margin-top"
                            multi={false}
                            clearable
                            simpleValue
                            value={selectedAssignation}
                            placeholder={formatMessage({
                                id: 'main.label.selectOption',
                                defaultMessage: 'Select an option',
                            })}
                            options={assignations.map(a => ({
                                label: `M.${a.month} - ${monthList[a.month - 1].fullLabel} - pop: ${a.population_split || a.village_population}`,
                                value: a.id,
                            }))}
                            onChange={value => selectAssignation(value)}
                        />
                        <div className="align-right margin-top">
                            <button
                                className="button"
                                onClick={() => setOpen(false)}
                            >
                                <i className="fa fa-arrow-left" />
                                <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                            </button>
                            <button
                                disabled={!selectedAssignation}
                                className="button margin-left"
                                onClick={() => {
                                    setOpen(false);
                                    handleDelete(assignations.find(a => a.id === selectedAssignation));
                                }}
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

DeleteSplitRoute.propTypes = {
    intl: PropTypes.object.isRequired,
    assignations: PropTypes.array.isRequired,
    currentAssignation: PropTypes.object.isRequired,
    handleDelete: PropTypes.func.isRequired,
    monthList: PropTypes.array.isRequired,
};


export default injectIntl(DeleteSplitRoute);
