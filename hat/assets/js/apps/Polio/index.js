import React from 'react';
import ReactDOM from 'react-dom';
import { Route, BrowserRouter, Switch } from 'react-router-dom';

const Home = () => {
    return <h1>Home</h1>;
};

const Test = () => {
    return <h1>Home</h1>;
};

const App = () => {
    return (
        <BrowserRouter basename="/dashboard/polio">
            <div>
                <Switch>
                    <Route path="/">
                        <Home />
                    </Route>
                    <Route path="/test">
                        <Test />
                    </Route>
                </Switch>
            </div>
        </BrowserRouter>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
