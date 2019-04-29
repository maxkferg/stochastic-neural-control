/**
 * UpdatePolicy
 *
 * Manages when data should be written to influx
 * Data is written under the following conditions:
 *   - Data has changed and last update was more than MIN_UPDATE_INTERVAL and d
 *   - Data has not changed and last update was more than MAX_UPDATE_INTERVAL
 */
class UpdatePolicy {

	constructor(minUpdateInterval, maxUpdateInterval){
		this.minUpdateInterval = minUpdateInterval
		this.maxUpdateInterval = maxUpdateInterval
		this.lastUpdated = new Date(0).getTime();
	}

	/**
	 * shouldUpdate
	 * Return True if the database should be update
	 */
	shouldUpdate(data) {
		let now = new Date().getTime();
		if (now > this.lastUpdated + this.maxUpdateInterval){
			return true
		}
		return (
			now > this.lastUpdated + this.minUpdateInterval &&
			this.hasChanged(data)
		);
	}

	/**
	 * mightUpdate
	 * Return true if it is almost time to update
     */
	mightUpdate(data){
		let now = new Date().getTime();
		return now > this.lastUpdated + this.minUpdateInterval;
	}

	/**
     * willUpdate
	 * Call this function right before updating the database
	 */
	willUpdate(data){
		this.lastUpdated = new Date().getTime();
		this.lastData = JSON.stringify(data);
	}

	/**
	 * hasChanged
	 * Return true if the data has changed
	 */
	hasChanged(data){
		let newData = JSON.stringify(data);
		return newData != this.lastData;
	}
}

module.exports = UpdatePolicy;
