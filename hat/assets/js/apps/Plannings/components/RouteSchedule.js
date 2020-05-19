import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import FileCopy from '@material-ui/icons/FileCopyOutlined';
import isEqual from 'lodash/isEqual';

import { formatThousand } from '../../../utils';

import {
    reorder,
    getItemStyle,
    move,
    filterAssignations,
    reIndex,
    getCloneAssignations,
} from '../utils/routeUtils';

import SplitRoutesModal from './SplitRoutesModalComponent';
import DeleteSplitRoute from './DeleteSplitRouteComponent';


class RouteSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assignations: filterAssignations(props.assignations, props.monthList),
        };
    }

    componentDidUpdate(prevProps) {
        if (
            !isEqual(prevProps.assignations, this.props.assignations)
        ) {
            this.setAssignations(this.props.assignations);
        }
    }

    onDragEnd(result) {
        const { source, destination } = result;
        const { assignations } = this.state;
        const { updateAssignation } = this.props;
        if (!destination) {
            return;
        }
        let items = [];
        let tempAssignations = [];
        if (source.droppableId === destination.droppableId) {
            items = reorder(
                assignations.filter(assignation => (assignation.id === destination.droppableId))[0].data,
                source.index,
                destination.index,
            );
            assignations.forEach((a) => {
                const tempA = a;
                if (tempA.id === destination.droppableId) {
                    tempA.data = items;
                }
                tempAssignations.push(tempA);
            });
        } else {
            items = move(
                assignations.filter(assignation => (assignation.id === source.droppableId))[0].data,
                assignations.filter(assignation => (assignation.id === destination.droppableId))[0].data,
                source,
                destination,
            );
            assignations.forEach((a) => {
                const tempA = a;
                if (tempA.id === source.droppableId) {
                    tempA.data = items[source.droppableId];
                }
                if (tempA.id === destination.droppableId) {
                    tempA.data = items[destination.droppableId];
                }
                tempAssignations.push(tempA);
            });
        }
        tempAssignations = reIndex(tempAssignations);
        const updatedMonth = tempAssignations
            .filter(assignationList => (assignationList.id === destination.droppableId))[0];
        this.setState({
            assignations: tempAssignations,
        });
        updateAssignation(updatedMonth.id, tempAssignations);
    }

    setAssignations() {
        this.setState({
            assignations: filterAssignations(this.props.assignations, this.props.monthList),
        });
    }

    handleSplit(split, index, monthId) {
        const { assignations } = this.state;
        const { updateAssignation } = this.props;

        let tempAssignations = [...assignations];
        const assignationClone = {
            ...tempAssignations[monthId].data[index],
            population_split: split.part2,
            split: true,
            clone: true,
        };
        tempAssignations[monthId].data[index] = {
            ...tempAssignations[monthId].data[index],
            population_split: split.part1,
            split: true,
        };
        tempAssignations[monthId].data[index].population = split.part1;
        tempAssignations[monthId].data.splice(index + 1, 0, assignationClone);
        tempAssignations = reIndex(tempAssignations);
        this.setState({
            assignations: tempAssignations,
        });
        updateAssignation(monthId + 1, tempAssignations);
    }

    handleDelete(target, origin) {
        const { assignations } = this.state;
        const { updateAssignation } = this.props;
        let tempAssignations = [...assignations];
        const targetAssignation = tempAssignations[target.month - 1].data.find(a => a.index === target.index);
        const originAssignation = tempAssignations[origin.month - 1].data.find(a => a.index === origin.index);
        const popTotal = targetAssignation.population_split + originAssignation.population_split;
        if (popTotal === targetAssignation.population) {
            delete targetAssignation.population_split;
            delete targetAssignation.split;
        } else {
            targetAssignation.population_split = popTotal;
        }
        if (targetAssignation.id === originAssignation.id) {
            const originIndex = tempAssignations[origin.month - 1].data.findIndex(a => a.index === origin.index);
            tempAssignations[origin.month - 1].data.splice(originIndex, 1);
        } else {
            originAssignation.deleted = true;
        }
        tempAssignations = reIndex(tempAssignations);
        this.setState({
            assignations: tempAssignations,
        });
        updateAssignation(target.month, tempAssignations);
    }


    render() {
        const { assignations } = this.state;
        const { monthList } = this.props;
        return (
            <div className="route-schedule">
                <DragDropContext onDragEnd={result => this.onDragEnd(result)}>
                    {assignations.map((assignation, assIndex) => (
                        <Droppable
                            droppableId={assignation.id}
                            key={assignation.id}
                        >
                            {(drop, snapshot) => (
                                <section className="dnd-container">
                                    <div
                                        className={`month-selector ${this.props.selectedMonth === (assIndex + 1) ? 'selected' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => this.props.selectMonth(assIndex + 1)}
                                    >
                                        {assignation.label}
                                        {
                                            assignation.key !== 'not-assigned'
                                                && (
                                                    <span>
                                                        {assignation.fullLabel}
                                                    </span>
                                                )
                                        }
                                        <span>
                                                (
                                            {formatThousand(assignation.population)}
                                                )
                                        </span>
                                    </div>
                                    <ul
                                        ref={drop.innerRef}
                                        className={`${snapshot.isDraggingOver ? 'is-draging-over' : ''}`}
                                        id={assignation.key}
                                    >
                                        {
                                            assignation.data.length === 0
                                                && (
                                                    <li className="no-assignation-text">
                                                        <FormattedMessage id="microplanning.route.noAssignation" defaultMessage="No assignation" />
                                                    </li>
                                                )
                                        }
                                        {assignation
                                            .data.map((a, index) => (
                                                <Draggable
                                                    key={`${assignation.key}-${a.index}-${a.id}`}
                                                    draggableId={`${a.id}-${a.index}`}
                                                    index={index}
                                                >
                                                    {(drag, dragSnapshot) => (
                                                        <li
                                                            ref={drag.innerRef}
                                                            {...drag.draggableProps}
                                                            {...drag.dragHandleProps}
                                                            style={getItemStyle(
                                                                dragSnapshot.isDragging,
                                                                drag.draggableProps.style,
                                                            )}
                                                        >
                                                            <span>
                                                                {index + 1}
                                                                {' '}
                                                                    -
                                                                {a.split ? (
                                                                    <span>
                                                                        <FileCopy fontSize="small" className="copy-icon" />
                                                                        {' '}
                                                                            -
                                                                    </span>
                                                                ) : null}
                                                                {a.name}
                                                                {' '}

                                                                    (
                                                                {a.population_split
                                                                    ? formatThousand(a.population_split)
                                                                    : formatThousand(a.population)}
                                                                    )
                                                                {
                                                                    a.tests_count > 0
                                                                        && (
                                                                            <span className="visited-village">
                                                                                <i className="fa fa-check-circle" aria-hidden="true" />
                                                                                <span>
                                                                                    {a.tests_count}
                                                                                    <FormattedMessage id="microplanning.route.tests-done" defaultMessage="test(s) done" />
                                                                                </span>
                                                                            </span>
                                                                        )
                                                                }
                                                            </span>
                                                            <div className="routes-split-button-container">
                                                                {
                                                                    a.split
                                                                        && (
                                                                            <DeleteSplitRoute
                                                                                monthList={monthList}
                                                                                currentAssignation={a}
                                                                                assignations={getCloneAssignations(assignations, a.village_id, a.index)}
                                                                                handleDelete={target => this.handleDelete(target, {
                                                                                    index: a.index,
                                                                                    month: assIndex + 1,
                                                                                })}
                                                                            />
                                                                        )
                                                                }
                                                                <SplitRoutesModal
                                                                    currentAssignation={a}
                                                                    handleSplit={split => this.handleSplit(split, index, assIndex)}
                                                                />
                                                            </div>
                                                            <i className="fa fa-bars" aria-hidden="true" />
                                                        </li>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {drop.placeholder}
                                    </ul>
                                </section>
                            )}
                        </Droppable>
                    ))}
                </DragDropContext>
            </div>
        );
    }
}

RouteSchedule.defaultProps = {
    params: null,
};
RouteSchedule.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    redirect: PropTypes.func.isRequired,
    assignations: PropTypes.array.isRequired,
    load: PropTypes.object.isRequired,
    selectedMonth: PropTypes.number.isRequired,
    selectMonth: PropTypes.func.isRequired,
    updateAssignation: PropTypes.func.isRequired,
    monthList: PropTypes.array.isRequired,
};

export default injectIntl(RouteSchedule);
