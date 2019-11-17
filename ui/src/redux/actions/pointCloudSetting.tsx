export const SET_POINT_CLOUD_SETTING_STRATEGY = 'SET_POINT_CLOUD_SETTING_STRATEGY';
export const SET_POINT_CLOUD_LIMIT = 'SET_POINT_CLOUD_LIMIT';

export const setPointCloudStrategy = (strategy) => ({
    type: 'SET_POINT_CLOUD_SETTING_STRATEGY',
    payload: {
        strategy
    },
});

export const setPointCloudLimit = (limit) => ({
    type: SET_POINT_CLOUD_LIMIT,
    payload: {
        limit
    }
});