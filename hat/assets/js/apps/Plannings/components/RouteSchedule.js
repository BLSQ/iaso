import React, { Component } from 'react';
import isEqual from 'lodash/isEqual';

import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatThousand } from '../../../utils';

import {
    reorder,
    getItemStyle,
    move,
    filterAssignations,
    reIndex,
} from '../utils/routeUtils';

class RouteSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assignations: filterAssignations(props.assignations),
        };
    }

    componentDidUpdate(prevProps) {
        if ((!this.props.load.loading)
            && (!isEqual(prevProps.assignations, this.props.assignations))) {
            this.setAssignations();
        }
    }

    onDragEnd(result) {
        const { source, destination } = result;
        const { assignations } = this.state;
        if (!destination) {
            return;
        }
        let items = [];
        let tempAssignations = [];
        if (source.droppableId === destination.droppableId) {
            items = reorder(
                assignations.filter(assignation => (assignation.key === destination.droppableId))[0].data,
                source.index,
                destination.index,
            );
            assignations.forEach((a) => {
                const tempA = a;
                if (tempA.key === destination.droppableId) {
                    tempA.data = items;
                }
                tempAssignations.push(tempA);
            });
        } else {
            items = move(
                assignations.filter(assignation => (assignation.key === source.droppableId))[0].data,
                assignations.filter(assignation => (assignation.key === destination.droppableId))[0].data,
                source,
                destination,
            );
            assignations.forEach((a) => {
                const tempA = a;
                if (tempA.key === source.droppableId) {
                    tempA.data = items[source.droppableId];
                }
                if (tempA.key === destination.droppableId) {
                    tempA.data = items[destination.droppableId];
                }
                tempAssignations.push(tempA);
            });
        }
        tempAssignations = reIndex(tempAssignations);
        const updatedMonth = tempAssignations
            .filter(assignationList => (assignationList.key === destination.droppableId))[0];
        const updatedAssignation = updatedMonth.data
            .filter(assignation => (assignation.id === result.draggableId))[0];
        this.setState({
            assignations: tempAssignations,
        });
        this.props.updateAssignation(updatedAssignation.index, updatedMonth.id, result.draggableId);
    }

    setAssignations() {
        this.setState({
            assignations: filterAssignations(this.props.assignations),
        });
    }


    render() {
        const { assignations } = this.state;
        return (
            <div className="route-schedule">
                <DragDropContext onDragEnd={result => this.onDragEnd(result)}>
                    {assignations.map((assignation, assIndex) => (
                        <Droppable
                            droppableId={assignations[assIndex].key}
                            key={assignations[assIndex].key}
                        >
                            {(drop, snapshot) => (
                                <section className="dnd-container">
                                    <div
                                        className={`month-selector ${this.props.selectedMonth === (assIndex + 1) ? 'selected' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => this.props.selectMonth(assIndex + 1)}
                                    >
                                        {assignations[assIndex].label}
                                        <span>
                                        (
                                            {formatThousand(assignations[assIndex].population)}
                                        )
                                        </span>
                                    </div>
                                    <ul
                                        ref={drop.innerRef}
                                        className={`${snapshot.isDraggingOver ? 'is-draging-over' : ''}`}
                                        id={assignations[assIndex].key}
                                    >
                                        {
                                            assignations[assIndex].data.length === 0
                                            && (
                                                <li className="no-assignation-text">
                                                    <FormattedMessage id="microplanning.route.noAssignation" defaultMessage="No assignation" />
                                                </li>
                                            )
                                        }
                                        {assignations[assIndex]
                                            .data.map((a, index) => (
                                                <Draggable
                                                    key={a.id}
                                                    draggableId={a.id}
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
                                                                {a.name}
                                                                {' '}
(
                                                                {formatThousand(a.population)}
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
    updateAssignation: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    selectedMonth: PropTypes.number.isRequired,
    selectMonth: PropTypes.func.isRequired,
};

export default injectIntl(RouteSchedule);
