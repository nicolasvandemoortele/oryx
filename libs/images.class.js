// Handle the image comparisons
const fs         = require('fs');
const PNG        = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const { uploadFile,
    downloadFile,
    checkFileExists
 }  = require('s3');

let Screenshot = class {

    constructor(project, image, folder, viewport, browser) {
        this.project = project;
        this.source = image;
        this.current = 'current_' + viewport + '_' + browser + '_' + image;
        this.base = 'base_' + viewport + '_' + browser + '_' + image;
        this.diff = 'diff_' + viewport + '_' + browser + '_' + image;
        this.folder = folder;
    }

    async checkBase() {
        const baseImage = await checkFileExists(`${this.project}/${this.base}`);
        if (baseImage) {
            await downloadFile(this.project, this.base, `./${this.folder}`);

            return true;
        } else {
            uploadFile(this.source, this.folder, `${this.project}/${this.base}`);

            return false;
        }
    }

    comparePixels() {
        const img1 = PNG.sync.read(fs.readFileSync(`${this.folder}${this.source}`));
        const img2 = PNG.sync.read(fs.readFileSync(`${this.folder}${this.base}`));
        const {width, height} = img1;
        const diff = new PNG({width, height});
        
        const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
        
        fs.writeFileSync(`${this.folder}${this.diff}`, PNG.sync.write(diff));

        uploadFile(this.source, `${this.project}/${this.current}`);
        uploadFile(this.diff, `${this.project}/${this.diff}`);

        return numDiffPixels;
    }
};

module.exports = Screenshot;
