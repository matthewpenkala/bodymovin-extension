/*global XML, $, app*/

$.__bodymovin.bm_ProjectHelper = (function() {

    var bm_generalUtils = $.__bodymovin.bm_generalUtils;
    var bm_eventDispatcher = $.__bodymovin.bm_eventDispatcher;
    var JSON = $.__bodymovin.JSON;
    var fileString = '';

    var ob = {};
    ob.init = init;
    ob.getGradientData = getGradientData;
    ob.end = end;

    function init() {
        fileString = '';
    }

    function end() {
        fileString = '';
    }

    //─── read the raw .aep bytes (from Code 2 for correctness) ─────────────────
    function getProjectData() {
        var proj = app.project;
        var ff = proj.file;
        if (!ff) {
            fileString = '<no file>';
        } else {
            var demoFile = new File(ff.absoluteURI);
            // Open in BINARY mode to guarantee unmodified bytes, which is critical.
            // This prevents the system from altering line endings or other characters.
            if (demoFile.open('r', 'BINARY')) {
                fileString = demoFile.read(); // read all bytes
                demoFile.close(); // Release the file handle
            } else {
                fileString = '<could not open file>';
            }
        }
    }

    //─── sort helper for color-stop positions (from Code 2) ───────────────────
    function sortFunction(a, b) {
        var a0 = +a[0]; // Using unary `+` for concise type conversion
        var b0 = +b[0];
        return a0 === b0 ? 0 : (a0 < b0 ? -1 : 1);
    }

    //─── explicit JS-string → UTF-8 byte sequence (from Code 2) ───────────────
    function toUTF8ByteString(str) {
        // 1) percent-encode as UTF-8, 2) turn each %XX back into the raw byte
        return encodeURIComponent(str).replace(
            /%([0-9A-F]{2})/g,
            function(_, hex) {
                return String.fromCharCode(parseInt(hex, 16));
            }
        );
    }

    //─── main gradient-extraction logic ─────────────────────────────────────────
    function getGradientData(shapeNavigation, numKeys) {
        if (!fileString) {
            getProjectData();
        }
        var hasNoGradColorData = fileString.indexOf('ADBE Vector Grad Colors') === -1;
        numKeys = numKeys || 1;

        var navigationIndex = 0;

        // Navigate to the right XML block by searching for layer/property names
        for (var i = 0; i < shapeNavigation.length; i += 1) {
            var encoded = toUTF8ByteString(shapeNavigation[i] + 'LIST');
            var stringIndex = fileString.indexOf(encoded, navigationIndex + 1);
            if (stringIndex === -1) {
                encoded = toUTF8ByteString(shapeNavigation[i] + ' LIST');
                stringIndex = fileString.indexOf(encoded, navigationIndex + 1);
            }
            if (stringIndex === -1) {
                encoded = toUTF8ByteString(shapeNavigation[i]);
                stringIndex = fileString.indexOf(encoded, navigationIndex + 1);
            }
            navigationIndex = stringIndex;
        }

        var gradientIndex = fileString.indexOf('ADBE Vector Grad Colors', navigationIndex);
        var gradFillIndex = fileString.indexOf('ADBE Vector Graphic - G-Fill', navigationIndex);
        var gradStrokeIndex = fileString.indexOf('ADBE Vector Graphic - G-Stroke', navigationIndex);

        var limitIndex;
        if (gradStrokeIndex !== -1 && gradFillIndex !== -1) {
            limitIndex = Math.min(gradFillIndex, gradStrokeIndex);
        } else {
            limitIndex = Math.max(gradFillIndex, gradStrokeIndex);
        }
        if (limitIndex === -1) {
            limitIndex = Number.MAX_VALUE;
        }

        var currentKey = 0,
            keyframes = [],
            hasOpacity = false,
            maxOpacities = 0,
            maxColors = 0;

        // This loop parses the gradient data for each keyframe.
        // It uses the cleaner syntax from Code 2, but the logic is identical to Code 1.
        while (currentKey < numKeys) {
            var gradientData = {};
            var lastIndex;
            gradientIndex = fileString.indexOf('<prop.map', gradientIndex);

            if (hasNoGradColorData || gradientIndex > limitIndex || (gradientIndex === -1 && limitIndex === Number.MAX_VALUE)) {
                gradientData.c = [
                    [0, 1, 1, 1],
                    [1, 0, 0, 0]
                ];
                maxColors = Math.max(maxColors, 2);
            } else {
                var endMatch = '</prop.map>';
                lastIndex = fileString.indexOf(endMatch, gradientIndex);
                var xmlString = fileString.substr(gradientIndex, lastIndex + endMatch.length - gradientIndex);
                xmlString = xmlString.replace(/\n/g, '');
                var XML_Ob = new XML(xmlString);
                var stops = XML_Ob['prop.list'][0]['prop.pair'][0]['prop.list'][0]['prop.pair'][0]['prop.list'][0]['prop.pair'][0]['prop.list'][0]['prop.pair'];
                var colors = XML_Ob['prop.list'][0]['prop.pair'][0]['prop.list'][0]['prop.pair'][1]['prop.list'][0]['prop.pair'][0]['prop.list'][0]['prop.pair'];
                
                var opacitiesArr = [], op, floats, nextFloats, midPoint;

                // Parse opacities
                for (var j = 0; j < stops.length(); j += 1) {
                    floats = stops[j]['prop.list'][0]['prop.pair'][0]['array'][0].float;
                    op = [
                        bm_generalUtils.roundNumber(+floats[0], 3),
                        bm_generalUtils.roundNumber(+floats[2], 3)
                    ];
                    if (op[1] !== 1) {
                        hasOpacity = true;
                    }
                    opacitiesArr.push(op);
                    var midPosition = +floats[1];
                    if (j < stops.length() - 1) {
                        nextFloats = stops[j + 1]['prop.list'][0]['prop.pair'][0]['array'][0].float;
                        midPoint = +floats[0] + (+nextFloats[0] - +floats[0]) * midPosition;
                        var midPointValue = +floats[2] + (+nextFloats[2] - +floats[2]) * 0.5;
                        opacitiesArr.push([
                            bm_generalUtils.roundNumber(midPoint, 3),
                            bm_generalUtils.roundNumber(midPointValue, 3)
                        ]);
                    }
                }

                // Parse colors
                var sortedColors = [];
                for (j = 0; j < colors.length(); j += 1) {
                    sortedColors.push(colors[j]['prop.list'][0]['prop.pair'][0]['array'][0].float);
                }
                sortedColors.sort(sortFunction);

                var colorsArr = [];
                for (j = 0; j < sortedColors.length; j += 1) {
                    floats = sortedColors[j];
                    op = [
                        bm_generalUtils.roundNumber(+floats[0], 3),
                        bm_generalUtils.roundNumber(+floats[2], 3),
                        bm_generalUtils.roundNumber(+floats[3], 3),
                        bm_generalUtils.roundNumber(+floats[4], 3)
                    ];
                    colorsArr.push(op);
                    var midPosition = +floats[1];
                    if (j < sortedColors.length - 1) {
                        nextFloats = sortedColors[j + 1];
                        midPoint = +floats[0] + (+nextFloats[0] - +floats[0]) * midPosition;
                        var midPointValueR = +floats[2] + (+nextFloats[2] - +floats[2]) * 0.5;
                        var midPointValueG = +floats[3] + (+nextFloats[3] - +floats[3]) * 0.5;
                        var midPointValueB = +floats[4] + (+nextFloats[4] - +floats[4]) * 0.5;
                        colorsArr.push([
                            bm_generalUtils.roundNumber(midPoint, 3),
                            bm_generalUtils.roundNumber(midPointValueR, 3),
                            bm_generalUtils.roundNumber(midPointValueG, 3),
                            bm_generalUtils.roundNumber(midPointValueB, 3)
                        ]);
                    }
                }
                gradientData.c = colorsArr;
                gradientData.o = opacitiesArr;
                maxOpacities = Math.max(maxOpacities, opacitiesArr.length);
                maxColors = Math.max(maxColors, colorsArr.length);
            }

            gradientIndex = lastIndex;
            keyframes.push(gradientData);
            currentKey += 1;
        }

        // This section pads and flattens the keyframe data into the final array.
        // The logic is taken directly from the original working script to ensure identical output,
        // but it is commented and styled for better readability.
        var mergedKeys = [];
        for (i = 0; i < numKeys; i += 1) {
            var mergedArr = [];
            var currentFrame = keyframes[i];

            // Pad color data if it has fewer stops than the maximum in the animation
            if (currentFrame.c.length < maxColors) {
                var currentColors = currentFrame.c;
                var arrayLength = currentColors.length;
                var lastValue = currentColors[arrayLength - 1];
                var offsetValue = lastValue[0];
                var count = 0;
                while (arrayLength + count < maxColors) {
                    offsetValue -= 0.001;
                    currentColors.splice(arrayLength - 1, 0, [offsetValue, lastValue[1], lastValue[2], lastValue[3]]);
                    count += 1;
                }
            }

            // Flatten color data into a single array
            for (var j = 0; j < maxColors; j += 1) {
                for (var k = 0; k < 4; k += 1) {
                    mergedArr.push(currentFrame.c[j][k]);
                }
            }

            if (!hasOpacity) {
                delete currentFrame.o;
            } else {
                // Pad opacity data if necessary
                if (currentFrame.o.length < maxOpacities) {
                    var opacities = currentFrame.o;
                    arrayLength = opacities.length;
                    lastValue = opacities[arrayLength - 1];
                    offsetValue = lastValue[0];
                    count = 0;
                    while (arrayLength + count < maxOpacities) {
                        offsetValue -= 0.001;
                        opacities.splice(arrayLength - 1, 0, [offsetValue, lastValue[1], lastValue[2], lastValue[3]]);
                        count += 1;
                    }
                }
                // Flatten opacity data into the same array
                for (j = 0; j < maxOpacities; j += 1) {
                    for (var l = 0; l < 2; l += 1) {
                        mergedArr.push(currentFrame.o[j][l]);
                    }
                }
            }
            
            // This structure for single vs multiple keys is from the original working script
            if (numKeys <= 1) {
                mergedKeys = mergedArr;
            } else {
                mergedKeys.push(mergedArr);
            }
        }

        return {
            m: mergedKeys,
            p: maxColors
        };
    }

    return ob;
}());
