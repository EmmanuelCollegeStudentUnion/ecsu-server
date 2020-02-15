
import content from "./loaders";
import e = require("express");

export async function getExec(): Promise<string[]> {
    var execs = await content("exec");
    var crsids: string[] = [];
    execs.forEach(e => {
        crsids.push(...e.crsid);
    });
    return crsids;
}

export async function isExec(crsid: string): Promise<boolean> {
    return (await getExec()).includes(crsid);
}