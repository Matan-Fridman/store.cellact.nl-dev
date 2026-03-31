/**
 * Entry point loader — required by Gen2 Cloud Functions.
 *
 * Node loads this file first (package "main"). Requiring the split entry
 * files here ensures functions-framework can find the `chainServer` and
 * `chainActivate` handlers when deploying with --entry-point=chainServer
 * or --entry-point=chainActivate from this directory.
 */
require('./chainServer');
require('./chainActivate');
