const BaseResolver = require('../../BaseResolver');

class VerifyTokenResolver extends BaseResolver {

    async resolve(parentValue, args, ctx) {
        //calling super method to check authentication if applicable
        super.resolve(parentValue, args, ctx);

        try {
            return ctx.user
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = VerifyTokenResolver;