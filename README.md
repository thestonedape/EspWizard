<p align="center">
  <img border="0" height="50" src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/download.png">
  <h1 align="center"><b>ESP Wizard</b></h1>
</p>

<p align="center"> 
  <img src="https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB">
  <img src="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black">
</p>

<br>

<p align="center"> 
  <img border="0" height="260" src="https://github.com/thestonedape/EspWizard/blob/main/assets/images/1.jpg">
  <img border="0" height="260" src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/4.jpg">
  <br>
  <img border="0" height="260" src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/2.jpg">
  <img border="0" height="260" src="https://github.com/thestonedape/EspWizard/blob/master/assets/images/3.jpg">
</p>

<br>

Context
The ESP Controller App is a mobile application that allows you to control your ESP devices from your smartphone or tablet. With this app, you can easily connect to multiple ESP devices and send commands to them independently, such as turning on or off an LED, controlling motors, changing the color of an RGB light, or reading sensor data.

<br>

Features

- Intuitive interface for controlling ESP devices
- Connects to multiple ESP devices using Wi-Fi
- Supports multiple TCP clients for simultaneous yet independent device control
- Sends commands to ESP devices via TCP sockets
- Displays sensor data from ESP devices in real-time
- Customizable controller buttons and controls, allowing users to create their own control layouts
- Independent control for each connected ESP device

<br>

Getting Started

- Connect your ESP device to a Wi-Fi network and obtain its IP address.
- Install the ESP Controller App.
- Open the app and tap the "search" button to discover and add a new device.
- Tap "Modes" to select control modes or customize your control interface.
- Open the control interface for a specific device.
- Use the customizable interface to send commands to the ESP device.

Troubleshooting

If you are unable to discover the ESP devices on the network, you may need to check the following:

- Ensure that the ESP devices are connected to the same Wi-Fi network as your mobile device.
- Check that the ESP devices are powered on and connected to the network.
- Verify that the TCP configuration (e.g., IP address and port) used in the app matches the network configuration of your Wi-Fi network.

<br>

This is a new [React Native](https://reactnative.dev) project, bootstrapped using [@react-native-community/cli](https://github.com/react-native-community/cli).

Development Setup

> Note: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

Step 1: Start Metro

First, you will need to run Metro, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

# Using npm
npm start

# OR using Yarn
yarn start

Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

Android

# Using npm
npm run android

# OR using Yarn
yarn android

iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native dependencies).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

bundle install

Then, and every time you update your native dependencies, run:

bundle exec pod install

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

# Using npm
npm run ios

# OR using Yarn
yarn ios

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- Android: Press the R key twice or select "Reload" from the Dev Menu, accessed via Ctrl + M (Windows/Linux) or Cmd ⌘ + M (macOS).
- iOS: Press R in iOS Simulator.
