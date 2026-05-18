const FormData = require('form-data');
const fs = require('fs/promises');
const axios = require('axios');
const humanizeDuration = require('humanize-duration');

const abs = require('./abs');

/**
 * Gets embed data for an item
 * @param {Object} config The global config
 * @param {Object} item The book
 * @returns {Object} The embed data
 */
function getItemEmbed(config, item) {
    const data = {
        embeds: [
            {
                title: item.media.metadata.title,
                url: `${config.audiobookshelf.server}${config.audiobookshelf.baseurl}item/${item.id}`,
                description: 'Book imported',
                image: {
                    url: 'attachment://cover.jpg'
                }
            }
        ]
    };

    const fields = [
        {
            name: 'Author',
            value: item.media.metadata.authorName,
            inline: true
        },
        {
            name: 'Narrator',
            value: item.media.metadata.narratorName,
            inline: true
        }
    ];

    if (item.media.metadata.seriesName) {
        fields.push({
            name: 'Series',
            value: item.media.metadata.seriesName
        });
    }

    const human_config = {
        round: true,
        units: [ 'h', 'm' ]
    };

    fields.push({
        name: 'Duration',
        value: humanizeDuration(Math.floor(item.media.duration) * 1000, human_config)
    });

    let description = item.media.metadata.description.substring(0, 1023);
    if (description != item.media.metadata.description) {
        description += '…';
    }

    fields.push({
        name: 'Description',
        value: description
    });

    fields.push({
        name: 'Tags',
        value: item.media.tags.join(' / ')
    });

    data.embeds[0].fields = fields;

    return data;
}

/**
 * Sends the item to discord
 * @param {Object} config The global config
 * @param {Object} item The book
 * @returns {Promise} A promise for when the item is sent
 */
function sendItem(config, item) {
    return new Promise(function (resolve, reject) {
        const form = new FormData();
        const filePath = abs.getCoverPath(config, item);
        form.append('payload_json', JSON.stringify(getItemEmbed(config, item)));

        const axios_config = {
            headers: form.getHeaders()
        };

        fs.readFile(filePath)
            .then(function (file) {
                form.append('file', file, 'cover.jpg');

                axios.post(config.discord.webhookurl, form, axios_config)
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

/**
 * Sends the items to discord
 * @param {Object} config The global config
 * @param {Object} items The books
 * @returns {Promise} A promise for when the items are sent
 */
function sendItems(config, items) {
    return new Promise(function (resolve, reject) {
        const promises = [];

        items.forEach(function (item) {
            promises.push(sendItem(config, item));
        });

        const errors = [];

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
                    resolve(items);
                }
            });
    });
}

module.exports = {
    sendItems: sendItems
};