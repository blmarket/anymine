Anymine
-------

Run your javascript unit tests even in unusual places.

## Problem

Some javascript environments has its own runtime which is not generally
available in other environments. 

## Our solution

Anymine tries to solve this problem by defining a minimal interface to execute
arbitrary javascript code, and inject unit test environment using the interface,
and implemented the so-called interface in javascript vm environment and Chrome
background script via Chrome devtools protocol(CDP). The tool can be useful when
running unit tests in Chrome extension, which allows access to all chrome
specific extension API.

## Usage

See main.ts in each packages for general usage. FIXME: Add more helpful usage
guide.

## Prior work

There were some prior works to make testing available in Chrome/Chromium
environments.

Some of the attempts tried to use E2E browser testing tools to open browser
extension popup pages, but there was a limitation to have access to background
scripts. Reference:
https://dev.to/scahhht/simple-steps-for-testing-a-chrome-extension-in-puppeteer-2pm3

Some other attempts tries to stub chrome extension runtime, but who would like
to mock all the chrome extension behaviors? Reference:
https://github.com/acvetkov/sinon-chrome
