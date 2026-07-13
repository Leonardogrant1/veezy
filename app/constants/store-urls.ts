import { Platform } from 'react-native';

const IOS_STORE_URL = 'https://apps.apple.com/app/id6761725569';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=studio.northbyte.veezy';

export const STORE_URL = Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
