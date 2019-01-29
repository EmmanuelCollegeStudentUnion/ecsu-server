import glob from 'glob'
import fs from 'fs-extra'
import { Request, Response } from 'express';
import express from 'express'
export async function minutes() {
    const paths = glob.sync(`./user_uploads/minutes/**/*.pdf`);
    return paths.map(async path => {
        const urlPath = path.match(`^./user_uploads/minutes/(.*)/(.*)\.pdf`)!;
        const year = urlPath[1]
        const filename = urlPath[2]
        if (fs.pathExistsSync(path + '.json')) {
            return {
                url: `/api/protected/minutes/${year}/${filename}.pdf`,
                ...await fs.readJSON(path + '.json')
            }
        }
        else {
            return {
                url: `/api/protected/minutes/${year}/${filename}.pdf`,
                year
            }
        }
    });
}


export default function applyMinutesMiddleware(app) {
    app.use('/protected/minutes/', express.static('user_uploads/minutes'))
}


