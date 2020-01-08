import itemsForContent from './content'
const ical = require('ical-generator');
import { Request, Response } from 'express';
import showdown from 'showdown';
const converter = new showdown.Converter({
    simplifiedAutoLink: true
})


async function getFeed() {
    const feed = new ical({
        name: "ECSU What's On",
        //feedLinks: {
        //    rss: "https://ecsu.org.uk/api/whatson.xml",
        //},
        //feed: "https://ecsu.org.uk/api/whatson.xml",
        domain: "https://ecsu.org.uk/",
        //copyright: "Copyright ECSU",
        timezone: "Europe/London"
    });
    (await itemsForContent("whatson")).forEach(item => {
        const html = converter.makeHtml(item['__content'])
        const event = feed.createEvent({
            summary: item.title,
            uid: item.url,
            url: `https://ecsu.org.uk${item.url}`,
            start: item.datetime,
            end: item.dtend,
            allDay: item.allDay,
            description: item.description,
            content: html
        })
        event.createCategory({name: item.category});
    })
    return feed;
}

const feedPromise = getFeed();

async function rssfeed(req: Request, res: Response) {
    const feed = await feedPromise;
    res.type('text/calendar');
    res.send(feed.toString());
}

export default function applyICalFeedMiddleware(app) {
    app.get('/calendar.ical', rssfeed)
}