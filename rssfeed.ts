import itemsForContent from './content'
import { Feed } from 'feed'
import { Request, Response } from 'express';
import showdown from 'showdown';
const converter = new showdown.Converter({
    simplifiedAutoLink: true
})


async function getFeed() {
    const feed = new Feed({
        title: "ECSU What's On",
        feedLinks: {
            rss: "https://ecsu.org.uk/api/whatson.xml",
        },
        feed: "https://ecsu.org.uk/api/whatson.xml",
        id: "https://ecsu.org.uk/",
        copyright: "Copyright ECSU",

    });
    (await itemsForContent("whatson")).forEach(item => {
        const html = converter.makeHtml(item['__content'])
        feed.addItem({
            title: item.title,
            id: item.url,
            link: `https://ecsu.org.uk${item.url}`,
            date: item.pubDate,
            description: item.description,
            content: html
        })
    })
    return feed;
}

const feedPromise = getFeed();

async function rssfeed(req: Request, res: Response) {
    const feed = await feedPromise;
    res.type('text/xml');
    res.send(feed.rss2())
}

export default function applyRssFeedMiddleware(app) {
    app.get('/whatson.xml', rssfeed)
}