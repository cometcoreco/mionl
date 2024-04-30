const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { readPsd, writePsd, updateLayerText, writePsdBuffer } = require('ag-psd');
const { createCanvas } = require('canvas');
const { initializeCanvas } = require('ag-psd');
const PSD = require('psd');
const Canvas = require('canvas');
const Image = Canvas.Image;

initializeCanvas(createCanvas);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/write', upload.fields([{ name: 'psd_file', maxCount: 1 }, { name: 'profile_image', maxCount: 1 }]), (req, res) => {
    const buffer = fs.readFileSync(req.files['psd_file'][0].path);
    const psd = readPsd(buffer);

    const firstNameToUpdate = psd.children.find(layer => layer.name === "first_name");

    if (firstNameToUpdate && firstNameToUpdate.text) {
        console.log(req.body.first_name)
        firstNameToUpdate.text.text = req.body.first_name; // Aquí se reemplaza el texto
    } else {
        console.log("No se encontró ningun first name");
    }
    const lastNameToUpdate = psd.children.find(layer => layer.name === "last_name")
    if (lastNameToUpdate && lastNameToUpdate.text) {
        console.log(req.body.last_name)
        lastNameToUpdate.text.text = req.body.last_name; // Aquí se reemplaza el texto
    } else {
        console.log("No se encontró ningun last name");
    }
    // Aquí se reemplaza la imagen del objeto inteligente
    const newImageBuffer = fs.readFileSync(req.files['profile_image'][0].path);
    const newImage8Array = new Uint8Array(newImageBuffer);
    console.log(newImage8Array)
    const newImageId = "20953ddb-9391-11ec-b4f1-c15674f50bc4"; // Este ID debe ser único
    psd.linkedFiles = [{
        id: newImageId,
        name: "Profile.png",
        data: newImage8Array
    }];
    const layerToUpdate = psd.children.find(layer => layer.name === "profile");

    layerToUpdate.placedLayer.id = newImageId;
    canvasUpdated = layerToUpdate

    // Aquí se reemplaza la imagen del objeto inteligente
    const img = new Image();
    img.onload = () => {
        // Create a new canvas and draw your image onto it
        const newCanvas = Canvas.createCanvas(img.width, img.height);
        const ctx = newCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
    
        // Find the layer you want to update
        const layerToUpdate = psd.children.find(layer => layer.name === 'profile');
    
        // Update the canvas property of the layer
        if (layerToUpdate && layerToUpdate.placedLayer) {
            const originalPlacedLayer = layerToUpdate.placedLayer;
            layerToUpdate.canvas = newCanvas;
            console.log(layerToUpdate)
            layerToUpdate.placedLayer = {
                id: originalPlacedLayer.id,
                placed: originalPlacedLayer.placed,
                type: originalPlacedLayer.type,
                transform: originalPlacedLayer.transform,
                width: originalPlacedLayer.width,
                height: originalPlacedLayer.height,
                resolution: originalPlacedLayer.resolution
            };
        } else {
            console.log("No se encontró la capa 'profiel'");
        }
    };
    img.onerror = err => { throw err };
    img.src = fs.readFileSync(req.files['profile_image'][0].path);

    const updatedPsdBuffer = writePsdBuffer(psd, { invalidateTextLayers: true });
    fs.writeFileSync('output.psd', updatedPsdBuffer);

    PSD.open('output.psd').then(function (psd) {
        return psd.image.saveAsPng('modified.png'); 
    }).then(function () {
        console.log('PSD converted to PNG successfully!');
        res.send('PSD converted to PNG successfully!');
    });
});

app.listen(3000, () => console.log('Server started on port 3000'));
