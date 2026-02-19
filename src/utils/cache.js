import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const tokenCache = {
    async getToken(key) {
        try {
            return SecureStore.getItemAsync(key);
        } catch (err) {
            return null;
        }
    },
    async saveToken(key, value) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};

// Handle logout properly in Clerk
export const createTokenCache = () => {
    return tokenCache;
};

export default tokenCache;
