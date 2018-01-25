function removeEndpoint(app, endpoint) {
    for (let routeNo = 0 ; routeNo < app._router.stack.length ; routeNo++) {
        const routes = app._router.stack[routeNo];

        if (routes.route !== undefined &&
            routes.route.path === endpoint) {

            app._router.stack.splice(routeNo, 1);
            routeNo--;
        }
    }
}

module.exports = removeEndpoint;
