<div align = "center">
<img border="0" height='50' src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/download.png">
<h1 align ="center"><b>ESP Wizard </b></h1>

 </div>

<div align = "center"> 

<img src ="https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB"> </img>
<img src ="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black"> </img>

</div>

<br>
<div  align="center"> 
   
  <img border="0" height='260' src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/1.jpg">
  <img border="0" height='260' src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/4.jpg">
  <br>
  <img border="0" height='260' src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/2.jpg">
  <img border="0" height='260' src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/3.jpg">
       
  </div>
<br>

# Context
The ESP Controller App is a mobile application that allows you to control your ESP devices from your smartphone or tablet. With this app, you can easily connect to your ESP devices and send commands to them, such as turning on or off an LED, Motors, changing the color of an RGB light, or reading sensor data.
<br>



## Features

- Easy to use interface for controlling ESP devices
- Connects to ESP devices using Wi-Fi
- Supprts multiple ESP devices
- Sends commands to ESP devices via UDP
- Displays sensor data from ESP devices in real-time
- Customizable commands support for new devices
<br>
  
 ## Getting Started

- Connect your ESP device to a Wi-Fi network and obtain its IP address.
- Install the ESP Controller App.
- Open the app and tap the "search" button to add a new device.
- Tap "Modes" to select the modes.
- Open the control interface for the device.
- Use the interface to send commands to the ESP device.
 
 
 ## Troubleshooting

If you are unable to discover the ESP devices on the network, you may need to check the following:

- Ensure that the ESP devices are connected to the same Wi-Fi network as your mobile device.
- Check that the ESP devices are powered on and connected to the network.
- Verify that the broadcast IP address used in the app matches the network configuration of your Wi-Fi network.
 <br>



This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.
