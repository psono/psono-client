# PSONO Client - Password Manager

[![coverage report](https://gitlab.com/psono/psono-client/badges/master/coverage.svg)](https://gitlab.com/psono/psono-client/commits/master)
[![build status](https://img.shields.io/docker/pulls/psono/psono-client.svg)](https://hub.docker.com/r/psono/psono-client/)
[![Discord](https://img.shields.io/badge/Discord-join%20chat-738bd7.svg)](https://discord.gg/VmBMzTSbGV)
[![POEditor](https://img.shields.io/badge/POEditor-Help%20translate-brightgreen.svg)](https://poeditor.com/join/project?hash=Aiea8D0WIr)

# Canonical source

The canonical source of PSONO Client is [hosted on GitLab.com](https://gitlab.com/psono/psono-client).

# Documentation

The documentation for the psono server can be found here:

[Psono Documentation](https://doc.psono.com/)


## Support

[![Browserstack](https://i.imgur.com/hPwc0jS.png)](https://www.browserstack.com/)

Browserstack provides us the ability to test our client on various devices.


## LICENSE

Visit the [License.md](/LICENSE.md) for more details

## Other

- Websocket behind reverse proxy with SSL

    npx webpack serve --client-web-socket-url wss://psonoclient.chickahoona.com/ws --config webpack.environment.behindnginx.js
    
    