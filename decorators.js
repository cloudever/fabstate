var expressionDecorator = function(expression, options) {
    options = options || {};
    return function() {
        return this.form.$eval(expression, angular.merge({ 
            state: this.state
        }, options));
    };
}

var substateDecorator = function(stateInstance) {
    var state = stateInstance.state();
    var first = true;
        
    return function() {
        if (first) {
            stateInstance.init(this.state, this.form);
            first = false;
        }
        return state;
    };
}