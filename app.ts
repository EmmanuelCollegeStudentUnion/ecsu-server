require('dotenv').config()
import express from 'express';
import image from './image';
import applyMinutesMiddleware, { minutes } from './minutes';
import applyGraphqlMiddleware from './schema';
import applyRssFeedMiddleware from './rssfeed';
import applyICalFeedMiddleware from './icalfeed';
import applyAuthMiddleware from './auth';
import applyUploadMiddleware from './upload';


const app = express();

//CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (_req, res) => res.send('Server running.'))

applyAuthMiddleware(app);
applyMinutesMiddleware(app);
applyGraphqlMiddleware(app)
applyRssFeedMiddleware(app);
applyICalFeedMiddleware(app);
applyUploadMiddleware(app);

app.get('/image/:folder/:file(*)', (req, res, next) => {
    res.type('image/png');
    const stream = image(`./assets/images/${req.params.folder}/${req.params.file}`, 0, 0, 0);
    stream.on('error', next).pipe(res);
})

app.get('/user_uploads/room_database/:folder/:file(*)', (req, res, next) => {
    res.type('image/png');
    const stream = image(`./user_uploads/room_database/${req.params.folder}/${req.params.file}`, 0, 0, 0);
    stream.on('error', next).pipe(res);
})

export default app;