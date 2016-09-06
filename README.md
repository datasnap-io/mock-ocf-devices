# mock-ocf-devices

Purpose
---
This repo provides examples of OCF devices implemented with node bindings for Iotivity. As they are virtual, they require both an interface to display state in the case of a OCF server as well as a way to manipulate state in the case of a client. This has been provided via a simple web-app that uses websockets to provide realtime responsiveness.

In addition to the virtual device implementations there is a management app for launching, debugging, and destroying the devices processes.

Requirements
---
The scripts in this repo can only be run in an environment that has
- Built Iotivity and iotivity-node
- Linked iotivity-node

Usage
---
To run via the device manager run the following:

```npm start ```

To run the devices individually:

Lightbulb:

Arguments
--port, -p : The port to run the webapp on
--path, -r : The OCF path for the resource
--name, -n : The name of the device
--color, -c : A valid CSS color value for the light

```node ./lightbulb/light_server.js -r /a/light/bulb -n "My Light" -c "rgb(200,100,50)"```

Switch:
Arguments
--port, -p : The port to run the webapp on
--path, -r : The OCF path to the lightbulb

```node ./switch/switch_server.js ```
