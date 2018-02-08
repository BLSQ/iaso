var HAT = HAT || {}; HAT["teams_devices"] =
webpackJsonpHAT__name_([4],{

/***/ 1142:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TeamsDevices = exports.DataTable = exports.DeviceEventForm = exports.DeviceEventsList = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactRedux = __webpack_require__(50);

var _reactRouterRedux = __webpack_require__(20);

var _superagent = __webpack_require__(73);

var _superagent2 = _interopRequireDefault(_superagent);

var _reactIntl = __webpack_require__(16);

var _loadingSpinner = __webpack_require__(143);

var _loadingSpinner2 = _interopRequireDefault(_loadingSpinner);

var _modal = __webpack_require__(1144);

var _modal2 = _interopRequireDefault(_modal);

var _fetchData = __webpack_require__(48);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MESSAGES = (0, _reactIntl.defineMessages)({
  'location-all': {
    'id': 'teamsdevices.labels.all',
    'defaultMessage': 'All'
  },
  'loading': {
    'id': 'teamsdevices.labels.loading',
    'defaultMessage': 'Loading'
  }
});

var DeviceEventsList = exports.DeviceEventsList = function (_Component) {
  _inherits(DeviceEventsList, _Component);

  function DeviceEventsList() {
    _classCallCheck(this, DeviceEventsList);

    var _this = _possibleConstructorReturn(this, (DeviceEventsList.__proto__ || Object.getPrototypeOf(DeviceEventsList)).call(this));

    _this.state = {
      data: []
    };
    return _this;
  }

  _createClass(DeviceEventsList, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'table',
        null,
        _react2.default.createElement(
          'thead',
          null,
          _react2.default.createElement(
            'tr',
            null,
            _react2.default.createElement(
              'th',
              null,
              'Type'
            ),
            _react2.default.createElement(
              'th',
              null,
              'Message'
            ),
            _react2.default.createElement(
              'th',
              null,
              'Date'
            ),
            _react2.default.createElement(
              'th',
              null,
              'User'
            )
          )
        ),
        _react2.default.createElement(
          'tbody',
          null,
          this.state.data.map(function (event, i) {
            var eventType = void 0;
            var eventLabel = void 0;
            if (event.event_type == 0) {
              eventType = 'Status';
              eventLabel = event.status__label;
            }

            if (event.event_type == 1) {
              eventType = 'Action';
              eventLabel = event.action__label;
            }
            if (event.event_type == 2) {
              eventType = 'Comment';
              eventLabel = event.comment;
            }
            return _react2.default.createElement(
              'tr',
              null,
              _react2.default.createElement(
                'td',
                null,
                eventType
              ),
              _react2.default.createElement(
                'td',
                null,
                eventLabel
              ),
              _react2.default.createElement(
                'td',
                null,
                _react2.default.createElement(_reactIntl.FormattedDate, { value: new Date(event.date) })
              ),
              _react2.default.createElement(
                'td',
                null,
                event.reporter__username
              )
            );
          })
        )
      );
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var that = this;
      var url = '/api/datasets/device_events/?device_id=' + this.props.deviceId;
      _superagent2.default.get(url).end(function (err, res) {
        if (err) {
          console.log('error accessing url ', url, err);
          return;
        }

        that.setState({
          'data': res.body
        });
      });
    }
  }]);

  return DeviceEventsList;
}(_react.Component);

var DeviceEventForm = exports.DeviceEventForm = function DeviceEventForm(_ref) {
  var deviceId = _ref.deviceId;

  return _react2.default.createElement(
    'form',
    { method: 'post', action: '/sync/device_event_form/' + deviceId + '/' },
    _react2.default.createElement(
      'div',
      { className: 'teamsdevices__event__field__title' },
      'Changer Statut'
    ),
    _react2.default.createElement(
      'select',
      { id: 'id_status', name: 'status' },
      _react2.default.createElement(
        'option',
        { value: '', selected: 'selected' },
        '---------'
      ),
      _react2.default.createElement(
        'option',
        { value: '1' },
        'Probl\xE8mes de connexion'
      ),
      _react2.default.createElement(
        'option',
        { value: '2' },
        'Probl\xE8me r\xE9solu'
      ),
      _react2.default.createElement(
        'option',
        { value: '3' },
        'Probl\xE8me technique'
      )
    ),
    _react2.default.createElement(
      'button',
      { name: 'event_type', value: '0' },
      'Envoyer'
    ),
    _react2.default.createElement(
      'div',
      { className: 'teamsdevices__event__field__title' },
      'Action'
    ),
    _react2.default.createElement(
      'select',
      { id: 'id_action', name: 'action' },
      _react2.default.createElement(
        'option',
        { value: '', selected: 'selected' },
        '---------'
      ),
      _react2.default.createElement(
        'option',
        { value: '1' },
        'Utilisateur appel\xE9'
      ),
      _react2.default.createElement(
        'option',
        { value: '2' },
        'Enqu\xEAte de terrain'
      )
    ),
    _react2.default.createElement(
      'button',
      { name: 'event_type', value: '1' },
      'Envoyer'
    ),
    _react2.default.createElement(
      'div',
      { className: 'teamsdevices__event__field__title' },
      'Ajouter commentaire'
    ),
    _react2.default.createElement('textarea', { cols: '40', id: 'id_comment', name: 'comment', rows: '10' }),
    _react2.default.createElement(
      'button',
      { name: 'event_type', value: '2' },
      'Envoyer'
    )
  );
};

var DataTable = exports.DataTable = function DataTable(_ref2) {
  var device_status = _ref2.data.device_status,
      auditClickHandler = _ref2.auditClickHandler,
      moreClickHandler = _ref2.moreClickHandler;

  return _react2.default.createElement(
    'div',
    { className: 'widget__container', 'data-qa': 'monthly-report-data-loaded' },
    _react2.default.createElement(
      'div',
      { className: 'widget__header' },
      _react2.default.createElement(
        'h2',
        { className: 'widget__heading' },
        _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.header.results', defaultMessage: 'Synchronisation des Appareils' })
      )
    ),
    _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(
        'table',
        null,
        _react2.default.createElement(
          'thead',
          null,
          _react2.default.createElement(
            'tr',
            null,
            _react2.default.createElement(
              'th',
              null,
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.device_id', defaultMessage: 'Identifiant' })
            ),
            _react2.default.createElement(
              'th',
              null,
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.last_sync', defaultMessage: 'Derni\xE8re Sync' })
            ),
            _react2.default.createElement(
              'th',
              null,
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.days_ago', defaultMessage: 'Jours pass\xE9s' })
            ),
            _react2.default.createElement(
              'th',
              null,
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.sync_summary', defaultMessage: 'Total-Cr\xE9\xE9-M\xE0j-Effac\xE9' })
            ),
            _react2.default.createElement(
              'th',
              null,
              'Equipe'
            ),
            _react2.default.createElement(
              'th',
              null,
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.status_audit', defaultMessage: 'Statut Audit' })
            ),
            _react2.default.createElement(
              'th',
              null,
              _react2.default.createElement('span', null)
            )
          )
        ),
        _react2.default.createElement(
          'tbody',
          null,
          device_status.map(function (status, i) {
            var daysClass = 'ok';
            var daysString = void 0;
            if (status.days_since_sync < 0) {
              daysString = "Jamais Synchronisé";
            } else {
              daysString = status.days_since_sync;
            }

            if (status.days_since_sync > 40) {
              daysClass = 'error';
            }
            if (status.days_since_sync > 20) {
              daysClass = 'warning';
            }

            var randomTeam = "Equipe " + Math.ceil(Math.random() * 10);
            return _react2.default.createElement(
              'tr',
              null,
              _react2.default.createElement(
                'td',
                null,
                status.device_id
              ),
              _react2.default.createElement(
                'td',
                null,
                _react2.default.createElement(_reactIntl.FormattedDate, { value: new Date(status.last_synced_date) })
              ),
              _react2.default.createElement(
                'td',
                { className: daysClass },
                daysString
              ),
              _react2.default.createElement(
                'td',
                null,
                status.last_synced_log_message
              ),
              _react2.default.createElement(
                'td',
                null,
                randomTeam
              ),
              _react2.default.createElement(
                'td',
                null,
                _react2.default.createElement(
                  'a',
                  { className: 'pointerClick', onClick: function onClick(e) {
                      auditClickHandler(e, status.id);
                    } },
                  status.last_status != '' ? status.last_status : 'Editer'
                )
              ),
              _react2.default.createElement(
                'td',
                null,
                _react2.default.createElement(
                  'a',
                  { className: 'pointerClick', onClick: function onClick(e) {
                      moreClickHandler(e, status.id);
                    } },
                  'Historique'
                )
              )
            );
          })
        )
      )
    )
  );
};

var TeamsDevices = exports.TeamsDevices = function (_Component2) {
  _inherits(TeamsDevices, _Component2);

  function TeamsDevices() {
    _classCallCheck(this, TeamsDevices);

    var _this2 = _possibleConstructorReturn(this, (TeamsDevices.__proto__ || Object.getPrototypeOf(TeamsDevices)).call(this));

    _this2.dateHandler = _this2.dateHandler.bind(_this2);
    _this2.locationHandler = _this2.locationHandler.bind(_this2);
    _this2.state = {
      isOpen: false,
      currentDeviceId: false,
      edit: false
    };
    return _this2;
  }

  _createClass(TeamsDevices, [{
    key: 'dateHandler',
    value: function dateHandler(event) {
      var url = (0, _fetchData.createUrl)(_extends({}, this.props.params, { date_month: event.target.value }));
      this.props.dispatch((0, _reactRouterRedux.push)(url));
    }
  }, {
    key: 'locationHandler',
    value: function locationHandler(event) {
      var url = (0, _fetchData.createUrl)(_extends({}, this.props.params, { location: event.target.value }));
      this.props.dispatch((0, _reactRouterRedux.push)(url));
    }
  }, {
    key: 'toggleModal',
    value: function toggleModal(edit, event, deviceId) {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      this.setState({
        isOpen: !this.state.isOpen,
        currentDeviceId: deviceId,
        edit: edit
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var formatMessage = this.props.intl.formatMessage;
      var location = this.props.params.location;
      var dates = this.props.config.dates;
      var _props$report = this.props.report,
          loading = _props$report.loading,
          data = _props$report.data,
          error = _props$report.error;

      var locations = data && data.locations || [];
      var dateMonth = this.props.params.date_month || '';
      var modalContent = void 0;
      if (this.state.edit) {
        modalContent = _react2.default.createElement(DeviceEventForm, { deviceId: this.state.currentDeviceId });
      } else {
        modalContent = _react2.default.createElement(DeviceEventsList, { deviceId: this.state.currentDeviceId });
      }

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          _modal2.default,
          { show: this.state.isOpen, onClose: this.toggleModal.bind(this, false) },
          modalContent
        ),
        _react2.default.createElement(
          'div',
          { className: 'filter__container' },
          _react2.default.createElement(
            'h2',
            { className: 'filter__label' },
            _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.label.select', defaultMessage: 'Select:' })
          ),
          _react2.default.createElement(
            'div',
            { className: 'filter__container__select' },
            _react2.default.createElement(
              'label',
              { htmlFor: 'dateMonth', className: 'filter__container__select__label' },
              _react2.default.createElement('i', { className: 'fa fa-calendar' }),
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.label.month', defaultMessage: 'Month' })
            ),
            _react2.default.createElement(
              'select',
              { disabled: loading, name: 'dateMonth', value: dateMonth, onChange: this.dateHandler, className: 'select--minimised' },
              dates.map(function (date) {
                return _react2.default.createElement(
                  'option',
                  { key: date, value: date },
                  date
                );
              })
            )
          ),
          locations.length > 0 && _react2.default.createElement(
            'div',
            { className: 'filter__container__select' },
            _react2.default.createElement(
              'label',
              { htmlFor: 'location', className: 'filter__container__select__label' },
              _react2.default.createElement('i', { className: 'fa fa-globe' }),
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.label.location', defaultMessage: 'Location' })
            ),
            _react2.default.createElement(
              'select',
              { disabled: loading, name: 'location', value: location || '', onChange: this.locationHandler, className: 'select--minimised' },
              _react2.default.createElement(
                'option',
                { key: 'all', value: '' },
                formatMessage(MESSAGES['location-all'])
              ),
              locations.map(function (loc) {
                return _react2.default.createElement(
                  'option',
                  { key: loc, value: loc },
                  loc
                );
              })
            )
          )
        ),
        error && _react2.default.createElement(
          'div',
          { className: 'widget__container' },
          _react2.default.createElement(
            'div',
            { className: 'widget__header' },
            _react2.default.createElement(
              'h2',
              { className: 'widget__heading text--error' },
              _react2.default.createElement(_reactIntl.FormattedMessage, { id: 'teamsdevices.header.error', defaultMessage: 'Error:' })
            )
          ),
          _react2.default.createElement(
            'div',
            { className: 'widget__content' },
            error
          )
        ),
        loading && _react2.default.createElement(_loadingSpinner2.default, { message: formatMessage(MESSAGES['loading']) }),
        data && _react2.default.createElement(DataTable, { data: data, auditClickHandler: this.toggleModal.bind(this, true), moreClickHandler: this.toggleModal.bind(this, false) })
      );
    }
  }]);

  return TeamsDevices;
}(_react.Component);

var TeamsDevicesWithIntl = (0, _reactIntl.injectIntl)(TeamsDevices);

exports.default = (0, _reactRedux.connect)(function (state, ownProps) {
  return {
    config: state.config,
    report: state.report
  };
})(TeamsDevicesWithIntl);

 ;(function register() { /* react-hot-loader/webpack */ if (false) { if (typeof __REACT_HOT_LOADER__ === 'undefined') { return; } /* eslint-disable camelcase, no-undef */ var webpackExports = typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__ : module.exports; /* eslint-enable camelcase, no-undef */ if (typeof webpackExports === 'function') { __REACT_HOT_LOADER__.register(webpackExports, 'module.exports', "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/apps/TeamsDevices/TeamsDevices.js"); return; } /* eslint-disable no-restricted-syntax */ for (var key in webpackExports) { /* eslint-enable no-restricted-syntax */ if (!Object.prototype.hasOwnProperty.call(webpackExports, key)) { continue; } var namedExport = void 0; try { namedExport = webpackExports[key]; } catch (err) { continue; } __REACT_HOT_LOADER__.register(namedExport, key, "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/apps/TeamsDevices/TeamsDevices.js"); } } })();

/***/ }),

/***/ 1143:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = teamsDevicesApp;

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(18);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactRouter = __webpack_require__(52);

var _reactRouterRedux = __webpack_require__(20);

var _history = __webpack_require__(60);

var _createStore = __webpack_require__(62);

var _createStore2 = _interopRequireDefault(_createStore);

var _load = __webpack_require__(41);

var _App = __webpack_require__(61);

var _App2 = _interopRequireDefault(_App);

var _TeamsDevicesReportContainer = __webpack_require__(650);

var _TeamsDevicesReportContainer2 = _interopRequireDefault(_TeamsDevicesReportContainer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function teamsDevicesApp(appConfig, element, baseUrl) {
  /*
  This creates a default route using the parameters
  in the 'appConfig' object from django showing the last month
  Example appConfig object:
  {
    dates: ['2016-04', '2016-05', '2016-06']
  }
  */
  var defaultRoute = function defaultRoute(config) {
    if (config.dates.length) {
      var latestMonth = config.dates.slice(-1).pop();
      return 'charts/date_month/' + latestMonth;
    } else {
      return 'charts';
    }
  };

  var routes = [_react2.default.createElement(_reactRouter.Route, {
    path: 'charts(/location/:location)(/date_month/:date_month)',
    component: _TeamsDevicesReportContainer2.default }), _react2.default.createElement(_reactRouter.Redirect, { path: '*', to: defaultRoute(appConfig) })];

  var history = (0, _reactRouter.useRouterHistory)(_history.createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  });

  var store = (0, _createStore2.default)({
    config: appConfig,
    report: {}
  }, {
    config: function config() {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return state;
    },
    report: _load.loadReducer
  }, [(0, _reactRouterRedux.routerMiddleware)(history)]);

  history = (0, _reactRouterRedux.syncHistoryWithStore)(history, store);

  _reactDom2.default.render(_react2.default.createElement(_App2.default, { store: store,
    routes: routes,
    history: history }), element);
}

 ;(function register() { /* react-hot-loader/webpack */ if (false) { if (typeof __REACT_HOT_LOADER__ === 'undefined') { return; } /* eslint-disable camelcase, no-undef */ var webpackExports = typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__ : module.exports; /* eslint-enable camelcase, no-undef */ if (typeof webpackExports === 'function') { __REACT_HOT_LOADER__.register(webpackExports, 'module.exports', "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/apps/TeamsDevices/index.js"); return; } /* eslint-disable no-restricted-syntax */ for (var key in webpackExports) { /* eslint-enable no-restricted-syntax */ if (!Object.prototype.hasOwnProperty.call(webpackExports, key)) { continue; } var namedExport = void 0; try { namedExport = webpackExports[key]; } catch (err) { continue; } __REACT_HOT_LOADER__.register(namedExport, key, "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/apps/TeamsDevices/index.js"); } } })();

/***/ }),

/***/ 1144:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Modal = function (_React$Component) {
  _inherits(Modal, _React$Component);

  function Modal() {
    _classCallCheck(this, Modal);

    return _possibleConstructorReturn(this, (Modal.__proto__ || Object.getPrototypeOf(Modal)).apply(this, arguments));
  }

  _createClass(Modal, [{
    key: 'render',
    value: function render() {
      // Render nothing if the "show" prop is false
      if (!this.props.show) {
        return null;
      }

      // The gray background
      var backdropStyle = {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 50
      };

      // The modal "window"
      var modalStyle = {
        backgroundColor: '#fff',
        borderRadius: 5,
        maxWidth: 500,
        minHeight: 300,
        margin: '100px auto',
        padding: 30
      };

      return _react2.default.createElement(
        'div',
        { className: 'backdrop', style: backdropStyle },
        _react2.default.createElement(
          'div',
          { className: 'modal', style: modalStyle },
          this.props.children,
          _react2.default.createElement(
            'div',
            { className: 'footer' },
            _react2.default.createElement(
              'button',
              { onClick: this.props.onClose },
              'Fermer'
            )
          )
        )
      );
    }
  }]);

  return Modal;
}(_react2.default.Component);

Modal.propTypes = {
  onClose: _react.PropTypes.func.isRequired,
  show: _react.PropTypes.bool,
  children: _react.PropTypes.node
};

exports.default = Modal;

 ;(function register() { /* react-hot-loader/webpack */ if (false) { if (typeof __REACT_HOT_LOADER__ === 'undefined') { return; } /* eslint-disable camelcase, no-undef */ var webpackExports = typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__ : module.exports; /* eslint-enable camelcase, no-undef */ if (typeof webpackExports === 'function') { __REACT_HOT_LOADER__.register(webpackExports, 'module.exports', "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/components/modal.js"); return; } /* eslint-disable no-restricted-syntax */ for (var key in webpackExports) { /* eslint-enable no-restricted-syntax */ if (!Object.prototype.hasOwnProperty.call(webpackExports, key)) { continue; } var namedExport = void 0; try { namedExport = webpackExports[key]; } catch (err) { continue; } __REACT_HOT_LOADER__.register(namedExport, key, "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/components/modal.js"); } } })();

/***/ }),

/***/ 650:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TeamsDevicesReportContainer = exports.urls = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactRedux = __webpack_require__(50);

var _TeamsDevices = __webpack_require__(1142);

var _TeamsDevices2 = _interopRequireDefault(_TeamsDevices);

var _utils = __webpack_require__(49);

var _fetchData = __webpack_require__(48);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
 * Handles state
 * and data loading
 * for the monthly report page
 */

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some url, name and mock data.
// The name is used as the key in the results payload.
var urls = exports.urls = [{
  name: 'locations',
  url: '/api/datasets/list_locations/',
  mock: ['Mosango', 'Yasa Bonga']
}, {
  name: 'meta',
  url: '/api/datasets/campaign_meta/',
  mock: { 'enddate': '2016-08-29T10:58:42.807000Z', 'startdate': '2016-08-11T08:18:43.559000Z', 'as_visited': 1, 'villages_visited': 4 }
}, {
  name: 'device_status',
  url: '/api/datasets/device_status/'
}];

var TeamsDevicesReportContainer = exports.TeamsDevicesReportContainer = function (_Component) {
  _inherits(TeamsDevicesReportContainer, _Component);

  function TeamsDevicesReportContainer(props) {
    _classCallCheck(this, TeamsDevicesReportContainer);

    var _this = _possibleConstructorReturn(this, (TeamsDevicesReportContainer.__proto__ || Object.getPrototypeOf(TeamsDevicesReportContainer)).call(this, props));

    _this.currentParams = '';
    return _this;
  }

  _createClass(TeamsDevicesReportContainer, [{
    key: 'loadData',
    value: function loadData(params) {
      var dispatch = this.props.dispatch;

      var oldParams = (0, _utils.clone)(this.currentParams);
      this.currentParams = (0, _utils.clone)(params);
      // force the source to `mobile`
      // (includes `mobile_backup` and `mobile_sync`)
      // (it makes no sense with `historical` or `pv` data)
      var source = 'mobile';

      // to avoid fetching again because params changed include it in both sides, new and old.
      (0, _fetchData.fetchUrls)(urls, _extends({}, params, { source: source }), _extends({}, oldParams, { source: source }), dispatch, _fetchData.checkLocation);
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.loadData(this.props.params);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      this.loadData(newProps.params);
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(_TeamsDevices2.default, { params: this.props.params });
    }
  }]);

  return TeamsDevicesReportContainer;
}(_react.Component);

exports.default = (0, _reactRedux.connect)()(TeamsDevicesReportContainer);

 ;(function register() { /* react-hot-loader/webpack */ if (false) { if (typeof __REACT_HOT_LOADER__ === 'undefined') { return; } /* eslint-disable camelcase, no-undef */ var webpackExports = typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__ : module.exports; /* eslint-enable camelcase, no-undef */ if (typeof webpackExports === 'function') { __REACT_HOT_LOADER__.register(webpackExports, 'module.exports', "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/apps/TeamsDevices/TeamsDevicesReportContainer.js"); return; } /* eslint-disable no-restricted-syntax */ for (var key in webpackExports) { /* eslint-enable no-restricted-syntax */ if (!Object.prototype.hasOwnProperty.call(webpackExports, key)) { continue; } var namedExport = void 0; try { namedExport = webpackExports[key]; } catch (err) { continue; } __REACT_HOT_LOADER__.register(namedExport, key, "/Users/madewulf/Projects/bluesquare/sense-hat/hat/assets/js/apps/TeamsDevices/TeamsDevicesReportContainer.js"); } } })();

/***/ })

},[1143]);