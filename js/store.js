/*
  Created by Uncle Charlie, 2017/11/22
 */

import { applyMiddleware, createStore, compose } from 'redux';
import createSagaMiddleware, { END } from 'redux-saga';
import reducers from './reducers';
import queryMiddleware from './middlewares/query';
import Reactotron from './reactotron-config/ReactotronConfig';

/**
 * onComplete makes no sense now.
 * Maybe use cache some day, then `onComplete` callback will be OK.
 */
export default (onComplete) => {
  if (onComplete) {
    onComplete();
  }
  const isProduction = !__DEV__;
  if (isProduction) {
    const sagaMiddleware = createSagaMiddleware();
    const middleWares = [sagaMiddleware, queryMiddleware];
    const store = createStore(reducers, applyMiddleware(...middleWares));

    store.runSaga = sagaMiddleware.run;
    store.close = () => store.dispatch(END);

    return store;
  } else {
    const sagaMonitor = Reactotron.createSagaMonitor();
    const sagaMiddleware = createSagaMiddleware({ sagaMonitor });
    const middleWares = [sagaMiddleware, queryMiddleware];
    const enhancer = applyMiddleware(...middleWares);
    const store = createStore(reducers, compose(enhancer, Reactotron.createEnhancer()));

    store.runSaga = sagaMiddleware.run;
    store.close = () => store.dispatch(END);

    return store;
  }
};
