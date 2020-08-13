/* eslint-disable import/no-extraneous-dependencies */
import _ from 'lodash';

const isProduction = !__DEV__;
const initialGlobal = {};

function isChromeDebugging() {
  const userAgent = _.get(window, 'navigator.userAgent');
  return _.isString(userAgent) && userAgent.includes('Chrome');
}

if (!isChromeDebugging()) {
  Object.assign(initialGlobal, global);
}

if (isProduction) {
  const emptyLambda = () => {};
  const fakeTron = {};
  fakeTron.errors = emptyLambda;
  fakeTron.editor = emptyLambda;
  fakeTron.overlay = emptyLambda;
  fakeTron.asyncStorage = emptyLambda;
  fakeTron.networking = emptyLambda;
  fakeTron.storybook = emptyLambda;
  fakeTron.devTools = emptyLambda;
  fakeTron.useReactNative = emptyLambda;
  fakeTron.overlay = emptyLambda;
  fakeTron.storybookSwitcher = emptyLambda;
  fakeTron.asyncStorageHandler = emptyLambda;
  fakeTron.setAsyncStorageHandler = emptyLambda;
  fakeTron.startTimer = emptyLambda;
  fakeTron.close = emptyLambda;
  fakeTron.send = emptyLambda;
  fakeTron.display = emptyLambda;
  fakeTron.reportError = emptyLambda;
  fakeTron.onCustomCommand = emptyLambda;
  fakeTron.apiResponse = emptyLambda;
  fakeTron.benchmark = emptyLambda;
  fakeTron.clear = emptyLambda;
  fakeTron.image = emptyLambda;
  fakeTron.log = emptyLambda;
  fakeTron.logImportant = emptyLambda;
  fakeTron.debug = emptyLambda;
  fakeTron.warn = emptyLambda;
  fakeTron.error = emptyLambda;
  fakeTron.stateActionComplete = emptyLambda;
  fakeTron.stateValuesResponse = emptyLambda;
  fakeTron.stateKeysResponse = emptyLambda;
  fakeTron.stateValuesChange = emptyLambda;
  fakeTron.stateBackupResponse = emptyLambda;
  fakeTron.repl = emptyLambda;
  global.tron = fakeTron;

  console.basename = emptyLambda;
  console.logConstructorHash = emptyLambda;
  console.logRenderHash = emptyLambda;
  console.logDidUpdateHash = emptyLambda;
  console.log('will exports fakeTron', fakeTron);
  module.exports = fakeTron;
} else {
  const Reactotron = require('reactotron-react-native').default;
  const reactotronRedux = require('reactotron-redux').reactotronRedux;
  const sagaPlugin = require('reactotron-redux-saga');
  const AsyncStorage = require('react-native').AsyncStorage;
  const assert = require('../utils/assert0').default;

  const hostIP = '127.0.0.1';

  console.log('Reactotron', Reactotron);
  console.log('Reactotron.setAsyncStorageHandler', Reactotron.setAsyncStorageHandler);

  Reactotron.setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-community/async-storage` depending on where you get it from
    .configure({
      name: 'mobile-crm',
      host: hostIP,
      onConnect() {
        Reactotron.log('onConnect', Reactotron);
      },
    })
    .useReactNative({
      asyncStorage: true, // there are more options to the async storage.
      networking: {
        // optionally, you can turn it off with false.
        ignoreUrls: /symbolicate/,
      },
      editor: false, // there are more options to editor
      errors: { veto: (stackFrame) => false }, // or turn it off with false
      overlay: true, // just turning off overlay
    })
    .use(
      reactotronRedux({
        // except: ['EFFECT_TRIGGERED', 'EFFECT_RESOLVED', 'EFFECT_REJECTED'],
        // isActionImportant: action => action.type.includes('EVENT')
      }),
    )
    .use(sagaPlugin())
    .connect()
    .clear();

  const showRNFSDirs = () => {
    const RNFS = require('react-native-fs');
    Reactotron.logImportant('RNFS:', RNFS);
  };
  Reactotron.onCustomCommand({
    command: 'show RNFS Dirs',
    handler: () => {
      showRNFSDirs();
    },
  });
  Reactotron.onCustomCommand({
    command: 'store.getState_tron',
    description: '将store.getState打印到reactotron',
    handler: (params) => {
      Reactotron.logImportant('store.getState_tron:', global.store.getState());
    },
  });
  Reactotron.onCustomCommand({
    command: 'fc_getCurrentUserInfo',
    description: 'fc_getCurrentUserInfo',
    handler: () => {
      Reactotron.logImportant('fc_getCurrentUserInfo', fc_getCurrentUserInfo());
    },
  });

  Reactotron.onCustomCommand({
    command: 'store.getState_console_oneline',
    description: '将store.getState打印到console，单行json格式',
    handler: (params) => {
      const state = global.store.getState();
      const jsonstr = JSON.stringify(state);
      console.log('+++will print store.getState+++');
      console.log(jsonstr);
      console.log('===end print store.getState===');
    },
  });
  const dumpGlobal = (onlyChanged) => {
    assert(_.isBoolean(onlyChanged));

    const globalLite = {};
    Object.assign(globalLite, global);
    //打印这三个会报错，所以需要delete掉
    delete globalLite.GLOBAL;
    delete globalLite.window;
    delete globalLite.ReactNative;

    //如果true，则仅打印user change的，将初始就有的key删掉
    if (onlyChanged) {
      _.keys(initialGlobal).forEach((initialKey) => {
        if (_.get(globalLite, initialKey)) {
          delete globalLite[initialKey];
        }
      });
    }

    const globalLite_funcs = {};
    const globalLite_values = {};

    _.forEach(globalLite, (value, key, collection) => {
      if (_.isFunction(value) || typeof value === 'function') {
        globalLite_funcs[key] = value;
      } else {
        //value可能会循环引用，需要fix
        try {
          const value_str = JSON.stringify(value);
          const value_parsed = JSON.parse(value_str);
          globalLite_values[key] = value;
        } catch (e) {
          globalLite_values[key] = '循环引用了，无法打印';
        }
      }
    });

    Reactotron.logImportant(`dump globalLite_funcs onlyChanged=${onlyChanged}:`, globalLite_funcs);
    Reactotron.logImportant(
      `dump globalLite_values onlyChanged=${onlyChanged}:`,
      globalLite_values,
    );
  };
  if (!isChromeDebugging()) {
    Reactotron.onCustomCommand({
      command: 'dump global',
      description: '将global打印到reactotron',
      handler: ({ onlyChanged }) => {
        onlyChanged = onlyChanged === 'true';
        dumpGlobal(onlyChanged);
      },
      args: [
        {
          name: 'onlyChanged',
          type: 'string',
        },
      ],
    });
  }

  global.tron = Reactotron;

  console.basename = (fullFilepath) => {
    if (typeof fullFilepath === 'string') {
      const pos = fullFilepath.lastIndexOf('/');
      return fullFilepath.substr(pos + 1);
    } else {
      return fullFilepath + '';
    }
  };

  console.logConstructorHash = (filename, componentThis) => {
    global.tron.logImportant(`${console.basename(filename)} constructor`, componentThis.props);
  };

  const path = 'ReactotronConfig_logRenderHash_count'; //每次render都增加1
  console.logRenderHash = (filename, componentThis) => {
    const count = _.get(componentThis, path, 0);
    global.tron.logImportant(
      `${console.basename(filename)} render${count}`,
      componentThis.props,
      componentThis.state,
    );
    _.set(componentThis, path, count + 1);
  };

  console.logDidUpdateHash = (filename, componentThis, prevProps, prevState) => {
    const count = _.get(componentThis, path, 0);

    const propsEqual = _.isEqual(prevProps, componentThis.props);
    const stateEqual = _.isEqual(prevState, componentThis.state);
    const propsChangedStr = propsEqual ? '' : 'props被修改';
    const stateChangedStr = stateEqual ? '' : 'state被修改';

    global.tron.logImportant(
      `${console.basename(
        filename,
      )} componentDidUpdate${count} ${propsChangedStr} ${stateChangedStr} `,
      componentThis.props,
      componentThis.state,
    );
  };
  console.log('will exports real tron', Reactotron);
  module.exports = Reactotron;
}
