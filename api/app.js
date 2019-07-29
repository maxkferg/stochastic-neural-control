const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const jwt = require('koa-jwt');
const GraphQLHTTP = require('koa-graphql');
const GraphQLSchema = require('./graphql/schema');
const Logger = require('./logger');
const database = require('./database');
const auth = require('./auth');
const influxdb = require('./influxdb');
const config = require('config');
const app = new Koa();
const router = new Router();
const PORT = config.get('Webserver.port');


async function init() {
    //app.context.db = await database.start(__dirname + '/database/mongo', config.MONGO_URI);
    app.context.influx = influxdb

    app.use(cors());

    //Unprotected root url
    router.get('/', (ctx, next) => {
        ctx.body = 'KOA Server running! Go back to sleep or code!';
    });

    //adding jwt to retrieve token if present and decode it,
    //allowing passthrough to enable login/signup requests to go through to graphql
    //cookie option has been passed to make auth work with graphiql
    router.use(jwt({secret: config.get('JWT.secret'), passthrough: true, cookie: "token"}));

    //custom method to use parsed token data to validate and populate user
    router.use(auth.validate);

    //initializing graphql
    router.all('/graphql', GraphQLHTTP({
        schema: GraphQLSchema,
        graphiql: true
    }));

    // Graphql Playground
    //router.all('/playground', koaPlayground.default({ endpoint: '/graphql' }))

    //other protected url
    router.get('/protected', (ctx, next) => {
        if (!ctx.user) {
            ctx.status = 401;
            ctx.body = 'Protected resource, use Authorization header to get access';
            return;
        }
        ctx.body = 'This is a protected route!';
    });

    app.use(router.routes()).use(router.allowedMethods());

    //global error logging
    app.on("error", (err, ctx) => {
        Logger.error(err);
    });

    app.listen(PORT, function () {
        Logger.info("Server started on port =>", PORT);
    });
}


module.exports = init;