import compare from './compare'
import * as yamlFront from 'yaml-front-matter'
import glob from 'glob';
import url from 'url';
import fs from 'fs-extra';
import lqip from 'lqip'
import { ApolloError } from 'apollo-server-core';

function itemsForContent(contentType) {
    const paths = glob.sync(`./content/${contentType}/*.md`)
    return paths
        .map(filename => {
            const slug = filename.match(`^./content/${contentType}\/(.*)\.md`)!;
            const urlText = url.resolve(`/${contentType}/`, slug[1]);
            const file = fs.readFileSync(filename, "utf8");
            const content = yamlFront.loadFront(file);
            return {
                title: content.title,
                slug: slug[1],
                items: [],
                url: urlText,
                ...content
            }
        }).sort(compare)
}

const roomDatabase = fs.readJSONSync('./content/room-database.json')

const content = {
    'blogs': itemsForContent(`blogs`),
    'exec': itemsForContent(`exec`),
    'info': itemsForContent(`info`),
    'pages': itemsForContent(`pages`),
    'posts': itemsForContent(`posts`),
    'prospective': itemsForContent(`prospective`),
    'room_locations': itemsForContent(`room_locations`),
    'societies': itemsForContent(`societies`),
    'welfare': itemsForContent(`welfare`),
    'whatson': itemsForContent(`whatson`),
    'rooms': roomDatabase['Rooms'].sort((a, b) => compare({ title: a["Title"] }, { title: b["Title"] })),
    'room_comments': roomDatabase['Comments'],
    'room_images': roomDatabase['Images'],

}

function filename(filepath) {
    return filepath.split('\\').pop().split('/').pop().split('.')[0]
}

const mapping = {}
Object.keys(content).forEach(collection => {
    mapping[collection] = {}
    content[collection].forEach(item => {
        mapping[collection][item.slug] = item
    });
})


export default async (contentType, contentSlug: string = "") => {
    if (!(contentType in mapping)) throw new ApolloError(`Content folder ${contentType} not found`, 'NOT_FOUND');
    if (contentSlug) {
        if (!(contentSlug in mapping[contentType])) throw new ApolloError(`Content ${contentSlug} not found in ${contentType}`, 'NOT_FOUND');
        const content = mapping[contentType][contentSlug]
        return {
            ...content,
            id: contentSlug,
            body: content['__content'],
            type: contentType
        }
    } else {
        return Object.entries(mapping[contentType]).map(([contentSlug, content]) => ({
            ...content,
            id: contentSlug,
            body: content['__content'],
            type: contentType
        }))

    }
}

export const navItems = [
    {
        text: "Home",
        icon: "home",
        url: "/",
        routes: []
    },
    {
        text: "What's On",
        icon: "today",
        url: "/whatson",
        routes: []
    },
    {
        text: "Prospective students",
        icon: "face",
        url: "/prospective",
        routes: itemsForContent("prospective")
    },
    {
        text: "Current students",
        icon: "account_circle",
        url: "/members",
        routes: [
            {
                title: "Minutes",
                url: "/members/minutes",
                routes: []
            },
            {
                title: "Official Documents",
                url: "/members/official_documents",
                routes: []
            }
        ]
    },
    {
        text: "Committee",
        icon: "assignment_ind",
        url: "/exec",
        routes: itemsForContent("exec")
    },
    {
        text: "Posts",
        icon: "assignment",
        url: "/blogs",
        routes: itemsForContent("blogs")
    },
    {
        text: "Welfare",
        icon: "sentiment_very_satisfied",
        url: "/welfare",
        routes: [
            ...itemsForContent("welfare"),
            {
                title: "Pregnancy Kit",
                url: "/welfare/pregnancy_kit",
                routes: []
            },
            {
                title: "Welfare Request",
                url: "/welfare/welfare_request",
                routes: []
            }
        ]
    },
    {
        text: "Societies",
        icon: "rowing",
        url: "/societies",
        routes: itemsForContent("societies")
    },
    {
        text: "Room database",
        icon: "location_city",
        url: "/room_locations",
        routes: itemsForContent("room_locations")
    },
    {
        text: "Info",
        icon: "info",
        url: "/info",
        routes: itemsForContent("info")
    }
]

const flatMap = (arr: Array<any>, f) => ([] as Array<any>).concat(...arr.map(f))
export const routes = flatMap(navItems, (x => [
    x,
    ...x.routes

])).concat(
    itemsForContent("rooms"),
    itemsForContent("whatson"),
    itemsForContent("posts"))

const lqipCache = {}
function memoizedLqip(filename) {
    if (!(filename in lqipCache)) {
        try {
            lqipCache[filename] = lqip.base64(filename)
        } catch (e) {
            console.error(e)
        }
        return null
    } else {
        return lqipCache[filename]
    }
}

export async function resolveImage(image: string, alt) {
    if (image == null) return null;
    const asset = image.match(`\/assets\/images\/(.*)\/(.*)`);
    if (asset && asset[1] && asset[2]) {
        const placeholder = memoizedLqip(`./assets/images/${asset[1]}/${asset[2]}`)
        return {
            src: image.replace('/assets/images/', 'https://ecsu.org.uk/api/image/'),
            placeholder: placeholder,
            alt
        }
    } else {
        return { src: image, alt };
    }
}


export function roomDatabaseImages(obj) {
    const paths = glob.sync(`./user_uploads/room_database/${obj.id}/*.{jpg,png,jpeg}`)
    return roomDatabase['Images'].filter(image => image['Room'] == obj['Room']).map(x => resolveImage(x["Image"], obj["Title"])).concat(
        paths.map(src => ({ src: src.replace('./user_uploads', 'https://ecsu.org.uk/api/user_uploads'), alt: obj["Title"] })))
}