const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Expo config plugin to ensure ALL Facebook settings are set in Info.plist
 * The react-native-fbsdk-next plugin may not always set this correctly,
 * so we ensure everything is explicitly set here.
 * 
 * CRITICAL: This plugin MUST run to ensure FacebookClientToken is in the native build.
 */
module.exports = function withIOSFacebookClientToken(config) {
  return withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    // Get values from environment or use fallbacks
    const clientToken = process.env.FACEBOOK_CLIENT_TOKEN || 'b1aa7924c3706f5ade68c995488318ab';
    const appID = process.env.FACEBOOK_APP_ID || '1261010692592854';
    const displayName = 'Aurora';
    
    // Log BEFORE state
    console.log('🔧 [Plugin] BEFORE - FacebookClientToken:', infoPlist.FacebookClientToken || 'NOT SET');
    console.log('🔧 [Plugin] BEFORE - FacebookAppID:', infoPlist.FacebookAppID || 'NOT SET');
    console.log('🔧 [Plugin] BEFORE - FacebookDisplayName:', infoPlist.FacebookDisplayName || 'NOT SET');
    
    // CRITICAL: ALWAYS set FacebookClientToken - this is REQUIRED for events to transmit
    // We ALWAYS set it, even if it exists, to ensure it's correct
    // This plugin runs AFTER react-native-fbsdk-next, so we override any incorrect values
    const previousToken = infoPlist.FacebookClientToken;
    infoPlist.FacebookClientToken = clientToken;
    
    // Also ensure other Facebook settings are set (always override to be sure)
    infoPlist.FacebookAppID = appID;
    infoPlist.FacebookDisplayName = displayName;
    infoPlist.FacebookAutoLogAppEventsEnabled = true;
    
    // Log AFTER state
    console.log('🔧 [Plugin] AFTER - FacebookClientToken:', infoPlist.FacebookClientToken);
    console.log('🔧 [Plugin] AFTER - FacebookAppID:', infoPlist.FacebookAppID);
    console.log('🔧 [Plugin] AFTER - FacebookDisplayName:', infoPlist.FacebookDisplayName);
    
    if (previousToken && previousToken !== clientToken) {
      console.log('⚠️  FacebookClientToken was different, overwriting:', previousToken.substring(0, 10) + '... →', clientToken.substring(0, 10) + '...');
    } else if (previousToken) {
      console.log('✅ FacebookClientToken already set correctly:', clientToken.substring(0, 10) + '...');
    } else {
      console.log('✅ FacebookClientToken set in Info.plist:', clientToken.substring(0, 10) + '...');
    }
    
    // Ensure URL scheme is set (required for Facebook SDK)
    if (!infoPlist.CFBundleURLTypes || !Array.isArray(infoPlist.CFBundleURLTypes)) {
      infoPlist.CFBundleURLTypes = [];
    }
    
    // Check if Facebook URL scheme already exists
    const hasFacebookScheme = infoPlist.CFBundleURLTypes.some(
      (urlType) => 
        urlType.CFBundleURLSchemes && 
        Array.isArray(urlType.CFBundleURLSchemes) &&
        urlType.CFBundleURLSchemes.some((scheme) => scheme.startsWith('fb'))
    );
    
    if (!hasFacebookScheme) {
      infoPlist.CFBundleURLTypes.push({
        CFBundleURLSchemes: [`fb${appID}`],
      });
      console.log('✅ Facebook URL scheme added to Info.plist:', `fb${appID}`);
    }
    
    return config;
  });
};
