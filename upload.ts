import tus from 'tus-node-server';
import jwt from 'jsonwebtoken';
import fs from 'fs-extra';
const EVENTS = tus.EVENTS;
const server = new tus.Server();
server.datastore = new tus.FileStore({
    path: '/user_uploads',
    relativeLocation: true
});


function metadataStringToObject(stringValue) {
    const keyValuePairList = stringValue.split(',')
    return keyValuePairList.reduce((metadata, keyValuePair) => {
        let [key, base64Value] = keyValuePair.split(' ')
        metadata[key] = Buffer.from(base64Value, "base64").toString("ascii")
        return metadata
    }, {})
}

async function roomDatabaseUpload(file, metadata, user) {
    try {
        fs.mkdirpSync(`./user_uploads`);
        fs.mkdirpSync(`./user_uploads/room_database`);
        fs.mkdirpSync(`./user_uploads/room_database/${metadata.roomSlug}/`);
        const extension = metadata.extension.replace(/\W/g, '')
        const roomSlug = metadata.roomSlug.replace(/[^a-zA-Z\d_-]/g, '')
        const src = `./user_uploads/${file.id}`;
        const dest = `./user_uploads/room_database/${roomSlug}/${file.id}.${extension}`
        fs.moveSync(src, dest)
        fs.writeJSON(dest + '.json', { user: user })
        fs.symlinkSync(dest, src, "file")
    } catch (e) {
        console.error(e)
    }
}

async function minutesUpload(file, metadata, user) {
    try {
        const year = metadata.year.replace(/\W/g, '')
        fs.mkdirpSync(`./user_uploads`);
        fs.mkdirpSync(`./user_uploads/minutes`);
        fs.mkdirpSync(`./user_uploads/minutes/${metadata.year}/`);
        const extension = metadata.extension.replace(/\W/g, '')
        const src = `./user_uploads/${file.id}`;
        const dest = `./user_uploads/minutes/${metadata.year}/${file.id}.${extension}`
        fs.moveSync(src, dest)
        fs.writeJSON(dest + '.json', {
            type: metadata.type,
            year: metadata.year,
            term: metadata.term,
            number: metadata.number,
            user: user
        })
        fs.symlinkSync(dest, src, "file")
    } catch (e) {
        console.error(e)
    }
}

const express = require('express');
const uploadApp = express();
uploadApp.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
uploadApp.all('*', server.handle.bind(server));
server.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
    try {
        console.log(event)
        const metadata = metadataStringToObject(event.file.upload_metadata)
        console.log(metadata)
        const user = jwt.verify(metadata.authorization, process.env.SECRET)
        console.log(user)
        console.log(`Upload complete for file ${event.file.id}`);
        switch (metadata.upload) {
            case "ROOM_DATABASE": roomDatabaseUpload(event.file, metadata, user)
            case "MINUTES": minutesUpload(event.file, metadata, user)

        }
    } catch (e) {
        console.error(e)
    }
});
export default function applyUploadMiddleware(app) {
    app.use('/upload', uploadApp);
}