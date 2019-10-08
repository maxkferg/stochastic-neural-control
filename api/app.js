const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const jwt = require('koa-jwt');
const GraphQLHTTP = require('koa-graphql');
const GraphQLSchema = require('./graphql/schema');
const { ApolloServer, gql } = require('apollo-server-koa');
const startConnectors = require('./connectors')
const pubSub = require('./connectors/pubSub');
const Logger = require('./logger');
const database = require('./database');
const auth = require('./auth');
const influxdb = require('./influxdb');
const config = require('config');
const app = new Koa();
const router = new Router();
const PORT = config.get('Webserver.port');
require('dotenv').config()

async function init() {
    const database_schema = __dirname + '/database/mongo';
    const database_uri = config.get("Mongo.host");
    const db = await database.start(database_schema, database_uri);
    await startConnectors(db)

    const server = new ApolloServer({
        schema: GraphQLSchema,
        introspection: true,
        playground: true,
        cors: true,
        context: async (request) => {
            const authenticationHeader = request.ctx.req.headers.authorization || '';
            const jwtToken = authenticationHeader.split(" ")[1];
            let user;
            try { 
                user = await auth.verifyJwtToken(jwtToken);
            } catch {
                user = {};
            }
            return ({
                user,
                db: db,
                influx: influxdb,
                pubSub: pubSub,
            })
        },
    });

    app.use(cors());

    //Unprotected root url
    router.get('/', (ctx, next) => {
        ctx.body = 'KOA Server running! Go back to sleep or code!';
    });

    //adding jwt to retrieve token if present and decode it,
    //allowing passthrough to enable login/signup requests to go through to graphql
    //cookie option has been passed to make auth work with graphiql
    router.use(jwt({secret: config.get('JWT.secret'), passthrough: true, cookie: "token"}));

    // //custom method to use parsed token data to validate and populate user
    router.use(auth.validate);

    // //other protected url
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
        console.log('error', err);
        Logger.error(err);
    });

    httpServer = app.listen(PORT, function () {
        Logger.info(`Server started on port => ${PORT}`);
        Logger.info(`GraphQL ready at http://localhost:${PORT}${server.graphqlPath}`);
        Logger.info(`Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
    });

    server.applyMiddleware({ app });
    server.installSubscriptionHandlers(httpServer);
}


module.exports = init;