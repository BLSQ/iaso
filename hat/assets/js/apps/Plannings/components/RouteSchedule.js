import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatThousand, deepEqual } from '../../../utils';

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

    componentWillReceiveProps(nextProps) {
        if ((!nextProps.load.loading) &&
            (!deepEqual(nextProps.assignations, this.props.assignations, true))) {
            this.setState({
                assignations: filterAssignations(nextProps.assignations),
            });
        }
    }

    onDragEnd(result) {
        const { source, destination } = result;
        if (!destination) {
            return;
        }
        let items = [];
        let tempAssignations = [];
        if (source.droppableId === destination.droppableId) {
            items = reorder(
                this.state.assignations.filter(assignation => (assignation.key === destination.droppableId))[0].data,
                source.index,
                destination.index,
            );
            this.state.assignations.map((a) => {
                const tempA = a;
                if (tempA.key === destination.droppableId) {
                    tempA.data = items;
                }
                tempAssignations.push(tempA);
                return true;
            });
        } else {
            items = move(
                this.state.assignations.filter(assignation => (assignation.key === source.droppableId))[0].data,
                this.state.assignations.filter(assignation => (assignation.key === destination.droppableId))[0].data,
                source,
                destination,
            );
            this.state.assignations.map((a) => {
                const tempA = a;
                if (tempA.key === source.droppableId) {
                    tempA.data = items[source.droppableId];
                }
                if (tempA.key === destination.droppableId) {
                    tempA.data = items[destination.droppableId];
                }
                tempAssignations.push(tempA);
                return true;
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

    render() {
        return (
            <div className="route-schedule">
                <DragDropContext onDragEnd={result => this.onDragEnd(result)}>
                    {this.state.assignations.map((assignation, assIndex) => (
                        <Droppable
                            droppableId={this.state.assignations[assIndex].key}
                            key={this.state.assignations[assIndex].key}
                        >
                            {(drop, snapshot) => (
                                <section className="dnd-container">
                                    <div
                                        className={`month-selector ${this.props.selectedMonth === (assIndex + 1) ? 'selected' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => this.props.selectMonth(assIndex + 1)}
                                    >
                                        {this.state.assignations[assIndex].label}
                                        <span>({formatThousand(this.state.assignations[assIndex].population)})</span>
                                    </div>
                                    <ul
                                        ref={drop.innerRef}
                                        className={`${snapshot.isDraggingOver ? 'is-draging-over' : ''}`}
                                        id={this.state.assignations[assIndex].key}
                                    >
                                        {
                                            this.state.assignations[assIndex].data.length === 0 &&
                                            <li className="no-assignation-text">
                                                <FormattedMessage id="microplanning.route.noAssignation" defaultMessage="Aucune assignation" />
                                            </li>
                                        }
                                        {this.state.assignations[assIndex]
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
                                                                {index + 1} - {a.name} ({formatThousand(a.population)})
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
