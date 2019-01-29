
import RavenStrategy from 'passport-raven'
import { Strategy as JWTstrategy, ExtractJwt } from 'passport-jwt'
import jwt from 'jsonwebtoken';
import AnonymousStrategy from 'passport-anonymous';
import passport from 'passport'

passport.use(new RavenStrategy({
    desc: 'ECSU',
    audience: 'https://ecsu.org.uk'
}, function (crsid, params, callback) {
    // You can skip this check if you want to support ex students and staff as well
    if (params.isCurrent) {
        return callback(null, { id: crsid });
    } else {
        return callback(new Error('My Raven application is only for current students and staff'));
    }
}));
passport.use(new AnonymousStrategy());
passport.use(new JWTstrategy({
    //secret we used to sign our JWT
    secretOrKey: 'top_secret',
    jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromUrlQueryParameter('auth')])
}, async (token, done) => {
    try {
        //Pass the user details to the next middleware
        return done(null, { crsid: token.crsid });
    } catch (error) {
        done(null, {});
    }
}));

export default function applyAuthMiddleware(app) {
    app.use(passport.initialize())
    app.use('/graphql', passport.authenticate(['jwt', 'anonymous'], { session: false }))
    app.get('/token',
        passport.authorize('raven'), (req, res, next) => {
            const token = jwt.sign({ crsid: req.account.id }, 'top_secret');
            //Send back the token to the user
            return res.json({ token });
        });

}