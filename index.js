const config = require('./config.json');
const settings_lib = require('./lib/settings');

const abs = require('./lib/abs');
const discord = require('./lib/discord');

let getRecentItems_bound,
    filterRecentItems_bound,
    downloadCovers_bound,
    sendItems_bound,
    saveSettings_bound;

/**
 * Binds all the functions
 * @param {Object} config The global config
 * @param {Object} settings The global settings
 * @returns {Promise} A promise for when the functions are bound
 */
function bindFunctions(config, settings) {
    return new Promise(function (resolve) {
        getRecentItems_bound = abs.getRecentItems.bind(null, config, settings);
        filterRecentItems_bound = abs.filterRecentItems.bind(null, settings);
        downloadCovers_bound = abs.downloadCovers.bind(null, config);
        sendItems_bound = discord.sendItems.bind(null, config);
        saveSettings_bound = settings_lib.saveSettings.bind(null, config);
        resolve();
    });
}

settings_lib.loadSettings(config)
    .then(function (settings) {
        return new Promise(function (resolve, reject) {
            bindFunctions(config, settings)
                .then(getRecentItems_bound)
                .then(filterRecentItems_bound)
                .then(downloadCovers_bound)
                .then(sendItems_bound)
                .then(function (items) {
                    return new Promise(function (resolve) {
                        if (items.length > 0) {
                            settings.most_recent_id = items[0].id;
                        }

                        resolve(settings);
                    });
                })
                .then(saveSettings_bound)
                .then(resolve)
                .catch(reject);
        });
    })
    .catch(function (error) {
        console.error(JSON.stringify(error));
    });
