var Check=require('./Check');
var Credit=require('./Credit');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var Ion=require('./Ion');
var PeliasGeocoderService=require('./PeliasGeocoderService');
var Rectangle=require('./Rectangle');
var Resource=require('./Resource');

    'use strict';

    /**
     * Provides geocoding through Cesium ion.
     * @alias IonGeocoderService
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Scene} options.scene The scene
     * @param {String} [options.accessToken=Ion.defaultAccessToken] The access token to use.
     * @param {String} [options.accessToken=Ion.defaultAccessToken] The access token to use.
     * @param {String|Resource} [options.server=Ion.defaultServer] The resource to the Cesium ion API server.
     *
     * @see Ion
     */
    function IonGeocoderService(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('options.scene', options.scene);
        //>>includeEnd('debug');

        var accessToken = defaultValue(options.accessToken, Ion.defaultAccessToken);
        var server = Resource.createIfNeeded(defaultValue(options.server, Ion.defaultServer));
        server.appendForwardSlash();

        var defaultTokenCredit = Ion.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
            options.scene.frameState.creditDisplay.addDefaultCredit(Credit.clone(defaultTokenCredit));
        }

        var searchEndpoint = server.getDerivedResource({
            url: 'v1/geocode'
        });

        if (defined(accessToken)) {
            searchEndpoint.appendQueryParameters({ access_token: accessToken });
        }

        this._accessToken = accessToken;
        this._server = server;
        this._pelias = new PeliasGeocoderService(searchEndpoint);
    }

    /**
     * @function
     *
     * @param {String} query The query to be sent to the geocoder service
     * @param {GeocodeType} [type=GeocodeType.SEARCH] The type of geocode to perform.
     * @returns {Promise<GeocoderService~Result[]>}
     */
    IonGeocoderService.prototype.geocode = function (query, geocodeType) {
        return this._pelias.geocode(query, geocodeType);
    };

    module.exports= IonGeocoderService;
