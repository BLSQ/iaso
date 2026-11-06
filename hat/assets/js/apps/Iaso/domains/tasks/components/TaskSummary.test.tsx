import React from 'react';
import { screen, within } from '@testing-library/react';
import moment from 'moment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    renderWithThemeAndIntlProvider,
    setLocale,
} from '../../../../../tests/helpers';
import { Task } from '../types';
import { TaskSummary } from './TaskSummary';

vi.mock('Iaso/libs/Api', () => ({
    getRequest: vi.fn(),
    patchRequest: vi.fn(),
}));

const NOW = new Date(2026, 9, 14, 10, 30);
const at = (secondsAfterNow: number) =>
    moment(NOW).add(secondsAfterNow, 'seconds').unix();

const alice = { id: 1, first_name: 'Alice', last_name: 'Martin' };
const bob = { id: 2, first_name: 'Bob', last_name: 'Dupont' };

const makeTask = (overrides: Partial<Task<unknown>> = {}): Task<unknown> => ({
    id: 26,
    name: 'import_gpkg_task',
    created_at: at(-300),
    started_at: at(-298),
    ended_at: at(-46),
    progress_value: 80,
    end_value: 100,
    created_by: alice,
    launcher: alice,
    result: null,
    status: 'ERRORED',
    should_be_killed: false,
    progress_message: null,
    ...overrides,
});

const section = (name: string) =>
    within(document.querySelector(`[data-test="${name}"]`) as HTMLElement);

describe('TaskSummary', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);
        setLocale('en');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows who ran the task and how long it ran', () => {
        renderWithThemeAndIntlProvider(
            <TaskSummary task={makeTask({ launcher: bob })} />,
        );
        const facts = section('task-facts');

        expect(facts.getByText(/Alice Martin/)).toBeInTheDocument();
        expect(
            facts.getByText(/Relaunched by .*Bob Dupont/),
        ).toBeInTheDocument();
        expect(facts.getByText('4 min 12 s')).toBeInTheDocument();

        const timeline = section('task-timeline');
        expect(timeline.getByText('Created')).toBeInTheDocument();
        expect(timeline.getByText('Started')).toBeInTheDocument();
        expect(timeline.getByText('Failed')).toBeInTheDocument();
    });

    it('does not show a 1970 date for a task that never started', () => {
        renderWithThemeAndIntlProvider(
            <TaskSummary
                task={makeTask({
                    started_at: null as unknown as number,
                    status: 'SUCCESS',
                    created_by: null,
                    launcher: null as unknown as Task<unknown>['launcher'],
                })}
            />,
        );

        expect(screen.queryByText(/1970/)).toBeNull();
        expect(section('task-timeline').getByText('Start')).toBeInTheDocument();
        expect(section('task-facts').getAllByText('--')).toHaveLength(2);
    });

    it('counts the run time of a running task', () => {
        renderWithThemeAndIntlProvider(
            <TaskSummary
                task={makeTask({
                    status: 'RUNNING',
                    started_at: at(-60),
                    ended_at: null,
                })}
            />,
        );

        expect(
            section('task-facts').getByText('Running for'),
        ).toBeInTheDocument();
        expect(section('task-facts').getByText('1 min')).toBeInTheDocument();
        expect(
            section('task-timeline').getByText('Running'),
        ).toBeInTheDocument();
    });

    it('ignores the times of a previous run while a relaunched task is queued', () => {
        renderWithThemeAndIntlProvider(
            <TaskSummary task={makeTask({ status: 'QUEUED' })} />,
        );

        expect(section('task-facts').getByText('--')).toBeInTheDocument();
        const timeline = section('task-timeline');
        expect(timeline.queryByText('Started')).toBeNull();
        expect(timeline.getByText('Waiting for a worker')).toBeInTheDocument();
    });
});
