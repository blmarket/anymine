Anymine
-------

Run your javascript test in any environment

## Abstract

Anymine is a test runner for javascript. Its goal is to make it run in any environment, such as:

* Browser extension background page
* VM in node.js, with minimal context injection

## Objective

* Minimal dependency - no assumption to have `window` or `document` object.
* Test API to be injectable:  
  Going to use Jasmine for initial development, but essentially what we surface is a single interface to run tests.

## Background

Most of the existing test frameworks are designed for specific environments, mostly node.js or web browser. But we got more runtimes which might have different contexts, and it's getting more difficult to run tests in those environments.

I'm developing a chrome extension, and I want to use `chrome.storage` APIs. What I can do to develop is:

* Develop without testing
* Manual testing which is not reliable, and take a lot of time
* Write a test in node.js, with mocking `chrome.storage` APIs, and prey the API works in the actual environment as well


