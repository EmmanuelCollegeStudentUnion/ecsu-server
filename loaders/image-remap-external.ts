const md5 = require('md5')
export default function (source) {
    return source.replace(/https:\/\/ucarecdn.com\/([A-Za-z0-9]|-|\/)*/gi, imageUrl => `/external/${md5(imageUrl)}.jpg`);
};