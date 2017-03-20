/**
 * Creates a new state entity
 * 
 * Example: 
 * var state = createState({
 *     name: 'superstate',
 *     state: {
 *         enabled: true
 *     },
 *     dispatcher: function(state) {
 *         return {
 *             toggle: function() {
 *                 state.enabled = !state.enabled;
 *             }
 *         }
 *     }
 * })
 * 
 * Actions might be dispatched from view as a `superview.dispatch('actionName', someValue)`
 */


 /**
 * @param {object} options
 * @param {string} options.name - A name for a state that gonna be applied to scope.
 * @param {object} options.state - Initial state object. May contains a computed props as a functions.
 * @param {function} options.dispatcher - Pure function that should returns an object of functions those gonna be called by dispatcher.
 * 
 * @param {object} options.connect - Object of params mapping options.
 * @param {function} options.connect.input - Pure function that should returns a computed object over input parameters. One will be joined to state.
 * @param {function} options.connect.output - Pure function that should returns a computed object over state. One will be joined to output parameters.
 * 
 * @param {array} options.mixins - Array of some dispatcher-like functions. Use mixins if you wanna share some business logic.
 * 
 * @returns {object} - Created state
 */

function createState(options) {

    var use = false;
    
    //  A name of the state for the scope
    var name = options.name || 'state';
    
    // Compute state if function has passed
    if (typeof options.state === 'function') {
        var currentState = options.state.call(options.state);
    } else {
        var currentState = onlyObject(options.state);
    }
  
    var currentDispatcher = options.dispatcher || angular.noop;
    var currentDispatcherActions = {};

    var currentMixins = options.mixins || [];
    var currentMixinsActions = [];

    var connect = angular.extend({
        input: angular.noop,
        output: angular.noop
    }, options.connect);

    // This is a Global context and entry point for everything in the state
    var ctx = Object.create(Object.prototype);
    Object.defineProperty(ctx, 'state', {
        value: currentState
    });

    // Dispatch function declaration
    var dispatch = function (action, value) {
        
        // First call a mixin actions
        for (var i = 0; i < currentMixinsActions.length; i++) {
            if (typeof currentMixinsActions[i][action] === 'function') {
                currentMixinsActions[i][action].call(ctx, value);
            }
        }
        
        // Then dispatch an action
        if (typeof currentDispatcherActions[action] === 'function') {
            var res = currentDispatcherActions[action].call(ctx, value);
        }

        if (window && window.__DEV__) {
            console && console.log(name, action, currentState);
        }

        return res;
    };

    // Define as protected property
    Object.defineProperty(currentState, 'dispatch', {
        value: dispatch
    });

    function computeProps (object, define) {
        define = define || true;
        
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                if (typeof object[key] === 'function') {
                    var fn = object[key];
                    if (define) {
                        Object.defineProperty(object, key, {
                            get: fn.bind(ctx),
                            enumerable: true
                        });
                    } else {
                        object[key] = fn.call(ctx);
                    }
                } else if (Object.prototype.toString.call(object[key]) === '[object Object]') {
                    computeProps(object[key], define);
                }   
            }
        }
        
        return object;
    };

    function onlyObject (object) {
        return (Object.prototype.toString.call(object) === '[object Object]') ? object : {};
    }

    // Public API methods
    var exports = {

        // Primary
        state: function (state) {
            if (typeof state !== 'undefined') {
                currentState = onlyObject(state);
                return exports;
            }

            return currentState;
        },

        name: function (value) {
            if (typeof value === 'string') {
                name = value;
                return exports;
            }

            return name;
        },

        dispatcher: function (fn) {
            if (typeof fn === 'function') {
                currentDispatcher = fn;
            }

            return exports;
        },
        
        connect: function (options) {
            options = options || {};
            if (typeof options.input === 'function') {
                connect.input = options.input;
            }

            if (typeof options.output === 'function') {
                connect.output = options.output;
            }

            return exports;
        },
        
        mixin: function (fn) {
            if (typeof fn === 'function') {
                currentMixins.push(fn);
            }

            return exports;
        },

        // Secondary
        init: function (context, scope, params) {

            // Define name property before any computations of props
            Object.defineProperty(ctx, 'name', {
                value: name
            });

            Object.defineProperty(ctx, 'form', {
                value: scope
            });
            
            // Init dispatcher actions
            var dispatcherActions = onlyObject(currentDispatcher.call(ctx, currentState, context));
            angular.merge(currentDispatcherActions, dispatcherActions);
            
            // Init mixin actions
            for (var i = 0; i < currentMixins.length; i++) {
                if (typeof currentMixins[i] === 'function') {
                    var mixinActions = onlyObject(currentMixins[i].call(ctx, currentState, context));
                    currentMixinsActions.push(mixinActions);
                }
            }

            // Init params mapping
            var map = computeProps(connect.input.call(ctx, onlyObject(params), currentState), false);
            angular.merge(currentState, map);
            
            // Resolve all computed props
            computeProps(currentState);

            scope.$on('show', function(value) {
                return currentState.dispatch('onshow', value);
            });

            scope.$on('send', function(value) {
                return currentState.dispatch('onsend', value);
            });
            
            use = true;
            
            return exports;
        },
        
        mapOutputParams: function (context) {
            var mapOutput = connect.output.call(ctx, currentState, context);
            return computeProps(mapOutput, false);
        },

        use: function (flag) {
            if (flag) {
                use = flag;
                return exports;
            }
            
            return use;
        }

    };

    // Exports all
    return exports;
}

/**
 * Loader is uses to initializing state and applying one to form scope
 * 
 * Example:
 * var loader = createLoader(form);
 * loader.use(state);
 * 
 * @param {scope} form
 * @param {object} options - extra options for the loader. Usually should contain a names of form props
 * 
 * @returns {object}
 */
function createLoader(scope, options) {

    var states = {};
    
    options = angular.extend({
        inputProp  : 'inputParams',
        outputProp : 'outputParams',
        showProp   : 'onShow',
        sendProp   : 'send'
    }, options);

    var context = Object.create(Object.prototype);
    scope.ctx = context;
    
    Object.defineProperty(scope, options.sendProp, {
        value: function (tag, save) {
            if (typeof tag !== 'string') {
                save = tag;
                tag = undefined;
            }
            save = save || true;
            
            scope.$emit('send', save);
            
            if (save === false) {
                return scope.sendForm(tag);
            }
            
            for (var key in states) {
                if (states.hasOwnProperty(key)) {
                    var map = states[key].mapOutputParams(context);
                    angular.merge(scope[options.outputProp], map);
                }
            }

            scope.sendForm(tag);
        }
    });
    
    Object.defineProperty(scope, options.showProp, {
        value: function() {
            scope.$emit('show');
        }
    });
    
    var exports = {
        use: function (stateInstance, map) {
            map = map || true;
            var name = stateInstance.name();
            
            // Prevent override of third object
            if (typeof scope[name] !== 'undefined') {
                if (scope[name] !== state) {
                    throw new Error('fabState: ' + name + ' is already defined at form scope');
                }
            }
            
            // Map params to state
            if (map === true) {
                var inputParams = scope[options.inputProp];
                stateInstance.init(context, scope, inputParams);
            }
            
            states[name] = stateInstance;
            
            Object.defineProperty(scope, name, {
                value: stateInstance.state()
            });
        },
        stop: function (name) {
            if (states[name] !== 'undefined') {
                delete scope[name];
                delete states[name];
                states[name].use(false);
            }
        }
    };

    return exports;
}
