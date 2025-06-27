/*jslint vars: true , plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global File, Folder, $, KeyframeEase, Shape, app, MaskMode, TrackMatteType, KeyframeInterpolationType, ImportOptions, TextDocument, ParagraphJustification */

$.__bodymovin.bm_lottieImporter = (function () {

	var bm_eventDispatcher = $.__bodymovin.bm_eventDispatcher;

	var ob = {};

	var mainFolder;
	var elements = {};
	var frameRate = 0;

	function getElementById(id) {
		if(elements[id]) {
			return elements[id].element;
		}
		return null;
	}

	function addElement(id, element) {
		elements[id] = {
			element: element
		}
	}

	function createFolder(name) {
		name = name || 'Imported_Lottie_Animation';
		mainFolder = app.project.items.addFolder(name);
	}

	function createComp(name, width, height, duration, id) {
		name = name || 'Lottie_Main_Comp';
		var comp = app.project.items.addComp(name, width, height, 1, duration / frameRate, frameRate);
		addElement(id, comp);
		comp.parentFolder = mainFolder;
	}

	function setCompWorkArea(inPoint, outPoint, id) {
		var destComp = getElementById(id);
		destComp.workAreaStart = inPoint;
		destComp.workAreaDuration = Math.max(0.1, outPoint - inPoint);
	}

	function createNull(duration, elementId, parentCompId) {
		var comp = getElementById(parentCompId);
		var element = comp.layers.addNull(duration / frameRate);
		addElement(elementId, element);
	}

	function createSolid(color, name, width, height, duration, elementId, parentCompId) {
		var comp = getElementById(parentCompId);
		var element = comp.layers.addSolid(color, name, width, height, 1, duration / frameRate);
		addElement(elementId, element);
	}

	function createShapeLayer(elementId, parentCompId) {
		var comp = getElementById(parentCompId);
		var element = comp.layers.addShape();
		addElement(elementId, element);
	}

	function createTextLayer(elementId, parentCompId) {
		var comp = getElementById(parentCompId);
		var element = comp.layers.addText('');
		addElement(elementId, element);
	}

	function addComposition(compSourceId, parentCompId, elementId) {
		var comp = getElementById(compSourceId);
		var parentComp = getElementById(parentCompId);
		var compLayer = parentComp.layers.add(comp);
		addElement(elementId, compLayer);
	}

	function addImageLayer(imageSourceId, parentCompId, elementId) {
		var image = getElementById(imageSourceId);
		var parentComp = getElementById(parentCompId);
		var imageLayer = parentComp.layers.add(image);
		addElement(elementId, imageLayer);
	}

	function setFrameRate(value) {
		frameRate = value;
	}

	function setElementTemporalKeyAtIndex(propertyName, index, inInfluences, inSpeeds, outInfluences, outSpeeds, elementId) {
		var element = getElementById(elementId);
		var property = element.property(propertyName);
		var inEases = [];
		var outEases = [];
		for (var i = 0; i < inInfluences.length; i += 1) {
			var easeIn = new KeyframeEase(inSpeeds[i], inInfluences[i]);
			inEases.push(easeIn);
			var easeOut = new KeyframeEase(outSpeeds[i], outInfluences[i]);
			outEases.push(easeOut);
		}
		property.setTemporalEaseAtKey(index, inEases, outEases);

	}

	var keyInterpolatioTypes = {
		1: KeyframeInterpolationType.LINEAR,
		2: KeyframeInterpolationType.BEZIER,
		3: KeyframeInterpolationType.HOLD,
	}

	function getKeyInterpolationType(type) {
		return keyInterpolatioTypes[type] || keyInterpolatioTypes[1];
	}

	function setInterpolationTypeAtKey(propertyName, index, elementId, type) {
		var element = getElementById(elementId);
		var property = element.property(propertyName);
		property.setInterpolationTypeAtKey(index, getKeyInterpolationType(2), getKeyInterpolationType(type));
	}

	function separateDimensions(elementId) {
		var element = getElementById(elementId);
		var property = element.property('Position');
		property.dimensionsSeparated = true;
	}

	function setSpatialTangentsAtKey(propertyName, index, inTangents, outTangents, elementId) {
		var element = getElementById(elementId);
		var property = element.property(propertyName);
		property.setSpatialTangentsAtKey(index, inTangents, outTangents);
	}

	function formatValue(propertyName, value) {
		if (typeof value === 'object' && value.i) {
			var sVerts= value.v;
			var sITans= value.i;
			var sOTans = value.o;
			var sShape = new Shape(); 
			sShape.vertices = sVerts; 
			sShape.inTangents = sITans; 
			sShape.outTangents = sOTans; 
			sShape.closed = value.c;
			return sShape;
		} else {
			return value;
		}
	}

	function setElementPropertyValue(propertyName, value, elementId) {
		var element = getElementById(elementId);
		if (propertyName === 'name') {
			element[propertyName] = decodeURIComponent(value);
		} else {
			element[propertyName].setValue(formatValue(propertyName, value));
		}
	}

	function setElementPropertyExpression(propertyName, value, elementId) {
		var element = getElementById(elementId);
		element[propertyName].expression = decodeURIComponent(value);
	}

	function setElementKey(propertyName, time, value, elementId) {
		var element = getElementById(elementId);
		// This case is now handled entirely by the new gradient functions.
		if (propertyName === 'Colors') {
			// This path should not be taken for gradients anymore.
		} else {
			element[propertyName].setValueAtTime(time / frameRate, formatValue(propertyName, value));
		}
	}


	function setLayerParent(layerId, parentLayerId) {
		var layer = getElementById(layerId);
		var parent = getElementById(parentLayerId);
		layer.setParentWithJump(parent);
	}

	function setLayerStartTime(layerId, time) {
		var layer = getElementById(layerId);
		layer.startTime = time / frameRate;
	}

	function setLayerInPoint(layerId, time) {
		var layer = getElementById(layerId);
		layer.inPoint = time / frameRate;
	}

	function setLayerName(layerId, name) {
		var layer = getElementById(layerId);
		layer.name = decodeURIComponent(name);
	}

	function setElementAsDisabled(elementId, name) {
		var element = getElementById(elementId);
		element.enabled = false;
	}

	function setLayerOutPoint(layerId, time) {
		var layer = getElementById(layerId);
		layer.outPoint = time / frameRate;
	}

	function setLayerStretch(layerId, stretch) {
		var layer = getElementById(layerId);
		layer.stretch = stretch;
	}

	function createShapeGroup(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Group");
		addElement(elementId, elementProperty);
	}

	function createRectangle(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Shape - Rect");
		addElement(elementId, elementProperty);
	}

	function createEllipse(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Shape - Ellipse");
		addElement(elementId, elementProperty);
	}

	function createStar(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Shape - Star");
		addElement(elementId, elementProperty);
	}

	function createFill(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Graphic - Fill");
		addElement(elementId, elementProperty);
	}
	
	function createStroke(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Graphic - Stroke");
		addElement(elementId, elementProperty);
	}

	function createRepeater(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Filter - Repeater");
		addElement(elementId, elementProperty);
	}

	function createRoundedCorners(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Filter - RC");
		addElement(elementId, elementProperty);
	}

	function createTrimPath(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Filter - Trim");
		addElement(elementId, elementProperty);
	}

	function createShape(elementId, containerId) {
		var element = getElementById(containerId);
		var property = element.property("Contents");
		var elementProperty = property.addProperty("ADBE Vector Shape - Group");
		addElement(elementId, elementProperty);
	}

	function getJustification(value) {
        switch (value) {
        case 0:
            return ParagraphJustification.LEFT_JUSTIFY;
        case 1:
            return ParagraphJustification.RIGHT_JUSTIFY;
        case 2:
            return ParagraphJustification.CENTER_JUSTIFY;
        case 3:
            return ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT;
        case 4:
            return ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT;
        case 5:
            return ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER;
        case 6:
            return ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL;
        default:
            return ParagraphJustification.LEFT_JUSTIFY;
        }
    }

    function buildTextDocument(textDocument, text, fontSize, font, fillColor, tracking, justification, baselineShift) {
    	try {
    		textDocument.text = text;
    		textDocument.justification = getJustification(justification);
    		textDocument.font = decodeURIComponent(font);
    		textDocument.baselineShift = baselineShift;
    		textDocument.fontSize = fontSize;
    		textDocument.fillColor = fillColor;
    		textDocument.tracking = tracking;
    	} catch(error) {
    		bm_eventDispatcher.log(error.message)
    	}
    }

	function setTextDocumentValue(sourceTextId, text, fontSize, font, fillColor, tracking, justification, baselineShift) {
		var layer = getElementById(sourceTextId);
		var textDocument = new TextDocument(text);
		layer.property("Source Text").setValue(textDocument);
		textDocument = layer.property("Source Text").value;
		buildTextDocument(textDocument, text, fontSize, font, fillColor, tracking, justification, baselineShift)
		layer.property("Source Text").setValue(textDocument);
	}

    function setTextDocumentValueAtTime(sourceTextId, time, text, fontSize, font, fillColor, tracking, justification, baselineShift) {
    	var layer = getElementById(sourceTextId);
    	var textDocument = new TextDocument(text);
    	layer.property("Source Text").setValueAtTime(time / frameRate, textDocument);
    	textDocument = layer.property("Source Text").value;
    	buildTextDocument(textDocument, text, fontSize, font, fillColor, tracking, justification, baselineShift)
    	layer.property("Source Text").setValueAtTime(time / frameRate, textDocument);
    }

	var maskModes = {
		a: MaskMode.ADD,
		s: MaskMode.SUBTRACT,
		i: MaskMode.INTERSECT,
		l: MaskMode.LIGHTEN,
		d: MaskMode.DARKEN,
		f: MaskMode.DIFFERENCE,
	}

	var trackMatteModes = {
		1: TrackMatteType.ALPHA,
		2: TrackMatteType.ALPHA_INVERTED,
		3: TrackMatteType.LUMA,
		4: TrackMatteType.LUMA_INVERTED,
	}


	function getMaskMode(mode) {
		return maskModes[mode] || maskModes.a;
	}

	function getTrackMatteMode(mode) {
		return trackMatteModes[mode] || trackMatteModes[1];
	}

	function createMask(maskId, layerId, maskMode, isInverted) {
		var element = getElementById(layerId);
		var mask = element.Masks.addProperty("Mask");
		addElement(maskId, mask);
		mask.maskMode = getMaskMode(maskMode);
		mask.inverted = isInverted;
	}

	function setTrackMatte(layerId, trackMatteMode) {
		var element = getElementById(layerId);
		element.trackMatteType = getTrackMatteMode(trackMatteMode);
	}

	function assignIdToProp(propName, elementId, containerId) {
		var element = getElementById(containerId);
		var elementProperty = element.property(propName);
		addElement(elementId, elementProperty);
	}

	function importFile(jsonPath, fileRelativePath, assetId) {
		var importFileOptions = new ImportOptions();
		var file = new File(decodeURIComponent(jsonPath));
		file.changePath(decodeURIComponent(fileRelativePath));
		if (file.exists) {
			importFileOptions.file = file;
		}
		var footage = app.project.importFile(importFileOptions);
		addElement(assetId, footage);
	}

	function addFootageToMainFolder(footageList) {
		var i, len = footageList.length;
		for (i = 0; i < len; i += 1) {
			var footage = getElementById(footageList[i]);
			footage.parentFolder = mainFolder;
		}
	}

	// =================================================================================================
	// =================================================================================================
	// START OF NEW GRADIENT FUNCTIONS
	// =================================================================================================
	// =================================================================================================

	// Sets a property value, creating keyframes if the data is animated.
	function setAnimatableProperty(prop, data) {
		if (data.a === 1) { // If animated
			// Note: This simplified version does not handle easing.
			// A full implementation would need to parse temporal ease properties (o, i)
			// and spatial tangents for path data.
			for (var i = 0; i < data.k.length; i++) {
				var key = data.k[i];
				if(key.s) {
					var time = key.t / frameRate;
					var value = formatValue(null, key.s);
					prop.setValueAtTime(time, value);
				}
			}
		} else { // If static
			var staticValue = formatValue(null, data.k);
			prop.setValue(staticValue);
		}
	}

	// Master function to apply a gradient preset and set its values.
	// This function contains the core workaround logic.
	function createAndApplyGradient(container, gradientData, propertyMatchName) {
		try {
			var stops = [];
			var rawStops = gradientData.g.k.k;
			if (typeof rawStops[0] !== 'number') {
				// Fallback for incorrectly structured static gradient data
				rawStops = rawStops[0].s ? rawStops[0].s[0] : rawStops[0];
			}
			
			// Deconstruct the flat array of stops from Lottie into an array of objects
			for(var i = 0; i < gradientData.g.p; i++) {
				stops.push({
					position: rawStops[i * 4],
					color: [rawStops[i * 4 + 1], rawStops[i * 4 + 2], rawStops[i * 4 + 3]],
					// Lottie format doesn't have a separate alpha ramp, so opacity is always 1
					opacity: 1, 
					midPoint: 0.5 // Default midpoint
				});
			}

			// Dynamically generate the XML part of the .ffx file
			var ffxString = generateFfxString(stops, propertyMatchName);
			if (!ffxString) {
				bm_eventDispatcher.log("Could not generate .ffx string.");
				return null;
			}

			// Write the dynamically generated string to a temporary file
			var tempFile = new File(Folder.temp.fsName + "/bm_temp_grad.ffx");
			tempFile.encoding = "BINARY";
			tempFile.open("w");
			tempFile.write(ffxString);
			tempFile.close();
			
			if (!tempFile.exists) {
				bm_eventDispatcher.log("Failed to create temporary preset file.");
				return null;
			}
			
			// Get the parent layer of the shape group where the gradient will be added
			var targetLayer = container.propertyGroup(container.propertyDepth);

			// Apply the preset. This is the magic that creates the gradient property
			// with a scriptable color ramp.
			targetLayer.applyPreset(tempFile);

			// Find the newly created property. It should be the last one.
			var gradientProperty = container.property("Contents").property(container.property("Contents").numProperties);
			
			// Check if the preset application was successful
			if (gradientProperty.matchName !== propertyMatchName) {
				bm_eventDispatcher.log("Applying preset failed to create the correct gradient property. Expected: " + propertyMatchName + " but got: " + gradientProperty.matchName);
				tempFile.remove();
				return null;
			}
			
			// --- Set the rest of the gradient properties from the Lottie data ---
			gradientProperty.name = decodeURIComponent(gradientData.nm);
			setAnimatableProperty(gradientProperty.property("Opacity"), gradientData.o);
			setAnimatableProperty(gradientProperty.property("Start Point"), gradientData.s);
			setAnimatableProperty(gradientProperty.property("End Point"), gradientData.e);
			gradientProperty.property("Type").setValue(gradientData.t === 1 ? 1 : 2); // 1: Linear, 2: Radial
			
			// If the gradient is animated, we have to set keyframes on the "Colors" property
			if (gradientData.g.a === 1) {
				var colorsProp = gradientProperty.property("Colors");
				for(var k = 0; k < gradientData.g.k.length; k += 1) {
					var keyData = gradientData.g.k[k];
					var time = keyData.t / frameRate;
					var value = keyData.s[0]; // The value is a flat array [pos1, r1, g1, b1, ...]
					colorsProp.setValueAtTime(time, value);
				}
			}

			// Clean up the temp file
			tempFile.remove();
			
			return gradientProperty;

		} catch(e) {
			bm_eventDispatcher.log("Error applying gradient: " + e.toString() + " on line: " + e.line);
			// Ensure cleanup on error
			var tempFileOnErr = new File(Folder.temp.fsName + "/bm_temp_grad.ffx");
			if (tempFileOnErr && tempFileOnErr.exists) {
				tempFileOnErr.remove();
			}
			return null;
		}
	}

	// Generates the full binary-and-xml string for a .ffx file
	function generateFfxString(stops, propertyMatchName) {
		
		// The binary header seems mostly static, with some bytes indicating content length.
		// For simplicity, we use a slightly oversized-but-functional header.
		// This header is derived from a minimal 2-stop gradient preset.
		var header = "RIFX\x00\x00\x00\x00FaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00W\x00\x00\x00\x01\x00\x00\x00\x00LIST\x00\x00\x00\x00bescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x18\x00\x00\x00\x00\x00\x04\x00\x01\x00\x01\x07\u0080\x048?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x01\u0084tdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x05LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Root Vectors Group\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(ADBE Vector Group\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Vectors Group\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x02tdmn\x00\x00\x00(" + propertyMatchName + "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Vector Grad Colors\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x07Colors\x00\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x07\u00E8GCstLIST\x00\x00\x00\u00B0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Colors\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x07\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x01\x00\b\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00\x04\x00\x00\x00\x00LIST\x00\x00\x07$GCkyUtf8\x00\x00";

		var stopsCount = stops.length;
		
		// Dynamically build the XML content
		var alphaStopsList = '';
		var colorStopsList = '';
		
		for (var i = 0; i < stopsCount; i++) {
			var stop = stops[i];
			alphaStopsList += "<prop.pair>\n<key>Stop-" + i + "</key>\n<prop.list>\n<prop.pair>\n<key>Stops Alpha</key>\n<array>\n<array.type><float/></array.type>\n<float>" + stop.position.toFixed(8) + "</float>\n<float>" + stop.midPoint.toFixed(8) + "</float>\n<float>" + stop.opacity.toFixed(8) + "</float>\n</array>\n</prop.pair>\n</prop.list>\n</prop.pair>\n";
			colorStopsList += "<prop.pair>\n<key>Stop-" + i + "</key>\n<prop.list>\n<prop.pair>\n<key>Stops Color</key>\n<array>\n<array.type><float/></array.type>\n<float>" + stop.position.toFixed(8) + "</float>\n<float>" + stop.midPoint.toFixed(8) + "</float>\n<float>" + stop.color[0].toFixed(8) + "</float>\n<float>" + stop.color[1].toFixed(8) + "</float>\n<float>" + stop.color[2].toFixed(8) + "</float>\n<float>1</float>\n</array>\n</prop.pair>\n</prop.list>\n</prop.pair>\n";
		}
		
		var xmlContent = "<?xml version='1.0'?>\n<prop.map version='4'>\n<prop.list>\n<prop.pair>\n<key>Gradient Color Data</key>\n<prop.list>\n<prop.pair>\n<key>Alpha Stops</key>\n<prop.list>\n<prop.pair>\n<key>Stops List</key>\n<prop.list>\n" + alphaStopsList + "</prop.list>\n</prop.pair>\n<prop.pair>\n<key>Stops Size</key>\n<int type='unsigned' size='32'>" + stopsCount + "</int>\n</prop.pair>\n</prop.list>\n</prop.pair>\n<prop.pair>\n<key>Color Stops</key>\n<prop.list>\n<prop.pair>\n<key>Stops List</key>\n<prop.list>\n" + colorStopsList + "</prop.list>\n</prop.pair>\n<prop.pair>\n<key>Stops Size</key>\n<int type='unsigned' size='32'>" + stopsCount + "</int>\n</prop.pair>\n</prop.list>\n</prop.pair>\n</prop.list>\n</prop.pair>\n<prop.pair>\n<key>Gradient Colors</key>\n<string>1.0</string>\n</prop.pair>\n</prop.list>\n</prop.map>\n";

		var footer = '<?xpacket begin="\u00EF\u00BB\u00BF" id="W5M0MpCehiHzreSzNTczkc9d"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c014 79.156821, 2014/08/29-03:07:50 ">\n <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n  <rdf:Description rdf:about=""\n    xmlns:dc="http://purl.org/dc/elements/1.1/"\n    xmlns:xmp="http://ns.adobe.com/xap/1.0/">\n   <dc:format>application/vnd.adobe.aftereffects.preset-animation</dc:format>\n   <xmp:CreatorTool>Bodymovin Lottie Importer</xmp:CreatorTool>\n  </rdf:Description>\n </rdf:RDF>\n</x:xmpmeta>\n<?xpacket end="w"?>';

		return header + xmlContent + footer;
	}

	// This function is now the primary entry point for creating gradient fills.
	function createGradientFill(elementId, containerId, gradientDataString) {
		var container = getElementById(containerId);
		var gradientData = JSON.parse(gradientDataString);
		// Call the master gradient function for a Fill
		var gradientProperty = createAndApplyGradient(container, gradientData, "ADBE Vector Graphic - G-Fill");
		if (gradientProperty) {
			addElement(elementId, gradientProperty);
		} else {
			bm_eventDispatcher.log('Could not create gradient fill for elementId: ' + elementId);
		}
	}
	
	// This function is now the primary entry point for creating gradient strokes.
	function createGradientStroke(elementId, containerId, gradientDataString) {
		var container = getElementById(containerId);
		var gradientData = JSON.parse(gradientDataString);
		// Call the master gradient function for a Stroke
		var gradientProperty = createAndApplyGradient(container, gradientData, "ADBE Vector Graphic - G-Stroke");
		if (gradientProperty) {
			addElement(elementId, gradientProperty);
		} else {
			bm_eventDispatcher.log('Could not create gradient stroke for elementId: ' + elementId);
		}
	}
	
	// =================================================================================================
	// END OF NEW GRADIENT FUNCTIONS
	// =================================================================================================

	function reset() {
		elements = {};
		mainFolder = null;
	}

	ob.reset = reset;
	ob.createFolder = createFolder;
	ob.createComp = createComp;
	ob.setCompWorkArea = setCompWorkArea;
	ob.createNull = createNull;
	ob.createSolid = createSolid;
	ob.createShapeLayer = createShapeLayer;
	ob.createTextLayer = createTextLayer;
	ob.addComposition = addComposition;
	ob.addImageLayer = addImageLayer;
	ob.setFrameRate = setFrameRate;
	ob.setElementPropertyValue = setElementPropertyValue;
	ob.setElementPropertyExpression = setElementPropertyExpression;
	ob.setElementKey = setElementKey;
	ob.setElementTemporalKeyAtIndex = setElementTemporalKeyAtIndex;
	ob.setInterpolationTypeAtKey = setInterpolationTypeAtKey;
	ob.separateDimensions = separateDimensions;
	ob.setSpatialTangentsAtKey = setSpatialTangentsAtKey;
	ob.setLayerParent = setLayerParent;
	ob.setLayerStartTime = setLayerStartTime;
	ob.setLayerStretch = setLayerStretch;
	ob.setLayerInPoint = setLayerInPoint;
	ob.setLayerName = setLayerName;
	ob.setElementAsDisabled = setElementAsDisabled;
	ob.setLayerOutPoint = setLayerOutPoint;
	ob.createShapeGroup = createShapeGroup;
	ob.createRectangle = createRectangle;
	ob.createEllipse = createEllipse;
	ob.createStar = createStar;
	ob.createFill = createFill;
	ob.createStroke = createStroke;
	ob.createGradientFill = createGradientFill;
	ob.createGradientStroke = createGradientStroke;
	ob.createShape = createShape;
	ob.createRepeater = createRepeater;
	ob.createRoundedCorners = createRoundedCorners;
	ob.createTrimPath = createTrimPath;
	ob.createMask = createMask;
	ob.setTrackMatte = setTrackMatte;
	ob.assignIdToProp = assignIdToProp;
	ob.importFile = importFile;
	ob.addFootageToMainFolder = addFootageToMainFolder;
	ob.setTextDocumentValue = setTextDocumentValue;
	ob.setTextDocumentValueAtTime = setTextDocumentValueAtTime;
    
    return ob;
}());
