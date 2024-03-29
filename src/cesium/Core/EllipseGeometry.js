var arrayFill=require('./arrayFill');
var BoundingSphere=require('./BoundingSphere');
var Cartesian2=require('./Cartesian2');
var Cartesian3=require('./Cartesian3');
var Cartographic=require('./Cartographic');
var Check=require('./Check');
var ComponentDatatype=require('./ComponentDatatype');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var DeveloperError=require('./DeveloperError');
var EllipseGeometryLibrary=require('./EllipseGeometryLibrary');
var Ellipsoid=require('./Ellipsoid');
var GeographicProjection=require('./GeographicProjection');
var Geometry=require('./Geometry');
var GeometryAttribute=require('./GeometryAttribute');
var GeometryAttributes=require('./GeometryAttributes');
var GeometryInstance=require('./GeometryInstance');
var GeometryOffsetAttribute=require('./GeometryOffsetAttribute');
var GeometryPipeline=require('./GeometryPipeline');
var IndexDatatype=require('./IndexDatatype');
var CesiumMath=require('./Math');
var Matrix3=require('./Matrix3');
var PrimitiveType=require('./PrimitiveType');
var Quaternion=require('./Quaternion');
var Rectangle=require('./Rectangle');
var VertexFormat=require('./VertexFormat');

    'use strict';

    var scratchCartesian1 = new Cartesian3();
    var scratchCartesian2 = new Cartesian3();
    var scratchCartesian3 = new Cartesian3();
    var scratchCartesian4 = new Cartesian3();
    var texCoordScratch = new Cartesian2();
    var textureMatrixScratch = new Matrix3();
    var tangentMatrixScratch = new Matrix3();
    var quaternionScratch = new Quaternion();

    var scratchNormal = new Cartesian3();
    var scratchTangent = new Cartesian3();
    var scratchBitangent = new Cartesian3();

    var scratchCartographic = new Cartographic();
    var projectedCenterScratch = new Cartesian3();

    var scratchMinTexCoord = new Cartesian2();
    var scratchMaxTexCoord = new Cartesian2();

    function computeTopBottomAttributes(positions, options, extrude) {
        var vertexFormat = options.vertexFormat;
        var center = options.center;
        var semiMajorAxis = options.semiMajorAxis;
        var semiMinorAxis = options.semiMinorAxis;
        var ellipsoid = options.ellipsoid;
        var stRotation = options.stRotation;
        var size = (extrude) ? positions.length / 3 * 2 : positions.length / 3;
        var shadowVolume = options.shadowVolume;

        var textureCoordinates = (vertexFormat.st) ? new Float32Array(size * 2) : undefined;
        var normals = (vertexFormat.normal) ? new Float32Array(size * 3) : undefined;
        var tangents = (vertexFormat.tangent) ? new Float32Array(size * 3) : undefined;
        var bitangents = (vertexFormat.bitangent) ? new Float32Array(size * 3) : undefined;

        var extrudeNormals = (shadowVolume) ? new Float32Array(size * 3) : undefined;

        var textureCoordIndex = 0;

        // Raise positions to a height above the ellipsoid and compute the
        // texture coordinates, normals, tangents, and bitangents.
        var normal = scratchNormal;
        var tangent = scratchTangent;
        var bitangent = scratchBitangent;

        var projection = new GeographicProjection(ellipsoid);
        var projectedCenter = projection.project(ellipsoid.cartesianToCartographic(center, scratchCartographic), projectedCenterScratch);

        var geodeticNormal = ellipsoid.scaleToGeodeticSurface(center, scratchCartesian1);
        ellipsoid.geodeticSurfaceNormal(geodeticNormal, geodeticNormal);

        var textureMatrix = textureMatrixScratch;
        var tangentMatrix = tangentMatrixScratch;
        if (stRotation !== 0) {
            var rotation = Quaternion.fromAxisAngle(geodeticNormal, stRotation, quaternionScratch);
            textureMatrix = Matrix3.fromQuaternion(rotation, textureMatrix);

            rotation = Quaternion.fromAxisAngle(geodeticNormal, -stRotation, quaternionScratch);
            tangentMatrix = Matrix3.fromQuaternion(rotation, tangentMatrix);
        } else {
            textureMatrix = Matrix3.clone(Matrix3.IDENTITY, textureMatrix);
            tangentMatrix = Matrix3.clone(Matrix3.IDENTITY, tangentMatrix);
        }

        var minTexCoord = Cartesian2.fromElements(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, scratchMinTexCoord);
        var maxTexCoord = Cartesian2.fromElements(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, scratchMaxTexCoord);

        var length = positions.length;
        var bottomOffset = (extrude) ? length : 0;
        var stOffset = bottomOffset / 3 * 2;
        for (var i = 0; i < length; i += 3) {
            var i1 = i + 1;
            var i2 = i + 2;
            var position = Cartesian3.fromArray(positions, i, scratchCartesian1);

            if (vertexFormat.st) {
                var rotatedPoint = Matrix3.multiplyByVector(textureMatrix, position, scratchCartesian2);
                var projectedPoint = projection.project(ellipsoid.cartesianToCartographic(rotatedPoint, scratchCartographic), scratchCartesian3);
                Cartesian3.subtract(projectedPoint, projectedCenter, projectedPoint);

                texCoordScratch.x = (projectedPoint.x + semiMajorAxis) / (2.0 * semiMajorAxis);
                texCoordScratch.y = (projectedPoint.y + semiMinorAxis) / (2.0 * semiMinorAxis);

                minTexCoord.x = Math.min(texCoordScratch.x, minTexCoord.x);
                minTexCoord.y = Math.min(texCoordScratch.y, minTexCoord.y);
                maxTexCoord.x = Math.max(texCoordScratch.x, maxTexCoord.x);
                maxTexCoord.y = Math.max(texCoordScratch.y, maxTexCoord.y);

                if (extrude) {
                    textureCoordinates[textureCoordIndex + stOffset] = texCoordScratch.x;
                    textureCoordinates[textureCoordIndex + 1 + stOffset] = texCoordScratch.y;
                }

                textureCoordinates[textureCoordIndex++] = texCoordScratch.x;
                textureCoordinates[textureCoordIndex++] = texCoordScratch.y;
            }

            if (vertexFormat.normal || vertexFormat.tangent || vertexFormat.bitangent || shadowVolume) {
                normal = ellipsoid.geodeticSurfaceNormal(position, normal);

                if (shadowVolume) {
                    extrudeNormals[i + bottomOffset] = -normal.x;
                    extrudeNormals[i1 + bottomOffset] = -normal.y;
                    extrudeNormals[i2 + bottomOffset] = -normal.z;
                }

                if (vertexFormat.normal || vertexFormat.tangent || vertexFormat.bitangent) {
                    if (vertexFormat.tangent || vertexFormat.bitangent) {
                        tangent = Cartesian3.normalize(Cartesian3.cross(Cartesian3.UNIT_Z, normal, tangent), tangent);
                        Matrix3.multiplyByVector(tangentMatrix, tangent, tangent);
                    }
                    if (vertexFormat.normal) {
                        normals[i] = normal.x;
                        normals[i1] = normal.y;
                        normals[i2] = normal.z;
                        if (extrude) {
                            normals[i + bottomOffset] = -normal.x;
                            normals[i1 + bottomOffset] = -normal.y;
                            normals[i2 + bottomOffset] = -normal.z;
                        }
                    }

                    if (vertexFormat.tangent) {
                        tangents[i] = tangent.x;
                        tangents[i1] = tangent.y;
                        tangents[i2] = tangent.z;
                        if (extrude) {
                            tangents[i + bottomOffset] = -tangent.x;
                            tangents[i1 + bottomOffset] = -tangent.y;
                            tangents[i2 + bottomOffset] = -tangent.z;
                        }
                    }

                    if (vertexFormat.bitangent) {
                        bitangent = Cartesian3.normalize(Cartesian3.cross(normal, tangent, bitangent), bitangent);
                        bitangents[i ] = bitangent.x;
                        bitangents[i1] = bitangent.y;
                        bitangents[i2] = bitangent.z;
                        if (extrude) {
                            bitangents[i + bottomOffset] = bitangent.x;
                            bitangents[i1 + bottomOffset] = bitangent.y;
                            bitangents[i2 + bottomOffset] = bitangent.z;
                        }
                    }
                }
            }
        }

        if (vertexFormat.st) {
            length = textureCoordinates.length;
            for (var k = 0; k < length; k += 2) {
                textureCoordinates[k] = (textureCoordinates[k] - minTexCoord.x) / (maxTexCoord.x - minTexCoord.x);
                textureCoordinates[k + 1] = (textureCoordinates[k + 1] - minTexCoord.y) / (maxTexCoord.y - minTexCoord.y);
            }
        }

        var attributes = new GeometryAttributes();

        if (vertexFormat.position) {
            var finalPositions = EllipseGeometryLibrary.raisePositionsToHeight(positions, options, extrude);
            attributes.position = new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : finalPositions
            });
        }

        if (vertexFormat.st) {
            attributes.st = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 2,
                values : textureCoordinates
            });
        }

        if (vertexFormat.normal) {
            attributes.normal = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : normals
            });
        }

        if (vertexFormat.tangent) {
            attributes.tangent = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : tangents
            });
        }

        if (vertexFormat.bitangent) {
            attributes.bitangent = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : bitangents
            });
        }

        if (shadowVolume) {
            attributes.extrudeDirection = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : extrudeNormals
            });
        }

        if (extrude && defined(options.offsetAttribute)) {
            var offsetAttribute = new Uint8Array(size);
            if (options.offsetAttribute === GeometryOffsetAttribute.TOP) {
                offsetAttribute = arrayFill(offsetAttribute, 1, 0, size / 2);
            } else {
                var offsetValue = options.offsetAttribute === GeometryOffsetAttribute.NONE ? 0 : 1;
                offsetAttribute = arrayFill(offsetAttribute, offsetValue);
            }

            attributes.applyOffset = new GeometryAttribute({
                componentDatatype : ComponentDatatype.UNSIGNED_BYTE,
                componentsPerAttribute : 1,
                values : offsetAttribute
            });
        }

        return attributes;
    }

    function topIndices(numPts) {
        // numTriangles in half = 3 + 8 + 12 + ... = -1 + 4 + (4 + 4) + (4 + 4 + 4) + ... = -1 + 4 * (1 + 2 + 3 + ...)
        //              = -1 + 4 * ((n * ( n + 1)) / 2)
        // total triangles = 2 * numTrangles in half
        // indices = total triangles * 3;
        // Substitute numPts for n above

        var indices = new Array(12 * (numPts * ( numPts + 1)) - 6);
        var indicesIndex = 0;
        var prevIndex;
        var numInterior;
        var positionIndex;
        var i;
        var j;
        // Indices triangles to the 'right' of the north vector

        prevIndex = 0;
        positionIndex = 1;
        for (i = 0; i < 3; i++) {
            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;
        }

        for (i = 2; i < numPts + 1; ++i) {
            positionIndex = i * (i + 1) - 1;
            prevIndex = (i - 1) * i - 1;

            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;

            numInterior = 2 * i;
            for (j = 0; j < numInterior - 1; ++j) {

                indices[indicesIndex++] = positionIndex;
                indices[indicesIndex++] = prevIndex++;
                indices[indicesIndex++] = prevIndex;

                indices[indicesIndex++] = positionIndex++;
                indices[indicesIndex++] = prevIndex;
                indices[indicesIndex++] = positionIndex;
            }

            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;
        }

        // Indices for center column of triangles
        numInterior = numPts * 2;
        ++positionIndex;
        ++prevIndex;
        for (i = 0; i < numInterior - 1; ++i) {
            indices[indicesIndex++] = positionIndex;
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex;

            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;
        }

        indices[indicesIndex++] = positionIndex;
        indices[indicesIndex++] = prevIndex++;
        indices[indicesIndex++] = prevIndex;

        indices[indicesIndex++] = positionIndex++;
        indices[indicesIndex++] = prevIndex++;
        indices[indicesIndex++] = prevIndex;

        // Reverse the process creating indices to the 'left' of the north vector
        ++prevIndex;
        for (i = numPts - 1; i > 1; --i) {
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;

            numInterior = 2 * i;
            for (j = 0; j < numInterior - 1; ++j) {
                indices[indicesIndex++] = positionIndex;
                indices[indicesIndex++] = prevIndex++;
                indices[indicesIndex++] = prevIndex;

                indices[indicesIndex++] = positionIndex++;
                indices[indicesIndex++] = prevIndex;
                indices[indicesIndex++] = positionIndex;
            }

            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = positionIndex++;
        }

        for (i = 0; i < 3; i++) {
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;
        }
        return indices;
    }

    var boundingSphereCenter = new Cartesian3();

    function computeEllipse(options) {
        var center = options.center;
        boundingSphereCenter = Cartesian3.multiplyByScalar(options.ellipsoid.geodeticSurfaceNormal(center, boundingSphereCenter), options.height, boundingSphereCenter);
        boundingSphereCenter = Cartesian3.add(center, boundingSphereCenter, boundingSphereCenter);
        var boundingSphere = new BoundingSphere(boundingSphereCenter, options.semiMajorAxis);
        var cep = EllipseGeometryLibrary.computeEllipsePositions(options, true, false);
        var positions = cep.positions;
        var numPts = cep.numPts;
        var attributes = computeTopBottomAttributes(positions, options, false);
        var indices = topIndices(numPts);
        indices = IndexDatatype.createTypedArray(positions.length / 3, indices);
        return {
            boundingSphere : boundingSphere,
            attributes : attributes,
            indices : indices
        };
    }

    function computeWallAttributes(positions, options) {
        var vertexFormat = options.vertexFormat;
        var center = options.center;
        var semiMajorAxis = options.semiMajorAxis;
        var semiMinorAxis = options.semiMinorAxis;
        var ellipsoid = options.ellipsoid;
        var height = options.height;
        var extrudedHeight = options.extrudedHeight;
        var stRotation = options.stRotation;
        var size = positions.length / 3 * 2;

        var finalPositions = new Float64Array(size * 3);
        var textureCoordinates = (vertexFormat.st) ? new Float32Array(size * 2) : undefined;
        var normals = (vertexFormat.normal) ? new Float32Array(size * 3) : undefined;
        var tangents = (vertexFormat.tangent) ? new Float32Array(size * 3) : undefined;
        var bitangents = (vertexFormat.bitangent) ? new Float32Array(size * 3) : undefined;

        var shadowVolume = options.shadowVolume;
        var extrudeNormals = (shadowVolume) ? new Float32Array(size * 3) : undefined;

        var textureCoordIndex = 0;

        // Raise positions to a height above the ellipsoid and compute the
        // texture coordinates, normals, tangents, and bitangents.
        var normal = scratchNormal;
        var tangent = scratchTangent;
        var bitangent = scratchBitangent;

        var projection = new GeographicProjection(ellipsoid);
        var projectedCenter = projection.project(ellipsoid.cartesianToCartographic(center, scratchCartographic), projectedCenterScratch);

        var geodeticNormal = ellipsoid.scaleToGeodeticSurface(center, scratchCartesian1);
        ellipsoid.geodeticSurfaceNormal(geodeticNormal, geodeticNormal);
        var rotation = Quaternion.fromAxisAngle(geodeticNormal, stRotation, quaternionScratch);
        var textureMatrix = Matrix3.fromQuaternion(rotation, textureMatrixScratch);

        var minTexCoord = Cartesian2.fromElements(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, scratchMinTexCoord);
        var maxTexCoord = Cartesian2.fromElements(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, scratchMaxTexCoord);

        var length = positions.length;
        var stOffset = length / 3 * 2;
        for (var i = 0; i < length; i += 3) {
            var i1 = i + 1;
            var i2 = i + 2;
            var position = Cartesian3.fromArray(positions, i, scratchCartesian1);
            var extrudedPosition;

            if (vertexFormat.st) {
                var rotatedPoint = Matrix3.multiplyByVector(textureMatrix, position, scratchCartesian2);
                var projectedPoint = projection.project(ellipsoid.cartesianToCartographic(rotatedPoint, scratchCartographic), scratchCartesian3);
                Cartesian3.subtract(projectedPoint, projectedCenter, projectedPoint);

                texCoordScratch.x = (projectedPoint.x + semiMajorAxis) / (2.0 * semiMajorAxis);
                texCoordScratch.y = (projectedPoint.y + semiMinorAxis) / (2.0 * semiMinorAxis);

                minTexCoord.x = Math.min(texCoordScratch.x, minTexCoord.x);
                minTexCoord.y = Math.min(texCoordScratch.y, minTexCoord.y);
                maxTexCoord.x = Math.max(texCoordScratch.x, maxTexCoord.x);
                maxTexCoord.y = Math.max(texCoordScratch.y, maxTexCoord.y);

                textureCoordinates[textureCoordIndex + stOffset] = texCoordScratch.x;
                textureCoordinates[textureCoordIndex + 1 + stOffset] = texCoordScratch.y;

                textureCoordinates[textureCoordIndex++] = texCoordScratch.x;
                textureCoordinates[textureCoordIndex++] = texCoordScratch.y;
            }

            position = ellipsoid.scaleToGeodeticSurface(position, position);
            extrudedPosition = Cartesian3.clone(position, scratchCartesian2);
            normal = ellipsoid.geodeticSurfaceNormal(position, normal);

            if (shadowVolume) {
                extrudeNormals[i + length] = -normal.x;
                extrudeNormals[i1 + length] = -normal.y;
                extrudeNormals[i2 + length] = -normal.z;
            }

            var scaledNormal = Cartesian3.multiplyByScalar(normal, height, scratchCartesian4);
            position = Cartesian3.add(position, scaledNormal, position);
            scaledNormal = Cartesian3.multiplyByScalar(normal, extrudedHeight, scaledNormal);
            extrudedPosition = Cartesian3.add(extrudedPosition, scaledNormal, extrudedPosition);

            if (vertexFormat.position) {
                finalPositions[i + length] = extrudedPosition.x;
                finalPositions[i1 + length] = extrudedPosition.y;
                finalPositions[i2 + length] = extrudedPosition.z;

                finalPositions[i] = position.x;
                finalPositions[i1] = position.y;
                finalPositions[i2] = position.z;
            }

            if (vertexFormat.normal || vertexFormat.tangent || vertexFormat.bitangent) {

                bitangent = Cartesian3.clone(normal, bitangent);
                var next = Cartesian3.fromArray(positions, (i + 3) % length, scratchCartesian4);
                Cartesian3.subtract(next, position, next);
                var bottom = Cartesian3.subtract(extrudedPosition, position, scratchCartesian3);

                normal = Cartesian3.normalize(Cartesian3.cross(bottom, next, normal), normal);

                if (vertexFormat.normal) {
                    normals[i] = normal.x;
                    normals[i1] = normal.y;
                    normals[i2] = normal.z;

                    normals[i + length] = normal.x;
                    normals[i1 + length] = normal.y;
                    normals[i2 + length] = normal.z;
                }

                if (vertexFormat.tangent) {
                    tangent = Cartesian3.normalize(Cartesian3.cross(bitangent, normal, tangent), tangent);
                    tangents[i] = tangent.x;
                    tangents[i1] = tangent.y;
                    tangents[i2] = tangent.z;

                    tangents[i + length] = tangent.x;
                    tangents[i + 1 + length] = tangent.y;
                    tangents[i + 2 + length] = tangent.z;
                }

                if (vertexFormat.bitangent) {
                    bitangents[i ] = bitangent.x;
                    bitangents[i1] = bitangent.y;
                    bitangents[i2] = bitangent.z;

                    bitangents[i + length] = bitangent.x;
                    bitangents[i1 + length] = bitangent.y;
                    bitangents[i2 + length] = bitangent.z;
                }
            }
        }

        if (vertexFormat.st) {
            length = textureCoordinates.length;
            for (var k = 0; k < length; k += 2) {
                textureCoordinates[k] = (textureCoordinates[k] - minTexCoord.x) / (maxTexCoord.x - minTexCoord.x);
                textureCoordinates[k + 1] = (textureCoordinates[k + 1] - minTexCoord.y) / (maxTexCoord.y - minTexCoord.y);
            }
        }

        var attributes = new GeometryAttributes();

        if (vertexFormat.position) {
            attributes.position = new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : finalPositions
            });
        }

        if (vertexFormat.st) {
            attributes.st = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 2,
                values : textureCoordinates
            });
        }

        if (vertexFormat.normal) {
            attributes.normal = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : normals
            });
        }

        if (vertexFormat.tangent) {
            attributes.tangent = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : tangents
            });
        }

        if (vertexFormat.bitangent) {
            attributes.bitangent = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : bitangents
            });
        }

        if (shadowVolume) {
            attributes.extrudeDirection = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : extrudeNormals
            });
        }

        if (defined(options.offsetAttribute)) {
            var offsetAttribute = new Uint8Array(size);
            if (options.offsetAttribute === GeometryOffsetAttribute.TOP) {
                offsetAttribute = arrayFill(offsetAttribute, 1, 0, size / 2);
            } else {
                var offsetValue = options.offsetAttribute === GeometryOffsetAttribute.NONE ? 0 : 1;
                offsetAttribute = arrayFill(offsetAttribute, offsetValue);
            }
            attributes.applyOffset = new GeometryAttribute({
                componentDatatype : ComponentDatatype.UNSIGNED_BYTE,
                componentsPerAttribute : 1,
                values : offsetAttribute
            });
        }

        return attributes;
    }

    function computeWallIndices(positions) {
        var length = positions.length / 3;
        var indices = IndexDatatype.createTypedArray(length, length * 6);
        var index = 0;
        for (var i = 0; i < length; i++) {
            var UL = i;
            var LL = i + length;
            var UR = (UL + 1) % length;
            var LR = UR + length;
            indices[index++] = UL;
            indices[index++] = LL;
            indices[index++] = UR;
            indices[index++] = UR;
            indices[index++] = LL;
            indices[index++] = LR;
        }

        return indices;
    }

    var topBoundingSphere = new BoundingSphere();
    var bottomBoundingSphere = new BoundingSphere();

    function computeExtrudedEllipse(options) {
        var center = options.center;
        var ellipsoid = options.ellipsoid;
        var semiMajorAxis = options.semiMajorAxis;
        var scaledNormal = Cartesian3.multiplyByScalar(ellipsoid.geodeticSurfaceNormal(center, scratchCartesian1), options.height, scratchCartesian1);
        topBoundingSphere.center = Cartesian3.add(center, scaledNormal, topBoundingSphere.center);
        topBoundingSphere.radius = semiMajorAxis;

        scaledNormal = Cartesian3.multiplyByScalar(ellipsoid.geodeticSurfaceNormal(center, scaledNormal), options.extrudedHeight, scaledNormal);
        bottomBoundingSphere.center = Cartesian3.add(center, scaledNormal, bottomBoundingSphere.center);
        bottomBoundingSphere.radius = semiMajorAxis;

        var cep = EllipseGeometryLibrary.computeEllipsePositions(options, true, true);
        var positions = cep.positions;
        var numPts = cep.numPts;
        var outerPositions = cep.outerPositions;
        var boundingSphere = BoundingSphere.union(topBoundingSphere, bottomBoundingSphere);
        var topBottomAttributes = computeTopBottomAttributes(positions, options, true);
        var indices = topIndices(numPts);
        var length = indices.length;
        indices.length = length * 2;
        var posLength = positions.length / 3;
        for (var i = 0; i < length; i += 3) {
            indices[i + length] = indices[i + 2] + posLength;
            indices[i + 1 + length] = indices[i + 1] + posLength;
            indices[i + 2 + length] = indices[i] + posLength;
        }

        var topBottomIndices = IndexDatatype.createTypedArray(posLength * 2 / 3, indices);

        var topBottomGeo = new Geometry({
            attributes : topBottomAttributes,
            indices : topBottomIndices,
            primitiveType : PrimitiveType.TRIANGLES
        });

        var wallAttributes = computeWallAttributes(outerPositions, options);
        indices = computeWallIndices(outerPositions);
        var wallIndices = IndexDatatype.createTypedArray(outerPositions.length * 2 / 3, indices);

        var wallGeo = new Geometry({
            attributes : wallAttributes,
            indices : wallIndices,
            primitiveType : PrimitiveType.TRIANGLES
        });

        var geo = GeometryPipeline.combineInstances([
            new GeometryInstance({
                geometry : topBottomGeo
            }),
            new GeometryInstance({
                geometry : wallGeo
            })
        ]);

        return {
            boundingSphere : boundingSphere,
            attributes : geo[0].attributes,
            indices : geo[0].indices
        };
    }

    function computeRectangle(center, semiMajorAxis, semiMinorAxis, rotation, granularity, ellipsoid, result) {
        var cep = EllipseGeometryLibrary.computeEllipsePositions({
            center : center,
            semiMajorAxis : semiMajorAxis,
            semiMinorAxis : semiMinorAxis,
            rotation : rotation,
            granularity : granularity
        }, false, true);
        var positionsFlat = cep.outerPositions;
        var positionsCount = positionsFlat.length / 3;
        var positions = new Array(positionsCount);
        for (var i = 0; i < positionsCount; ++i) {
            positions[i] = Cartesian3.fromArray(positionsFlat, i * 3);
        }
        var rectangle = Rectangle.fromCartesianArray(positions, ellipsoid, result);
        // Rectangle width goes beyond 180 degrees when the ellipse crosses a pole.
        // When this happens, make the rectangle into a "circle" around the pole
        if (rectangle.width > CesiumMath.PI) {
            rectangle.north = rectangle.north > 0.0 ? CesiumMath.PI_OVER_TWO - CesiumMath.EPSILON7 : rectangle.north;
            rectangle.south = rectangle.south < 0.0 ? CesiumMath.EPSILON7 - CesiumMath.PI_OVER_TWO : rectangle.south;
            rectangle.east = CesiumMath.PI;
            rectangle.west = -CesiumMath.PI;
        }
        return rectangle;
    }

    /**
     * A description of an ellipse on an ellipsoid. Ellipse geometry can be rendered with both {@link Primitive} and {@link GroundPrimitive}.
     *
     * @alias EllipseGeometry
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Cartesian3} options.center The ellipse's center point in the fixed frame.
     * @param {Number} options.semiMajorAxis The length of the ellipse's semi-major axis in meters.
     * @param {Number} options.semiMinorAxis The length of the ellipse's semi-minor axis in meters.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid the ellipse will be on.
     * @param {Number} [options.height=0.0] The distance in meters between the ellipse and the ellipsoid surface.
     * @param {Number} [options.extrudedHeight] The distance in meters between the ellipse's extruded face and the ellipsoid surface.
     * @param {Number} [options.rotation=0.0] The angle of rotation counter-clockwise from north.
     * @param {Number} [options.stRotation=0.0] The rotation of the texture coordinates counter-clockwise from north.
     * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The angular distance between points on the ellipse in radians.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     *
     * @exception {DeveloperError} semiMajorAxis and semiMinorAxis must be greater than zero.
     * @exception {DeveloperError} semiMajorAxis must be greater than or equal to the semiMinorAxis.
     * @exception {DeveloperError} granularity must be greater than zero.
     *
     *
     * @example
     * // Create an ellipse.
     * var ellipse = new Cesium.EllipseGeometry({
     *   center : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
     *   semiMajorAxis : 500000.0,
     *   semiMinorAxis : 300000.0,
     *   rotation : Cesium.Math.toRadians(60.0)
     * });
     * var geometry = Cesium.EllipseGeometry.createGeometry(ellipse);
     *
     * @see EllipseGeometry.createGeometry
     */
    function EllipseGeometry(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var center = options.center;
        var ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        var semiMajorAxis = options.semiMajorAxis;
        var semiMinorAxis = options.semiMinorAxis;
        var granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
        var vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);

        //>>includeStart('debug', pragmas.debug);
        Check.defined('options.center', center);
        Check.typeOf.number('options.semiMajorAxis', semiMajorAxis);
        Check.typeOf.number('options.semiMinorAxis', semiMinorAxis);
        if (semiMajorAxis < semiMinorAxis) {
            throw new DeveloperError('semiMajorAxis must be greater than or equal to the semiMinorAxis.');
        }
        if (granularity <= 0.0) {
            throw new DeveloperError('granularity must be greater than zero.');
        }
        //>>includeEnd('debug');

        var height = defaultValue(options.height, 0.0);
        var extrudedHeight = defaultValue(options.extrudedHeight, height);

        this._center = Cartesian3.clone(center);
        this._semiMajorAxis = semiMajorAxis;
        this._semiMinorAxis = semiMinorAxis;
        this._ellipsoid = Ellipsoid.clone(ellipsoid);
        this._rotation = defaultValue(options.rotation, 0.0);
        this._stRotation = defaultValue(options.stRotation, 0.0);
        this._height = Math.max(extrudedHeight, height);
        this._granularity = granularity;
        this._vertexFormat = VertexFormat.clone(vertexFormat);
        this._extrudedHeight = Math.min(extrudedHeight, height);
        this._shadowVolume = defaultValue(options.shadowVolume, false);
        this._workerName = 'createEllipseGeometry';
        this._offsetAttribute = options.offsetAttribute;

        this._rectangle = undefined;
        this._textureCoordinateRotationPoints = undefined;
    }

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    EllipseGeometry.packedLength = Cartesian3.packedLength + Ellipsoid.packedLength + VertexFormat.packedLength + 9;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {EllipseGeometry} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    EllipseGeometry.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        Cartesian3.pack(value._center, array, startingIndex);
        startingIndex += Cartesian3.packedLength;

        Ellipsoid.pack(value._ellipsoid, array, startingIndex);
        startingIndex += Ellipsoid.packedLength;

        VertexFormat.pack(value._vertexFormat, array, startingIndex);
        startingIndex += VertexFormat.packedLength;

        array[startingIndex++] = value._semiMajorAxis;
        array[startingIndex++] = value._semiMinorAxis;
        array[startingIndex++] = value._rotation;
        array[startingIndex++] = value._stRotation;
        array[startingIndex++] = value._height;
        array[startingIndex++] = value._granularity;
        array[startingIndex++] = value._extrudedHeight;
        array[startingIndex++] = value._shadowVolume ? 1.0 : 0.0;
        array[startingIndex] = defaultValue(value._offsetAttribute, -1);

        return array;
    };

    var scratchCenter = new Cartesian3();
    var scratchEllipsoid = new Ellipsoid();
    var scratchVertexFormat = new VertexFormat();
    var scratchOptions = {
        center : scratchCenter,
        ellipsoid : scratchEllipsoid,
        vertexFormat : scratchVertexFormat,
        semiMajorAxis : undefined,
        semiMinorAxis : undefined,
        rotation : undefined,
        stRotation : undefined,
        height : undefined,
        granularity : undefined,
        extrudedHeight : undefined,
        shadowVolume: undefined,
        offsetAttribute: undefined
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {EllipseGeometry} [result] The object into which to store the result.
     * @returns {EllipseGeometry} The modified result parameter or a new EllipseGeometry instance if one was not provided.
     */
    EllipseGeometry.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        var center = Cartesian3.unpack(array, startingIndex, scratchCenter);
        startingIndex += Cartesian3.packedLength;

        var ellipsoid = Ellipsoid.unpack(array, startingIndex, scratchEllipsoid);
        startingIndex += Ellipsoid.packedLength;

        var vertexFormat = VertexFormat.unpack(array, startingIndex, scratchVertexFormat);
        startingIndex += VertexFormat.packedLength;

        var semiMajorAxis = array[startingIndex++];
        var semiMinorAxis = array[startingIndex++];
        var rotation = array[startingIndex++];
        var stRotation = array[startingIndex++];
        var height = array[startingIndex++];
        var granularity = array[startingIndex++];
        var extrudedHeight = array[startingIndex++];
        var shadowVolume = array[startingIndex++] === 1.0;
        var offsetAttribute = array[startingIndex];

        if (!defined(result)) {
            scratchOptions.height = height;
            scratchOptions.extrudedHeight = extrudedHeight;
            scratchOptions.granularity = granularity;
            scratchOptions.stRotation = stRotation;
            scratchOptions.rotation = rotation;
            scratchOptions.semiMajorAxis = semiMajorAxis;
            scratchOptions.semiMinorAxis = semiMinorAxis;
            scratchOptions.shadowVolume = shadowVolume;
            scratchOptions.offsetAttribute = offsetAttribute === -1 ? undefined : offsetAttribute;

            return new EllipseGeometry(scratchOptions);
        }

        result._center = Cartesian3.clone(center, result._center);
        result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
        result._vertexFormat = VertexFormat.clone(vertexFormat, result._vertexFormat);
        result._semiMajorAxis = semiMajorAxis;
        result._semiMinorAxis = semiMinorAxis;
        result._rotation = rotation;
        result._stRotation = stRotation;
        result._height = height;
        result._granularity = granularity;
        result._extrudedHeight = extrudedHeight;
        result._shadowVolume = shadowVolume;
        result._offsetAttribute = offsetAttribute === -1 ? undefined : offsetAttribute;

        return result;
    };

    /**
     * Computes the bounding rectangle based on the provided options
     *
     * @param {Object} options Object with the following properties:
     * @param {Cartesian3} options.center The ellipse's center point in the fixed frame.
     * @param {Number} options.semiMajorAxis The length of the ellipse's semi-major axis in meters.
     * @param {Number} options.semiMinorAxis The length of the ellipse's semi-minor axis in meters.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid the ellipse will be on.
     * @param {Number} [options.rotation=0.0] The angle of rotation counter-clockwise from north.
     * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The angular distance between points on the ellipse in radians.
     * @param {Rectangle} [result] An object in which to store the result
     *
     * @returns {Rectangle} The result rectangle
     */
    EllipseGeometry.computeRectangle = function(options, result) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var center = options.center;
        var ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        var semiMajorAxis = options.semiMajorAxis;
        var semiMinorAxis = options.semiMinorAxis;
        var granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
        var rotation = defaultValue(options.rotation, 0.0);

        //>>includeStart('debug', pragmas.debug);
        Check.defined('options.center', center);
        Check.typeOf.number('options.semiMajorAxis', semiMajorAxis);
        Check.typeOf.number('options.semiMinorAxis', semiMinorAxis);
        if (semiMajorAxis < semiMinorAxis) {
            throw new DeveloperError('semiMajorAxis must be greater than or equal to the semiMinorAxis.');
        }
        if (granularity <= 0.0) {
            throw new DeveloperError('granularity must be greater than zero.');
        }
        //>>includeEnd('debug');

        return computeRectangle(center, semiMajorAxis, semiMinorAxis, rotation, granularity, ellipsoid, result);
    };

    /**
     * Computes the geometric representation of a ellipse on an ellipsoid, including its vertices, indices, and a bounding sphere.
     *
     * @param {EllipseGeometry} ellipseGeometry A description of the ellipse.
     * @returns {Geometry|undefined} The computed vertices and indices.
     */
    EllipseGeometry.createGeometry = function(ellipseGeometry) {
        if ((ellipseGeometry._semiMajorAxis <= 0.0) || (ellipseGeometry._semiMinorAxis <= 0.0)) {
            return;
        }

        var height = ellipseGeometry._height;
        var extrudedHeight = ellipseGeometry._extrudedHeight;
        var extrude = !CesiumMath.equalsEpsilon(height, extrudedHeight, 0, CesiumMath.EPSILON2);

        ellipseGeometry._center = ellipseGeometry._ellipsoid.scaleToGeodeticSurface(ellipseGeometry._center, ellipseGeometry._center);
        var options = {
            center : ellipseGeometry._center,
            semiMajorAxis : ellipseGeometry._semiMajorAxis,
            semiMinorAxis : ellipseGeometry._semiMinorAxis,
            ellipsoid : ellipseGeometry._ellipsoid,
            rotation : ellipseGeometry._rotation,
            height : height,
            granularity : ellipseGeometry._granularity,
            vertexFormat : ellipseGeometry._vertexFormat,
            stRotation : ellipseGeometry._stRotation
        };
        var geometry;
        if (extrude) {
            options.extrudedHeight = extrudedHeight;
            options.shadowVolume = ellipseGeometry._shadowVolume;
            options.offsetAttribute = ellipseGeometry._offsetAttribute;
            geometry = computeExtrudedEllipse(options);
        } else {
            geometry = computeEllipse(options);

            if (defined(ellipseGeometry._offsetAttribute)) {
                var length = geometry.attributes.position.values.length;
                var applyOffset = new Uint8Array(length / 3);
                var offsetValue = ellipseGeometry._offsetAttribute === GeometryOffsetAttribute.NONE ? 0 : 1;
                arrayFill(applyOffset, offsetValue);
                geometry.attributes.applyOffset = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.UNSIGNED_BYTE,
                    componentsPerAttribute : 1,
                    values: applyOffset
                });
            }
        }

        return new Geometry({
            attributes : geometry.attributes,
            indices : geometry.indices,
            primitiveType : PrimitiveType.TRIANGLES,
            boundingSphere : geometry.boundingSphere,
            offsetAttribute : ellipseGeometry._offsetAttribute
        });
    };

    /**
     * @private
     */
    EllipseGeometry.createShadowVolume = function(ellipseGeometry, minHeightFunc, maxHeightFunc) {
        var granularity = ellipseGeometry._granularity;
        var ellipsoid = ellipseGeometry._ellipsoid;

        var minHeight = minHeightFunc(granularity, ellipsoid);
        var maxHeight = maxHeightFunc(granularity, ellipsoid);

        return new EllipseGeometry({
            center : ellipseGeometry._center,
            semiMajorAxis : ellipseGeometry._semiMajorAxis,
            semiMinorAxis : ellipseGeometry._semiMinorAxis,
            ellipsoid : ellipsoid,
            rotation : ellipseGeometry._rotation,
            stRotation : ellipseGeometry._stRotation,
            granularity : granularity,
            extrudedHeight : minHeight,
            height : maxHeight,
            vertexFormat : VertexFormat.POSITION_ONLY,
            shadowVolume: true
        });
    };

    function textureCoordinateRotationPoints(ellipseGeometry) {
        var stRotation = -ellipseGeometry._stRotation;
        if (stRotation === 0.0) {
            return [0, 0, 0, 1, 1, 0];
        }

        var cep = EllipseGeometryLibrary.computeEllipsePositions({
            center : ellipseGeometry._center,
            semiMajorAxis : ellipseGeometry._semiMajorAxis,
            semiMinorAxis : ellipseGeometry._semiMinorAxis,
            rotation : ellipseGeometry._rotation,
            granularity : ellipseGeometry._granularity
        }, false, true);
        var positionsFlat = cep.outerPositions;
        var positionsCount = positionsFlat.length / 3;
        var positions = new Array(positionsCount);
        for (var i = 0; i < positionsCount; ++i) {
            positions[i] = Cartesian3.fromArray(positionsFlat, i * 3);
        }

        var ellipsoid = ellipseGeometry._ellipsoid;
        var boundingRectangle = ellipseGeometry.rectangle;
        return Geometry._textureCoordinateRotationPoints(positions, stRotation, ellipsoid, boundingRectangle);
    }

    defineProperties(EllipseGeometry.prototype, {
        /**
         * @private
         */
        rectangle : {
            get : function() {
                if (!defined(this._rectangle)) {
                    this._rectangle = computeRectangle(this._center, this._semiMajorAxis, this._semiMinorAxis, this._rotation, this._granularity, this._ellipsoid);
                }
                return this._rectangle;
            }
        },
        /**
         * For remapping texture coordinates when rendering EllipseGeometries as GroundPrimitives.
         * @private
         */
        textureCoordinateRotationPoints : {
            get : function() {
                if (!defined(this._textureCoordinateRotationPoints)) {
                    this._textureCoordinateRotationPoints = textureCoordinateRotationPoints(this);
                }
                return this._textureCoordinateRotationPoints;
            }
        }
    });

    module.exports= EllipseGeometry;
