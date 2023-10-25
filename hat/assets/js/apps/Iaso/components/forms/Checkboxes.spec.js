import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { Box } from '@mui/material';
import { Checkboxes } from './Checkboxes';
import { renderWithStore } from '../../../../test/utils/redux';
import InputComponent from './InputComponent';

let component;

const onChange1 = sinon.spy();
const onChange2 = sinon.spy();
const onChange3 = sinon.spy();

const keyValues = ['Goron', 'Gerudo', 'Zora'];
const updaters = [onChange1, onChange2, onChange3];
const DEFAULT_VALUE = true;

const checkboxesProp = () => {
    return [
        {
            keyValue: keyValues[0],
            label: { id: keyValues[0], defaultMessage: keyValues[0] },
            value: DEFAULT_VALUE,
            onChange: updaters[0],
        },
        {
            keyValue: keyValues[1],
            label: { id: keyValues[1], defaultMessage: keyValues[1] },
            value: DEFAULT_VALUE,
            onChange: updaters[1],
        },
        {
            keyValue: keyValues[2],
            label: { id: keyValues[2], defaultMessage: keyValues[2] },
            value: DEFAULT_VALUE,
            onChange: updaters[2],
        },
    ];
};
const renderComponent = props => {
    component = mount(
        renderWithStore(
            <Checkboxes inline={props.inline} checkboxes={props.checkboxes} />,
        ),
    );
};
describe('Checkboxes component', () => {
    describe("when no 'inline props is passed", () => {
        beforeEach(() => {
            renderComponent({ checkboxes: checkboxesProp() });
        });
        it('mounts properly', () => {
            expect(component.exists()).to.equal(true);
        });
        it('triggers onChange when clicked', () => {
            for (let i = 0; i < keyValues.length; i += 1) {
                let checkbox = component
                    .find(InputComponent)
                    .filter(`[keyValue="${keyValues[i]}"]`);
                expect(checkbox.exists()).to.equal(true);
                expect(checkbox.props().value).to.equal(DEFAULT_VALUE);
                checkbox.props().onChange(null, null);
                component.update();
                checkbox = component
                    .find(InputComponent)
                    .filter(`[keyValue="${keyValues[i]}"]`);
                expect(updaters[i]).to.have.been.calledOnce;
            }
        });
        it('renders boxes vertically', () => {
            const box = component.find(Box).at(0);
            expect(box.prop('style')).to.have.property('display', 'grid');
        });
    });
    describe('when inline props set to true', () => {
        beforeEach(() => {
            renderComponent({ checkboxes: checkboxesProp(), inline: true });
        });
        it('renders boxes inline', () => {
            const box = component.find(Box).at(0);
            expect(box.prop('style')).to.have.property('display', 'inlineFlex');
        });
    });
});
