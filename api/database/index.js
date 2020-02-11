const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

/**
 * Returns mongoose model for the schema
 * @param domainName - Domain Name to be used eg. User
 * @param modelsDir - Root Directory name where models are stored for databases
 *
 * @returns mongoose model
 * */

function getMongooseModel(domainName, modelsDir) {
    let domain = require(path.join(modelsDir, domainName));
    let schema = new mongoose.Schema(domain.schema);


    //add all the index for the domain to schema
    domain.indexes.forEach((index) => {
        schema.index(index);
    });

    if (domain.hooks) {
        if (domain.hooks.type === 'pre') {
            schema.pre("save", function(doc, next) {
                domain.hooks.callback(doc, next);
            });
        }
    }

    //initialize the model
    let model = mongoose.model(domainName, schema);
    model.ensureIndexes(function (err) {
        if (err) console.log(err);
    });

    return model;
}

/**
 * Process the models for specific database
 * @param modelsDir - Root Directory name where models are stored for databases
 * @param databaseURI - URI of the database
 * @param callback - final callback to the callee to tell execution finished
 * */

async function processDatabaseModels(modelsDir, databaseURI) {

    let connection, db = {};

    try {
        const config = {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        };
        connection = await mongoose.connect(databaseURI, config);
        console.log("Database connected to instance at =>", databaseURI);
    } catch (e) {
        return e;
    }

    if (connection) {
        try {
            let files = fs.readdirSync(modelsDir);
            files.forEach(function (file) {
                let name = file.replace(/\.js$/, '');
                db[name] = getMongooseModel(name, modelsDir);
                console.info('Loading MongoDB Model:', name);
            });
        } catch (e) {
            return e;
        }
    }
    return db;
}

module.exports = {
    start: processDatabaseModels,
};