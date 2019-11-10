/**
 * UpdatePolicy
 *
 * Manages when state should be written to influx
 * Data is written under the following conditions:
 *   - Data has changed and last update was more than MIN_UPDATE_INTERVAL and d
 *   - Data has not changed and last update was more than MAX_UPDATE_INTERVAL
 */
class UpdatePolicy {

	constructor(minUpdateInterval, maxUpdateInterval){
		this.minUpdateInterval = minUpdateInterval;
		this.maxUpdateInterval = maxUpdateInterval;
		this.lastState = {};
		this.lastUpdated = {};
	}

	/**
	 * shouldUpdate
	 * Return True if the database should be update
	 * Params:
	 *     @string uid: The unique identifier of this object
 	 *     @object state: The new state to test against prevState
	 *     @func isChangedTest: An optional function to test whether two values have changed
	 */
	shouldUpdate(uid, state, hasChangedTest) {
		let now = new Date().getTime();
		if (!hasChangedTest){
			hasChangedTest = defaultHasChangedTest;
		}
		if (!this.lastUpdated[uid]){
			return true
		}
		if (now > this.lastUpdated[uid] + this.maxUpdateInterval){
			return true
		}
		return (
			now > this.lastUpdated[uid] + this.minUpdateInterval &&
			hasChangedTest(this.lastState[uid], state)
		);
	}

	/**
	 * mightUpdate
	 * Return true if it is almost time to update
	 * Params:
	 * 	 @string uid: The unique identifier of this object
	 *
     */
	mightUpdate(uid){
		let now = new Date().getTime();
		if (this.lastUpdated[uid]){
			return now > this.lastUpdated[uid] + this.minUpdateInterval;
		}
		return true
	}

	/**
     * willUpdate
	 * Call this function right before updating the statebase
	 * Params:
     * 	 @string uid: The unique identifier of this object
     * 	 @object state: The new state to test against prevState
     *
	 */
	willUpdate(uid, state){
		this.lastUpdated[uid] = new Date().getTime();
		this.lastState[uid] = state;
	}
}


/**
 * defaultHasChangedTest
 * Return true if the state has changed
 * Params:
 *     @object lastState: Old system state
 *     @object newState: New system state
 */
function defaultHasChangedTest(lastState, newState){
	let newState = JSON.stringify(newState);
	let lastState = JSON.stringify(lastState);
	return newState !== lastState;
}


module.exports = UpdatePolicy;
