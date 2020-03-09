// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {applyMiddleware, createStore, compose} from "redux";

//import window from 'global/window';
import {taskMiddleware} from "react-palm/tasks";
import {routerMiddleware} from "react-router-redux";
import createHistory from "history/createBrowserHistory";
import {rootReducer} from "twxplore/gui/tree/reducers/root/rootReducer";
import {initialRootState} from "twxplore/gui/tree/states/root/initialRootState";
//import {ADD_MAP_FEATURES} from "twxplore/gui/tree/actions/map/AddMapFeaturesAction";

const history = createHistory();

export const middlewares = [taskMiddleware, routerMiddleware(history)];

//export const enhancers = [applyMiddleware(...middlewares)];

//const initialState = {};

// add redux devtools
/*
 const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
    // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    actionsBlacklist: ['@@kepler.gl/LAYER_HOVER','@@kepler.gl/LAYER_CLICK' ],
    actionsWhiteList: [ADD_MAP_FEATURES]
  }) || compose;
*/
export default createStore<any, any, any, any>(
  rootReducer,
  initialRootState,
  compose(applyMiddleware(...middlewares))
);
