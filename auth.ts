
import RavenStrategy from 'passport-raven'
import { Strategy as JWTstrategy, ExtractJwt } from 'passport-jwt'
import jwt from 'jsonwebtoken';
import AnonymousStrategy from 'passport-anonymous';
import passport from 'passport'
import { getExec, isExec } from './acl';
import express from 'express';


passport.use(new RavenStrategy({
    desc: 'ECSU',
    audience: 'https://ecsu.org.uk/api/protected'
}, function (crsid, params, callback) {
    // You can skip this check if you want to support ex students and staff as well
    if (params.isCurrent) {
        return callback(null, { id: crsid, current: true });
    } else {
        return callback(null, { id: crsid, current: false });
    }
}));
passport.use(new AnonymousStrategy());
passport.use(new JWTstrategy({
    //secret we used to sign our JWT
    secretOrKey: process.env.SECRET,
    jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromUrlQueryParameter('auth')])
}, async (token, done) => {
    try {
        //Pass the user details to the next middleware
        return done(null, { crsid: token.crsid, exec: token.exec, current: token.current});
    } catch (error) {
        done(null, {});
    }
}));

export function applyAuthMiddleware(app) {
    app.use(passport.initialize())
    app.use('/graphql', passport.authenticate(['jwt', 'anonymous'], { session: false }))
    app.use('/protected', passport.authenticate(['jwt', 'raven'], {
        session: false
    }))
    app.get('/token',
        passport.authorize('raven'), async (req, res, next) => {
            const token = jwt.sign({ crsid: req.account.id, exec: await isExec(req.account.id), current: req.account.current }, process.env.SECRET);
            //Send back the token to the user
            return res.json({ token });
        });

}

export function applyAuthTestMiddleware(app) {
    app.get('/acl/exec', async function (req, res) {
        res.send(await getExec());
    });
    app.get('/acl/exec/:crsid', async function (req, res) {
        res.send(await isExec(req.params.crsid));
    });
}