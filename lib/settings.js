const jsonfile = require('jsonfile');

const JSON = 'json';

const READ = 'read';
const WRITE = 'write';

const JSON_HANDLERS = new Map();
JSON_HANDLERS.set(READ, json_handler_read);
JSON_HANDLERS.set(WRITE, json_handler_write);

const SETTING_HANDLERS = new Map();
SETTING_HANDLERS.set(JSON, JSON_HANDLERS);

/**
 * Reads the settings from a JSON file
 * @param {Object} config The configuration
 * @param {Function} resolve The resolve function
 * @param {Function} reject The reject function
 * @returns {undefined}
 */
function json_handler_read(config, resolve, reject) {
    jsonfile.readFile(config.storage.json.filename, function (error, data) {
        if (error) {
            reject(error);
        } else {
            resolve(data);
        }
    });
}

/**
 * Writes the settings to a JSON file
 * @param {Object} config The configuration
 * @param {Object} data The data
 * @param {Function} resolve The resolve function
 * @param {Function} reject The reject function
 * @returns {undefined}
 */
function json_handler_write(config, data, resolve, reject) {
    jsonfile.writeFile(config.storage.json.filename, data, function (error) {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
}

/**
 * Loads the settings
 * @param {Object} config The configuration
 * @returns {Promise} A promise for the settings
 */
function loadSettings(config) {
    return new Promise(function (resolve, reject) {
        if (!config) {
            reject(new Error('Invalid config'));
        } else if (!SETTING_HANDLERS.has(config?.storage?.type)) {
            reject(new Error(`Unknown setting handler ${config?.storage?.type}`));
        } else {
            SETTING_HANDLERS.get(config.storage.type).get(READ)(config, resolve, reject);
        }
    });
}

/**
 * Wirtes the settings to disk
 * @param {Object} config The configuration
 * @param {Object} settings The settings to write
 * @returns {Promise} A promise for when the settings have been written
 */
function saveSettings(config, settings) {
    return new Promise(function (resolve, reject) {
        if (!config) {
            reject(new Error('Invalid config'));
        } else if (!SETTING_HANDLERS.has(config?.storage?.type)) {
            reject(new Error(`Unknown setting handler ${config?.storage?.type}`));
        } else {
            SETTING_HANDLERS.get(config.storage.type).get(WRITE)(config, settings, resolve, reject);
        }
    });
}

module.exports = {
    loadSettings: loadSettings,
    saveSettings: saveSettings
};