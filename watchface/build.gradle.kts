plugins {
    alias(libs.plugins.android.application)
}

android {
    // Watch Face Format bundles carry no code at all.
    enableKotlin = false
    namespace = "com.tactical.watchface"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.tactical.watchface"
        // WFF v4 (ambient transitions, colour transforms) requires Wear OS 6,
        // which is API 36. Drop both to 35 and set the manifest's format
        // version property to 3 to also reach Wear OS 5.1 devices; the only
        // v4 feature this face uses is the ambient transition.
        minSdk = 36
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        debug {
            isMinifyEnabled = true
        }
        release {
            isMinifyEnabled = true
            // Resource shrinking must stay off: it cannot see that
            // res/raw/watchface.xml references the drawables and fonts.
            isShrinkResources = false

            // TODO: replace with your own upload key before publishing.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}
