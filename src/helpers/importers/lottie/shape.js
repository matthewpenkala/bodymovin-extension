import commandHelper from './commandHelper'
import LottieImporter from './importer'
import {
  iterateProperties as iterateShapeProperties,
} from './property'
import {
  iterateProperties as iterateTextProperties,
} from './text'
import {
  iterateProperties as iterateTransformProperties,
} from './transform'
import {
  iterateProperties as iterateMasksProperties,
} from './mask'

function iterateShape(item, containerId) {
  if (item.ty === 'gr') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createShapeGroup, [elementId, containerId]);
    iterateProperties(item.it, elementId);
    iterateTransformProperties(item.it, elementId);
  } else if (item.ty === 'rc') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createRectangle, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'el') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createEllipse, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'sr') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createStar, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'fl') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createFill, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'st') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createStroke, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'rp') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createRepeater, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'rd') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createRoundedCorners, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'tm') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createTrimPath, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'sh') {
    let elementId = commandHelper.getId();
    commandHelper.add(LottieImporter.createShape, [elementId, containerId]);
    iterateShapeProperties(item, elementId);
  } else if (item.ty === 'tr') {
    // This is handled in iterateTransformProperties
  }
}

export function iterateProperties(properties, containerId) {
  properties.forEach(function(item) {
    let elementId;
    commandHelper.push();
    switch (item.ty) {
      case 'gr':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createShapeGroup, [elementId, containerId]);
        LottieImporter.setElementPropertyValue('name', item.nm, elementId);
        iterateProperties(item.it, elementId);
        iterateTransformProperties(item.it, elementId);
        break;
      case 'rc':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createRectangle, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'el':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createEllipse, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'sr':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createStar, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'fl':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createFill, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'st':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createStroke, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'gf':
        // MODIFIED: Use the new all-in-one gradient function
        elementId = commandHelper.getId();
        var gradientFillDataString = JSON.stringify(item);
        commandHelper.add(LottieImporter.createGradientFill, [elementId, containerId, gradientFillDataString]);
        // No longer calling iterateShapeProperties as the new function handles everything.
        break;
      case 'gs':
        // MODIFIED: Use the new all-in-one gradient function for strokes
        elementId = commandHelper.getId();
        var gradientStrokeDataString = JSON.stringify(item);
        commandHelper.add(LottieImporter.createGradientStroke, [elementId, containerId, gradientStrokeDataString]);
        // No longer calling iterateShapeProperties as the new function handles everything.
        break;
      case 'rp':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createRepeater, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'rd':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createRoundedCorners, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'tm':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createTrimPath, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'sh':
        elementId = commandHelper.getId();
        commandHelper.add(LottieImporter.createShape, [elementId, containerId]);
        iterateShapeProperties(item, elementId);
        break;
      case 'tr':
        break;
      default:
        // bm_eventDispatcher.log(item.ty)
    }
    commandHelper.pop();
  })
}

export function importShape(layer, elementId) {
  iterateProperties(layer.shapes, elementId);
}
