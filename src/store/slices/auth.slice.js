// store/slices/auth.slice.js
import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
    token: Cookies.get('token') || null,
    deviceToken: Cookies.get('device_token') || null,
    userId: Cookies.get('user_id') || null,
    role: Cookies.get('role') || null,
    isAuthenticated: !!Cookies.get('token'),
    isDeviceAuthenticated: !!Cookies.get('device_token'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setDeviceAuth(state, action) {
            const { deviceToken, deviceName } = action.payload;
            state.deviceToken = deviceToken;
            state.isDeviceAuthenticated = !!deviceToken;

            Cookies.set('device_token', deviceToken);
            if (deviceName) Cookies.set('device_name', deviceName);
        },
        setAuth(state, action) {
            const { token, userId, role } = action.payload;
            state.token = token;
            state.userId = userId;
            state.role = role;
            state.isAuthenticated = !!token;

            Cookies.set('token', token);
            Cookies.set('user_id', userId);
            if (role) Cookies.set('role', role);
        },
        logout(state) {
            state.token = null;
            state.userId = null;
            state.role = null;
            state.isAuthenticated = false;

            Cookies.remove('token');
            Cookies.remove('user_id');
            Cookies.remove('role');
        },
    },
});

export const { setDeviceAuth, setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
