
import content from "./loaders";
import e = require("express");

export async function execList(): Promise<string[]> {
    var execs = await content("exec");
    var crsids: string[] = [];
    execs.forEach(e => {
        crsids.push(...e.crsid);
    });
    return crsids;
}

export async function isExec(crsid: string): Promise<boolean> {
    var execs = await content("exec");
    execs.forEach(e => {
        if (e.crsid.includes(crsid)) {
            return true;
        }
    });
    return false;
}