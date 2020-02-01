'use strict';
var Trouter = require('trouter');

// Webpack exports Trouter as Trouter.default
if (typeof Trouter !== 'function') {
    Trouter = Trouter.default;
}

class WorkerRouter extends Trouter {

    constructor() {
        super();
    }

    use(path, ...handlers) {
        if (typeof path === 'function') {
            handlers.unshift(path);
            super.use('/', ...handlers);
        }
        else {
            super.use(path, ...handlers);
        }
    }
}

WorkerRouter.prototype.handleRequest = async function(event) {

    try {
        var request = event.request;
        var context = {
            waitUntil: (p) => event.waitUntil(p)
        }

        if (this.ingressHandler !== undefined) {
            let igResult = this.ingressHandler(request, context);
            if (igResult instanceof Response) {
                return igResult;
            }
        }

        const url = new URL(request.url);
        const result = this.find(request.method, url.pathname);
        context.pathParams = result.params;

        for (let handler of result.handlers) {
            const response = await handler(request, context);
            if (response instanceof Response) {
                if (this.egressHandler !== undefined) {
                    let egResult = this.egressHandler(request, context, response);
                    if (egResult instanceof Response) {
                        return egResult;
                    }
                }
                return response;
            }
        }

        if (this.notFoundHandler !== undefined) {
            let nfResult = this.notFoundHandler(request, context);
            if (nfResult instanceof Response) {
                return nfResult;
            }
        }

        return new Response("404 - Resource not found\n", {
            status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
    catch (err) {
        if (this.errorHandler !== undefined) {
            let result = this.errorHandler(request, context, err);
            if (result instanceof Response) {
                return result;
            }
        }
        return new Response(`500 - ${err}`, {
            status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
}

module.exports = new WorkerRouter();
