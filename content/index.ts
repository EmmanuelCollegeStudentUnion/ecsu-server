import compare from './compare'
const yamlFront = require('yaml-front-matter');
const glob = require('glob');
const url = require('url');
const fs = require('fs')
import imageRemapExternal from './image-remap-external';

function itemsForContent(contentType) {
    const paths = glob.sync(`./content/${contentType}/*.md`)
    return paths
        .map(filename => {
            const slug = filename.match(`^./content/${contentType}\/(.*)\.md`);
            const urlText = url.resolve(`/${contentType}/`, "");
            const file = fs.readFileSync(filename, "utf8");
            const content = yamlFront.loadFront(imageRemapExternal(file));
            return {
                text: content.title,
                title: content.title,
                name: slug[1],
                items: [],
                url: urlText,
                ...content
            }
        }).sort(compare)
}

const content = {
    'blogs': itemsForContent(`blogs`),
    'exec': itemsForContent(`exec`),
    'info': itemsForContent(`info`),
    'pages': itemsForContent(`pages`),
    'posts': itemsForContent(`posts`),
    'prospective': itemsForContent(`prospective`),
    'room_comments': itemsForContent(`room_comments`),
    'room_locations': itemsForContent(`room_locations`),
    'rooms': itemsForContent(`rooms`),
    'societies': itemsForContent(`societies`),
    'welfare': itemsForContent(`welfare`),
    'whatson': itemsForContent(`whatson`),
}

function filename(filepath) {
    return filepath.split('\\').pop().split('/').pop().split('.')[0]
}

const mapping = {}
Object.keys(content).forEach(collection => {
    mapping[collection] = {}
    content[collection].forEach(item => {
        mapping[collection][item.name] = item
    });
})


export default async (contentType, contentSlug: string = "") => {
    if (!(contentType in mapping)) throw new Error(`Content folder ${contentType} not found`);
    if (contentSlug) {
        if (!(contentSlug in mapping[contentType])) throw new Error(`Content ${contentSlug} not found in ${contentType}`);
        const content = mapping[contentType][contentSlug]
        return {
            ...content,
            id: contentSlug,
            body: content['__content'],
            type: contentType
        }
    } else {
        return Object.values(mapping[contentType]).map(content => ({
            ...content,
            id: contentSlug,
            body: content['__content'],
            type: contentType
        }))

    }
}

export async function resolveImage(image, alt) {

    if (image == null) return null;
    return { src: 'https://nh487.user.srcf.net/api/' + image, alt };
}