// import {File, getA } from 'expo-file-system'

// const APP_GROUP = 'group.com.yourapp'

// const SHARED_ASSETS = [
//   'spartan-helmet.png',
//   'quote-bg.png',
// ]

// export async function setupSharedAssets() {
//   const appGroupPath = await FileSystem.getAppGroupDirectoryAsync(APP_GROUP)

//   for (const filename of SHARED_ASSETS) {
//     const dest = `${appGroupPath}${filename}`
//     const exists = new File(dest).info()
    
//     if (!exists.exists) {
//       const source = `${FileSystem.bundleDirectory}assets/shared/${filename}`
//       await FileSystem.copyAsync({ from: source, to: dest })
//     }
//   }
// }