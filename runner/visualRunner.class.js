// Handle the image comparisons
const fs         = require('fs');
const PNG        = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const { uploadFile,
    downloadFile,
    checkFileExists,
    copyFile,
 }  = require('../libs/s3');

let VisualRunner = class {

    constructor(project, viewport, browser) {
        this.project = project;
        this.viewport = viewport;
        this.browser = browser;
    }

    set imageTitles(title) {
        this.current = 'current_' + this.viewport + '_' + this.browser + '_' + title + '.png';
        this.base = 'base_' + this.viewport + '_' + this.browser + '_' + title + '.png';
        this.diff = 'diff_' + this.viewport + '_' + this.browser + '_' + title + '.png';
        this.currentS3Path = `${this.project}/${this.current}`;
        this.baseS3Path = `${this.project}/${this.base}`;
        this.diffS3Path = `${this.project}/${this.diff}`;
        this.currentPath = `./${this.currentS3Path}`;
        this.basePath = `./${this.baseS3Path}`;
        this.diffPath = `./${this.diffS3Path}`;
    }

    copyCurrent(screenshot) {
        if(!fs.existsSync(this.project)) fs.mkdirSync(this.project);
        if(fs.existsSync(screenshot)) {
            fs.copyFileSync(screenshot, this.currentPath);
        }
    }

    async checkBase(image) {
        const baseImage = await checkFileExists(`${this.project}/${this.base}`);
        if (baseImage) {
            if(!fs.existsSync(this.project)) fs.mkdirSync(this.project);
            await downloadFile(this.baseS3Path, this.basePath);

            return true;
        } else {
            copyFile(image, this.baseS3Path);

            return false;
        }
    }

    comparePixels() {
        const current = PNG.sync.read(fs.readFileSync(this.currentPath));
        const base = PNG.sync.read(fs.readFileSync(this.basePath));
        const {width, height} = current;
        const diff = new PNG({width, height});
        
        const numDiffPixels = pixelmatch(current.data, base.data, diff.data, width, height, {threshold: 0.1});
        
        fs.writeFileSync(this.diffPath, PNG.sync.write(diff));

        uploadFile(this.currentPath, this.currentS3Path);
        uploadFile(this.diffPath, this.diffS3Path);

        return numDiffPixels;
    }

    formatResults(msg, pixel, ai = "", markup = "") {
        return {
            result: msg,
            base: this.baseS3Path,
            current: this.currentS3Path,
            diff: this.diffS3Path,
            pixel: pixel,
            ai: ai,
            markup: markup,
        }
    }
};

module.exports = VisualRunner;
