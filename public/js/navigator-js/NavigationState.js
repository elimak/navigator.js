this.navigatorjs = this.navigatorjs || {};

(function() {
	var NavigationState = function(pathStringOrArray) {
		this._path = '';

		if (pathStringOrArray instanceof Array) {
			this.setSegments(pathStringOrArray);
		} else {
			this.setPath(pathStringOrArray);
		}
	};

	NavigationState.make = function(stateOrPath) {
		return stateOrPath instanceof navigatorjs.NavigationState ? stateOrPath : new navigatorjs.NavigationState(stateOrPath);
	};

	NavigationState.prototype = {
		setPath: function(path) {
			this._path = '/' + path.toLowerCase() + '/';
			this._path = this._path.replace(new RegExp("[^-_/A-Za-z0-9* ]", "g"), "");
			this._path = this._path.replace(new RegExp("\/+", "g"), "/");
			this._path = this._path.replace(/\s+/g, "-");

			return this;
		},

		getPath: function() {
			return this._path;
		},

		getPathRegex: function() {
			var segments = this.getSegments(),
				regexPath = "\/",
				segment,
				i, length = segments.length;

			for(i=0; i<length; i++) {
				segment = segments[i];

				if(segment == "**") {
					regexPath = regexPath + "(.*?)";
				} else if(segment == "*") {
					regexPath = regexPath + "([^/]*)\/";
				} else {
					regexPath = regexPath + "("+segment+"|\\*|\\**)\/";
				}
			}

			return new RegExp(regexPath);
		},

		setSegments: function(segments) {
			this.setPath(segments.join("/"));
		},

		getSegments: function() {
			var segments = this._path.split("/");

			segments.pop();
			segments.shift();

			return segments;
		},

		getSegment: function(index) {
			return this.getSegments()[index];
		},

		getFirstSegment: function() {
			return this.getSegment(0);
		},

		getLastSegment: function() {
			var segments = this.getSegments();
			return this.getSegment(segments.length - 1);
		},

		contains: function(foreignStateOrPathOrArray) {
			if(foreignStateOrPathOrArray instanceof Array) {
				return this._containsStateInArray(foreignStateOrPathOrArray);
			}

			var foreignStateOrPath = foreignStateOrPathOrArray, //if we get this far, it is a state or path
				foreignState = NavigationState.make(foreignStateOrPath),
				foreignSegments = foreignState.getSegments(),
				nativeSegments = this.getSegments(),
				foreignMatch = this.getPath().match(foreignState.getPathRegex()),
				nativeMatch = foreignState.getPath().match(this.getPathRegex()),
				isForeignMatch = foreignMatch && foreignMatch.index == 0 ? true : false,
				isNativeMatch = nativeMatch && nativeMatch.index == 0 ? true : false,
				tooManyForeignSegments = foreignSegments.length > nativeSegments.length;

			return (isForeignMatch || isNativeMatch) && !tooManyForeignSegments;
		},

		_containsStateInArray: function(foreignStatesOrPaths) {
			var i, length = foreignStatesOrPaths.length,
				foreignStateOrPath;

			for(i=0; i<length; i++){
				foreignStateOrPath = foreignStatesOrPaths[i];
				if(this.contains(foreignStateOrPath)) {
					return true;
				}
			}

			return false;
		},

		equals: function(stateOrPathOrArray) {
			if(stateOrPathOrArray instanceof Array) {
				return this._equalsStateInArray(stateOrPathOrArray);
			}

			var stateOrPath = stateOrPathOrArray, //if we get this far, it is a state or path
				state = NavigationState.make(stateOrPath),
				subtractedState = this.subtract(state);

			if (subtractedState === null) {
				return false;
			}

			return subtractedState.getSegments().length === 0;
		},

		_equalsStateInArray: function(statesOrPaths) {
			var i, length = statesOrPaths.length,
				stateOrPath;

			for(i=0; i<length; i++){
				stateOrPath = statesOrPaths[i];
				if(this.equals(stateOrPath)) {
					return true;
				}
			}

			return false;
		},

		subtract: function(operandStateOrPath) {
			var operand = NavigationState.make(operandStateOrPath),
				subtractedSegments;

			if (!this.contains(operand)) {
				return null;
			}

			subtractedSegments = this.getSegments();
			subtractedSegments.splice(0, operand.getSegments().length);

			return new navigatorjs.NavigationState(subtractedSegments);
		},

		append: function(stringOrState) {
			var path = stringOrState;
			if (stringOrState instanceof NavigationState) {
				path = stringOrState.getPath();
			}
			return this.setPath(this._path + path);
		},

		prepend: function(stringOrState) {
			var path = stringOrState;
			if (stringOrState instanceof NavigationState) {
				path = stringOrState.getPath();
			}
			return this.setPath(path + this._path);
		},

		hasWildcard: function() {
			return this.getPath().indexOf("/*/") != -1;
		},

		mask: function(sourceStateOrPath) {
			var sourceState = NavigationState.make(sourceStateOrPath),
				unmaskedSegments = this.getSegments(),
				sourceSegments = sourceState.getSegments(),
				length = Math.min(unmaskedSegments.length, sourceSegments.length),
				i;

			for (i = 0; i < length; i++) {
				if (unmaskedSegments[i] === "*") {
					unmaskedSegments[i] = sourceSegments[i];
				}
			}

			return new navigatorjs.NavigationState(unmaskedSegments);
		},

		clone: function() {
			return new navigatorjs.NavigationState(this._path);
		}
	};

	navigatorjs.NavigationState = NavigationState;
}());