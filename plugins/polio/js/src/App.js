import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Pages } from './components/Pages';

function App() {
    return (
        <Router>
            <div>
                <Switch>
                    <Route path="/">
                        <Dashboard />
                    </Route>
                    <Route path="/pages/polio/list">
                        <Pages />
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;
