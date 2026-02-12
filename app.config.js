const { withAndroidManifest } = require('@expo/config-plugins');

const withShareMenuIntent = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        // Safety check for manifest structure
        if (!androidManifest.manifest || !androidManifest.manifest.application || !androidManifest.manifest.application[0]) {
            return config;
        }

        const mainActivity = androidManifest.manifest.application[0].activity.find(
            (activity) => activity['$']['android:name'] === '.MainActivity'
        );

        if (mainActivity) {
            if (!mainActivity['intent-filter']) {
                mainActivity['intent-filter'] = [];
            }

            // Add SEND intent filter (text + image)
            mainActivity['intent-filter'].push({
                action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
                category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
                data: [
                    { $: { 'android:mimeType': 'text/plain' } },
                    { $: { 'android:mimeType': 'image/*' } }
                ],
            });

            // Add SEND_MULTIPLE intent filter (image only)
            mainActivity['intent-filter'].push({
                action: [{ $: { 'android:name': 'android.intent.action.SEND_MULTIPLE' } }],
                category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
                data: [
                    { $: { 'android:mimeType': 'image/*' } }
                ],
            });
        }

        return config;
    });
};

module.exports = ({ config }) => {
    return withShareMenuIntent(config);
};
