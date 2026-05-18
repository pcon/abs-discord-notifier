const axios = require('axios');
const createWriteStream = require('fs').createWriteStream;

/**
 * Gets the headers
 * @param {Object} config The global config
 * @returns {Object} The headers
 */
function getHeaders(config) {
    const headers = {};
    headers.Authorization = `Bearer ${config.audiobookshelf.token}`;
    return headers;
}

/**
 * Gets the recent library items
 * @param {Object} config The global config
 * @returns {Promise} A promise for the recent library items
 */
function getRecentItems(config) {
    return new Promise(function (resolve, reject) {
        const absURL = new URL(`${config.audiobookshelf.server}${config.audiobookshelf.baseurl}api/libraries/${config.audiobookshelf.library.default}/items`);
        absURL.searchParams.append('limit', config.discord.maxresults);
        absURL.searchParams.append('sort', 'addedAt');
        absURL.searchParams.append('minified', '1');
        absURL.searchParams.append('desc', '1');
        const axios_config = {
            headers: getHeaders(config)
        };

        axios.get(absURL.href, axios_config)
            .then(function (result) {
                resolve(result.data.results);
            })
            .catch(reject);
    });
}

/**
 * Filters the books down to new books
 * @param {Object} settings The recent settings
 * @param {Object} recent_items The recent books
 * @returns {Promise} A promise for the filtered books
 */
function filterRecentItems(settings, recent_items) {
    return new Promise(function (resolve) {
        const new_books = [];
        let found_id = false;

        recent_items.forEach(function (item) {
            if (item.id === settings.most_recent_id) {
                found_id = true;
            }

            if (!found_id) {
                new_books.push(item);
            }
        });
        resolve(new_books);
    });
}

/**
 * Gets the path to the cover
 * @param {Object} config The default config
 * @param {Object} item The book
 * @returns {String} The path to the cover
 */
function getCoverPath(config, item) {
    return `${config.storage.cache}/${item.id}.jpg`;
}

/**
 * Downloads a book's cover
 * @param {Object} config The default config
 * @param {Object} item The book
 * @returns {Promise} A promise for when the cover has been downloaded
 */
function downloadCover(config, item) {
    return new Promise(function (resolve, reject) {
        const writer = createWriteStream(getCoverPath(config, item));
        const absURL = new URL(`${config.audiobookshelf.server}${config.audiobookshelf.baseurl}api/items/${item.id}/cover`);
        absURL.searchParams.append('format', 'jpeg');
        absURL.searchParams.append('width', 200);
        const axios_config = {
            headers: getHeaders(config),
            responseType: 'stream'
        };

        axios.get(absURL, axios_config)
            .then(function (res) {
                res.data.pipe(writer);

                let err = null;

                writer.on('error', function (error) {
                    err = error;
                    writer.close();
                    reject(error);
                });

                writer.on('close', function () {
                    if (!err) {
                        resolve();
                    }
                });
            })
            .catch(reject);
    });
}

/**
 * Downloads all the covers
 * @param {Object} config The default config
 * @param {Object[]} recent_items The recent books to download
 * @returns {Promise} A promise for when the covers have been downloaded
 */
function downloadCovers(config, recent_items) {
    return new Promise(function (resolve, reject) {
        const promises = [];
        const errors = [];

        recent_items.forEach(function (item) {
            promises.push(downloadCover(config, item));
        });

        Promise.allSettled(promises)
            .then(function (results) {
                results.forEach(function (result) {
                    if (result.status === 'rejected') {
                        errors.push(result.reason);
                    }
                });

                if (errors.length !== 0) {
                    reject(errors);
                } else {
                    resolve(recent_items);
                }
            });
    });
}

module.exports = {
    getRecentItems: getRecentItems,
    filterRecentItems: filterRecentItems,
    downloadCovers: downloadCovers,
    getCoverPath: getCoverPath
};