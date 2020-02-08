import itemsForContent from './loaders'
const ical = require('ical-generator');
import { Request, Response } from 'express';
import showdown from 'showdown';
const converter = new showdown.Converter({
    simplifiedAutoLink: true
})


async function getFeed(category ?: Array<string>) {
    if (category == undefined && baseFeedGened) {
        return await feedPromise;
    }
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
        if (category == undefined || category.includes(item.category)) {
            const html = converter.makeHtml(item['__content'])
            const event = feed.createEvent({
                summary: item.title,
                uid: item.url,
                url: `https://ecsu.org.uk${item.url}`,
                start: item.datetime,
                end: item.dtend != "" ? item.dtend : undefined,
                allDay: item.allDay,
                description: item['__content'],
                htmlDescription: html
            })
            event.createCategory({name: item.category});
        }
    })
    return feed;
}

const feedPromise = getFeed();
var baseFeedGened = false;

async function rssfeed(req: Request, res: Response) {
    var out;
    if (req.query.category) {
        var cats: Array<string> = [];
        if (Array.isArray(req.query.category)) {
            cats = req.query.category;
        } else {
            cats.push(req.query.category);
        }
        out = await getFeed(cats)
    } else {
        out = await feedPromise;
    }
    res.type('text/calendar');
    res.send(out.toString());
}

export default function applyICalFeedMiddleware(app) {
    app.get('/calendar.ics', rssfeed)
}