const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base"
});

function ordering(x) {
    return x.ordering ? x.ordering : 0
}
function pubDate(x) {
    return x.pubdate ? new Date(x.pubdate) : new Date(0)
}
function dateTime(x) {
    return x.datetime ? new Date(x.datetime) : new Date(0)
}
export default function compare(x, y) {
    if (ordering(y) !== ordering(x)) {
        return ordering(y) - ordering(x)
    } else if (pubDate(x).getTime() !== pubDate(y).getTime()) {
        return +(pubDate(x) < pubDate(y)) - +(pubDate(y) < pubDate(x));
    } else {
        return collator.compare(x.title, y.title)
    }

}