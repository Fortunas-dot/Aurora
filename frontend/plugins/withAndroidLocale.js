const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

module.exports = function withAndroidLocale(config) {
  // First, modify AndroidManifest to set default locale
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Add locale configuration to the application
    if (androidManifest.application && androidManifest.application.length > 0) {
      const application = androidManifest.application[0];
      if (!application.$) {
        application.$ = {};
      }
      
      // Add locale configuration to force English
      if (!androidManifest.$) {
        androidManifest.$ = {};
      }
      // Note: This doesn't directly force locale, but ensures manifest is ready
    }
    
    return config;
  });

  // Then, modify MainActivity to force English locale
  config = withMainActivity(config, (config) => {
    const mainActivity = config.modResults.contents;
    
    // Add locale forcing code to MainActivity
    // This will force the app to use English locale for native components
    if (mainActivity.includes('super.onCreate(savedInstanceState)')) {
      // Add locale setting after super.onCreate
      const localeCode = `
    // Force English locale for native components (ImagePicker, etc.)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      Locale locale = new Locale("en");
      Locale.setDefault(locale);
      Configuration config = getResources().getConfiguration();
      config.setLocale(locale);
      getResources().updateConfiguration(config, getResources().getDisplayMetrics());
    }
`;
      
      config.modResults.contents = mainActivity.replace(
        /super\.onCreate\(savedInstanceState\);/,
        `super.onCreate(savedInstanceState);${localeCode}`
      );
      
      // Add imports if not present
      if (!mainActivity.includes('import java.util.Locale')) {
        const importCode = `import java.util.Locale;
import android.content.res.Configuration;
import android.os.Build;
`;
        // Add imports after package declaration
        const packageMatch = mainActivity.match(/package\s+[\w.]+;/);
        if (packageMatch) {
          const insertIndex = packageMatch.index + packageMatch[0].length;
          config.modResults.contents = 
            config.modResults.contents.slice(0, insertIndex) +
            '\n' + importCode +
            config.modResults.contents.slice(insertIndex);
        }
      }
    }
    
    return config;
  });

  return config;
};
